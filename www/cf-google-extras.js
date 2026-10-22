/* Servicios opcionales Google: Calendar y Gmail. Nunca se ejecutan sin sesión activa.
 * Calendar: evento completo; Gmail: envío explícito del PDF autorizado.
 */
(function(root){'use strict';
 const account=()=>{const s=root.CFGoogleAccount?.active();if(!s?.id||!s.token)throw Error('Conecta tu cuenta de Google antes de continuar.');return s;};
 function same(s){const x=root.CFGoogleAccount?.active();if(!x||x.email!==s.email||x.id!==s.id||x.token!==s.token)throw Error('La cuenta cambió durante la operación: vuelve a iniciar sesión.');}
 async function request(s,url,method,body){same(s);const response=await root.fetch(url,{method,headers:{Authorization:'Bearer '+s.token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const data=await response.json().catch(()=>({}));same(s);if(!response.ok)throw Error('Google HTTP '+response.status+': '+String(data.error?.message||'permisos insuficientes; revisa las API activadas y vuelve a iniciar sesión').slice(0,220));return data;}
 function calendarBody(ev){
  if(!/^\d{4}-\d\d-\d\d$/.test(String(ev.fecha||'')))throw Error('Fecha de evento incorrecta.');
  const tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'Europe/Madrid';
  const body={summary:ev.evento,location:ev.ubicacion||'',description:[ev.cliente&&'Cliente: '+ev.cliente,ev.llevar&&'Material: '+ev.llevar,ev.comentarios].filter(Boolean).join('\n')};
  if(/^\d\d:\d\d$/.test(ev.horaInicio||'')){
    const from=ev.horaInicio;
    const starts=Number(from.slice(0,2))*60+Number(from.slice(3,5));
    const hasEnd=/^\d\d:\d\d$/.test(ev.horaFin||'');
    let ends=hasEnd?Number(ev.horaFin.slice(0,2))*60+Number(ev.horaFin.slice(3,5)):starts+60;
    const nextDay=ends<=starts||ends>=1440;
    ends%=1440;
    let date=ev.fecha;if(nextDay){const d=new Date(ev.fecha+'T12:00:00');d.setDate(d.getDate()+1);date=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
    const until=String(Math.floor(ends/60)).padStart(2,'0')+':'+String(ends%60).padStart(2,'0');
    body.start={dateTime:ev.fecha+'T'+from+':00',timeZone:tz};body.end={dateTime:date+'T'+until+':00',timeZone:tz};
  }else{const d=new Date(ev.fecha+'T12:00:00');d.setDate(d.getDate()+1);const next=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');body.start={date:ev.fecha};body.end={date:next};}
  return body;
 }
 async function deterministicCalendarId(s,id){
  if(!root.crypto?.subtle||!root.TextEncoder)throw Error('No está disponible la firma segura para identificar el evento en Google Calendar.');
  const bytes=new root.TextEncoder().encode(s.id+'|'+id);
  const hash=new Uint8Array(await root.crypto.subtle.digest('SHA-256',bytes));
  return 'cf'+Array.from(hash.slice(0,16),b=>b.toString(16).padStart(2,'0')).join('');
 }
 async function upsertCalendar(ev){
  const s=account(),body=calendarBody(ev),base='https://www.googleapis.com/calendar/v3/calendars/primary/events';
  const id=ev.googleCalendarId||await deterministicCalendarId(s,ev.id);
  if(ev.googleCalendarId){
   try{const result=await request(s,base+'/'+encodeURIComponent(id),'PUT',body);return {id:result.id,htmlLink:result.htmlLink||''};}
   catch(e){if(!/HTTP 404/.test(String(e)))throw e;}
  }
  try{const result=await request(s,base,'POST',{...body,id});return {id:result.id,htmlLink:result.htmlLink||''};}
  catch(e){
    // Reintentos entre dispositivos: si el evento ya existe, actualizarlo,
    // no duplicarlo. Google Calendar admite IDs de evento personalizados.
    if(!/HTTP 409/.test(String(e)))throw e;
    const result=await request(s,base+'/'+encodeURIComponent(id),'PUT',body);
    return {id:result.id,htmlLink:result.htmlLink||''};
  }
 }
 async function deleteCalendar(ev){if(!ev?.googleCalendarId)return;const s=account();same(s);const r=await root.fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events/'+encodeURIComponent(ev.googleCalendarId),{method:'DELETE',headers:{Authorization:'Bearer '+s.token}});same(s);if(!r.ok&&r.status!==404&&r.status!==410)throw Error('No se pudo borrar el evento de Google Calendar: HTTP '+r.status);}
 function utf8base64(text){const b=new TextEncoder().encode(text);let v='';for(let i=0;i<b.length;i+=16384)v+=String.fromCharCode(...b.subarray(i,i+16384));return root.btoa(v);}
 function base64url(raw){return utf8base64(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');}
 async function sendInvoice({recipient,number,pdfBase64,issuer}){
  const s=account();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(recipient||'')))throw Error('El correo del cliente no es válido.');
  if(!/^[A-Za-z0-9+/]+=*$/.test(pdfBase64||''))throw Error('Falta el PDF de la factura.');
  if(pdfBase64.length>8*1024*1024)throw Error('El PDF es demasiado grande para enviarlo.');
  const subject='Factura '+number+' · '+(issuer||'Control Fiscal');
  const boundary='cfmail_'+Date.now().toString(36);
  const body=[
   'MIME-Version: 1.0','To: '+recipient,'From: '+s.email,
   'Subject: =?UTF-8?B?'+utf8base64(subject)+'?=',
   'Content-Type: multipart/mixed; boundary="'+boundary+'"','','--'+boundary,
   'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',
   utf8base64('Adjuntamos copia de la factura '+number+'.\n\n'+(issuer||'Control Fiscal')+'\n'),'--'+boundary,
   'Content-Type: application/pdf; name="Factura.pdf"','Content-Disposition: attachment; filename="Factura.pdf"',
   'Content-Transfer-Encoding: base64','',pdfBase64.match(/.{1,76}/g).join('\r\n'),'--'+boundary+'--',''
  ].join('\r\n');
  const out=await request(s,'https://gmail.googleapis.com/gmail/v1/users/me/messages/send','POST',{raw:base64url(body)});
  if(!out.id)throw Error('Gmail no ha confirmado el envío.');return {id:out.id};
 }
 root.CFGoogleExtras=Object.freeze({calendarBody,upsertCalendar,deleteCalendar,sendInvoice});
})(window);
