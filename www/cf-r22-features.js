/* Control Fiscal R22 — contactos, pagos parciales, y operaciones del calendario.
   Toda la información fiscal queda en Google Sheets/Drive del usuario.
   Firebase sigue almacenando exclusivamente las sugerencias autorizadas. */
(function(root){'use strict';
const $=id=>root.document.getElementById(id);
const text=v=>String(v??'').trim();
const money=n=>(Number(n)||0).toLocaleString('es-ES',{style:'currency',currency:'EUR'});
const number=n=>Math.round((Number(n)||0)*100)/100;
const COUNTRY_CODES=Object.freeze({ES:'34',PT:'351',FR:'33',DE:'49',IT:'39',GB:'44',IE:'353',NL:'31',BE:'32',CH:'41',AT:'43',PL:'48',CZ:'420',SK:'421',HU:'36',RO:'40',BG:'359',GR:'30',HR:'385',SI:'386',DK:'45',SE:'46',NO:'47',FI:'358',IS:'354',EE:'372',LV:'371',LT:'370',LU:'352',MT:'356',CY:'357',US:'1',CA:'1',MX:'52',BR:'55',AR:'54',CL:'56',CO:'57',PE:'51',VE:'58',UY:'598',PY:'595',BO:'591',EC:'593',CR:'506',PA:'507',GT:'502',HN:'504',SV:'503',NI:'505',DO:'1',CU:'53',MA:'212',DZ:'213',TN:'216',ZA:'27',EG:'20',NG:'234',TR:'90',IL:'972',AE:'971',SA:'966',IN:'91',CN:'86',JP:'81',KR:'82',AU:'61',NZ:'64',PH:'63',TH:'66',SG:'65',ID:'62',MY:'60'});
const COUNTRY_NAMES={ES:'España',PT:'Portugal',FR:'Francia',DE:'Alemania',IT:'Italia',GB:'Reino Unido',IE:'Irlanda',NL:'Países Bajos',BE:'Bélgica',CH:'Suiza',US:'Estados Unidos',CA:'Canadá',MX:'México',AR:'Argentina',CL:'Chile',CO:'Colombia',PE:'Perú',BR:'Brasil',MA:'Marruecos'};
function detectedCountry(){
 const langs=(root.navigator?.languages?.length?root.navigator.languages:[root.navigator?.language||'']).filter(Boolean);
 for(const locale of langs){try{const country=new Intl.Locale(locale).region;if(country&&COUNTRY_CODES[country])return country;}catch(_){}}
 return '';
}
function countryFor(kind){return $('cfR22Country_'+kind)?.value||detectedCountry();}
function mountCountry(kind){
 const parent=$(kind==='income'?'cfR22IncomeCountry':'cfR22PaymentCountry');if(!parent)return;
 parent.replaceChildren();const sel=root.document.createElement('select');sel.id='cfR22Country_'+kind;sel.setAttribute('aria-label','País para el prefijo telefónico');
 const blank=root.document.createElement('option');blank.value='';blank.textContent='Selecciona país';sel.appendChild(blank);
 for(const [key,dial] of Object.entries(COUNTRY_CODES).sort((a,b)=>(COUNTRY_NAMES[a[0]]||a[0]).localeCompare(COUNTRY_NAMES[b[0]]||b[0],'es'))){const option=root.document.createElement('option');option.value=key;option.textContent=(COUNTRY_NAMES[key]||key)+' (+'+dial+')';sel.appendChild(option);}
 sel.value=detectedCountry();parent.appendChild(sel);
 const info=root.document.createElement('small');info.className='settingsHint';info.textContent='Prefijo propuesto por la región del teléfono. Comprueba el país del cliente antes de enviar.';parent.appendChild(info);
}
function normalized(phone,country){
 const raw=text(phone),clean=raw.replace(/[^\d+]/g,'');
 if(!clean)return '';
 if(clean.startsWith('+'))return /^\+[0-9]{7,15}$/.test(clean)?clean:'';
 if(clean.startsWith('00')){const code='+'+clean.slice(2);return /^\+[0-9]{7,15}$/.test(code)?code:'';}
 const dial=COUNTRY_CODES[country];if(!dial)return '';
 let digits=clean.replace(/\D/g,'');
 // Muchos países usan 0 como prefijo nacional; Italia, entre otros, lo conservan.
 if(digits.startsWith('0')&&!['IT','GB'].includes(country))digits=digits.slice(1);
 if(country==='GB'&&digits.startsWith('0'))digits=digits.slice(1);
 const e164='+'+dial+digits;
 return /^\+[0-9]{7,15}$/.test(e164)?e164:'';
}
function normalizeContactPhone(kind){
 const input=$(kind==='income'?'pendingPhone':'cfR20PaymentPhone');if(!input||!text(input.value))return '';
 return normalized(input.value,countryFor(kind));
}
function setContact(kind,contact){
 const phone=$(kind==='income'?'pendingPhone':'cfR20PaymentPhone'),email=$(kind==='income'?'pendingEmail':'cfR20PaymentEmail');
 if(kind==='income'&&$('pendingPerson'))$('pendingPerson').value=contact.nombre||'';
 if(phone&&contact.telefono)phone.value=contact.telefono;
 if(email&&contact.email)email.value=contact.email;
 const status=$(kind==='income'?'pendingIncomeMsg':'cfR20PaymentStatus');if(status){status.className='msg';status.textContent='Contacto seleccionado. Comprueba teléfono, país y destinatario antes de enviar.';}
}
let pickerKind='payment';
function ensurePicker(){
 let modal=$('cfR22ContactModal');if(modal)return modal;
 modal=root.document.createElement('div');modal.id='cfR22ContactModal';modal.className='modal hidden';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
 modal.innerHTML='<div class="modalCard"><button type="button" class="modalClose" id="cfR22ContactClose">×</button><h3>👤 Seleccionar cliente</h3><input class="input" id="cfR22ContactSearch" placeholder="Buscar cliente" aria-label="Buscar cliente"><div id="cfR22ContactList"></div></div>';
 modal.onclick=e=>{if(e.target===modal)modal.classList.add('hidden');};root.document.body.appendChild(modal);
 $('cfR22ContactClose').onclick=()=>modal.classList.add('hidden');$('cfR22ContactSearch').addEventListener('input',renderClients);return modal;
}
function renderClients(){
 const host=$('cfR22ContactList');if(!host)return;host.replaceChildren();
 const all=root.CFR22ClientsSnapshot?.()||[],term=text($('cfR22ContactSearch')?.value).toLocaleLowerCase();
 const matches=all.filter(c=>text(c.nombre).toLocaleLowerCase().includes(term)||text(c.email).toLocaleLowerCase().includes(term)).slice(0,100);
 if(!matches.length){host.textContent='No hay clientes que coincidan. Puedes crear uno desde Ajustes → Clientes.';return;}
 for(const c of matches){const b=root.document.createElement('button');b.type='button';b.textContent=[c.nombre,c.telefono,c.email].filter(Boolean).join(' · ');b.onclick=()=>{setContact(pickerKind,c);$('cfR22ContactModal').classList.add('hidden');};host.appendChild(b);}
}
async function pickClient(kind){pickerKind=kind;try{await root.loadClients?.(false);}catch(_){}const modal=ensurePicker();modal.classList.remove('hidden');$('cfR22ContactSearch').value='';renderClients();}
async function pickNativeContact(kind){
 const status=$(kind==='income'?'pendingIncomeMsg':'cfR20PaymentStatus');
 const report=(message,failed=false)=>{if(status){status.className='msg'+(failed?' err':'');status.textContent=message;}};
 if(!root.Capacitor?.isNativePlatform?.()){
  report('El selector de contactos del teléfono solo funciona en la aplicación iOS/Android. También puedes elegir un cliente guardado.',true);return;
 }
 const picker=root.CFNativeContactPicker;
 if(!picker?.pickContact){report('No se ha cargado el selector nativo de contactos en esta versión. Reinstala la IPA completa.',true);return;}
 report('Abriendo los contactos del teléfono…');
 try{
  const result=await picker.pickContact();
  if(!result){report('No se seleccionó ningún contacto.');return;}
  const first=x=>Array.isArray(x)&&x.length?text(x.find(item=>item?.isPrimary||item?.pref)?.value||x[0]?.value):'';
  const phone=first(result.phoneNumbers);
  if(!phone){report('El contacto seleccionado no tiene un teléfono disponible. Elige otro.',true);return;}
  setContact(kind,{nombre:text(result.displayName||result.name?.formatted||[result.name?.givenName,result.name?.familyName].filter(Boolean).join(' ')),telefono:phone,email:first(result.emails)});
  report('Contacto seleccionado: '+text(result.displayName||phone)+'. Revisa el teléfono antes de enviar.');
 }catch(e){
  const message=text(e.message||e);
  if(/cancel|0006|user canceled/i.test(message)){report('Selección de contacto cancelada.');return;}
  report('No se pudo abrir Contactos: '+message,true);
 }
}
function refreshPaymentDue(){
 const state=$('cfR20PaymentState')?.value,recordModal=$('cfR20PaymentModal');if(!state||recordModal?.classList.contains('hidden'))return;
 const summary=$('cfR20PaymentSummary')?.textContent||'';const amountMatch=summary.match(/([\d.]+,\d{2})\s*€/);let total=amountMatch?Number(amountMatch[1].replace(/\./g,'').replace(',','.')):0;
 // La cifra visible es informativa; el servidor vuelve a validar el importe contra Sheets.
 const wrap=$('cfR22PaymentPartWrap');if(wrap)wrap.hidden=state!=='parcial';
 const paid=state==='pagada'?total:state==='parcial'?Number($('cfR22PaidAmount')?.value)||0:0;
 if($('cfR22PaymentDue'))$('cfR22PaymentDue').textContent='Acordado: '+money(total)+' · Recibido: '+money(paid)+' · Pendiente: '+money(Math.max(0,total-paid));
}
root.document.addEventListener('change',event=>{if(event.target?.id==='cfR20PaymentState')refreshPaymentDue();});
root.document.addEventListener('input',event=>{if(event.target?.id==='cfR22PaidAmount')refreshPaymentDue();});
// A las funciones existentes se les añade solo el selector y la verificación visual.
const oldPayment=root.openCFPayment;
if(typeof oldPayment==='function')root.openCFPayment=function(...args){const result=oldPayment.apply(this,args);mountCountry('payment');refreshPaymentDue();return result;};
root.CFR22=Object.freeze({detectedCountry,countryFor,normalized,normalizeContactPhone,mountIncomeCountry:()=>mountCountry('income'),mountCountry,pickClient,pickNativeContact,refreshPaymentDue});

root.CFi18n?.addTranslations?.({
 en:{'Fecha del servicio / ingreso':'Service / income date','🟠 Pago parcial':'🟠 Partially paid','Importe recibido hasta hoy (€)':'Amount received to date (€)','👤 Elegir cliente guardado':'👤 Choose saved customer','📱 Contactos del teléfono':'📱 Phone contacts','💾 GUARDAR CAMBIOS':'💾 SAVE CHANGES','VER REGISTRO':'VIEW RECORD','🧾 Añadir facturas al proyecto':'🧾 Add project invoices','🔄 COMPROBAR MI ACCESO DE ADMINISTRADOR':'🔄 CHECK MY ADMIN ACCESS'},
 fr:{'Fecha del servicio / ingreso':'Date du service / revenu','🟠 Pago parcial':'🟠 Paiement partiel','Importe recibido hasta hoy (€)':'Montant reçu à ce jour (€)','👤 Elegir cliente guardado':'👤 Choisir un client','📱 Contactos del teléfono':'📱 Contacts du téléphone','💾 GUARDAR CAMBIOS':'💾 ENREGISTRER','VER REGISTRO':'VOIR LE DOCUMENT','🧾 Añadir facturas al proyecto':'🧾 Ajouter des factures au projet'},
 de:{'Fecha del servicio / ingreso':'Datum der Leistung / Einnahme','🟠 Pago parcial':'🟠 Teilzahlung','Importe recibido hasta hoy (€)':'Bisher erhalten (€)','👤 Elegir cliente guardado':'👤 Kunden auswählen','📱 Contactos del teléfono':'📱 Telefonkontakte','💾 GUARDAR CAMBIOS':'💾 ÄNDERUNGEN SPEICHERN','VER REGISTRO':'BELEG ANZEIGEN'},
 it:{'Fecha del servicio / ingreso':'Data del servizio / incasso','🟠 Pago parcial':'🟠 Pagamento parziale','Importe recibido hasta hoy (€)':'Importo ricevuto finora (€)','👤 Elegir cliente guardado':'👤 Scegli cliente','📱 Contactos del teléfono':'📱 Contatti del telefono','💾 GUARDAR CAMBIOS':'💾 SALVA MODIFICHE','VER REGISTRO':'VEDI REGISTRO'},
 pt:{'Fecha del servicio / ingreso':'Data do serviço / rendimento','🟠 Pago parcial':'🟠 Pagamento parcial','Importe recibido hasta hoy (€)':'Valor recebido até hoje (€)','👤 Elegir cliente guardado':'👤 Escolher cliente','📱 Contactos del teléfono':'📱 Contactos do telemóvel','💾 GUARDAR CAMBIOS':'💾 GUARDAR ALTERAÇÕES','VER REGISTRO':'VER REGISTO'},
 ca:{'Fecha del servicio / ingreso':'Data del servei / ingrés','🟠 Pago parcial':'🟠 Pagament parcial','Importe recibido hasta hoy (€)':'Import rebut fins avui (€)','👤 Elegir cliente guardado':'👤 Triar client','📱 Contactos del teléfono':'📱 Contactes del telèfon','💾 GUARDAR CAMBIOS':'💾 DESAR CANVIS','VER REGISTRO':'VEURE REGISTRE'},
 nl:{'Fecha del servicio / ingreso':'Datum van dienst / inkomsten','🟠 Pago parcial':'🟠 Gedeeltelijk betaald','Importe recibido hasta hoy (€)':'Tot nu toe ontvangen (€)','👤 Elegir cliente guardado':'👤 Kies klant','📱 Contactos del teléfono':'📱 Telefooncontacten','💾 GUARDAR CAMBIOS':'💾 WIJZIGINGEN OPSLAAN','VER REGISTRO':'BEKIJK RECORD'},
 pl:{'Fecha del servicio / ingreso':'Data usługi / przychodu','🟠 Pago parcial':'🟠 Płatność częściowa','Importe recibido hasta hoy (€)':'Dotychczas otrzymano (€)','👤 Elegir cliente guardado':'👤 Wybierz klienta','📱 Contactos del teléfono':'📱 Kontakty telefonu','💾 GUARDAR CAMBIOS':'💾 ZAPISZ ZMIANY','VER REGISTRO':'POKAŻ REKORD'}
});

// ===== Operaciones fiscales en la Agenda =====
const agenda=(function(){let selected=null,currentRows=[],account='';
 const isDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(text(s).slice(0,10));
 const date=r=>text(r?.fecha).slice(0,10);
 const accountKey=()=>{const a=root.CFGoogleAccount?.active();return a?.email&&a?.id?a.email+':'+a.id:'';};
 const getTypes=()=>new Set([...root.document.querySelectorAll('#cfR22AgendaLegend input:checked')].map(x=>x.value));
 function collect(){
  if(!accountKey()||account!==accountKey())return [];
  const rows=[];
  for(const r of root.CFR20Data?.records?.()||[]){if(!isDate(r.fecha)||r.estado==='BORRADOR')continue;
   const kind=r.tipo==='Compra'?'compras':r.tipo==='Facturación'||r.tipo==='Facturado'?'facturas':'';if(!kind)continue;
   rows.push({kind,id:String(r.requestId||r.id||r._key||''),fecha:date(r),label:r.tipo==='Compra'?'Compra · '+text(r.tercero):'Factura · '+text(r.numeroFactura||r.tercero),descripcion:text(r.concepto||r.servicio),importe:Number(r.total)||0,pendiente:kind==='facturas'&&['pendiente','parcial'].includes(r.estadoCobro),ref:r});
  }
  for(const r of root.CFR20Data?.incomes?.()||[]){if(!isDate(r.fecha))continue;
   rows.push({kind:'ingresos',id:String(r.id),fecha:date(r),label:'Servicio · '+text(r.persona),descripcion:text(r.servicio),importe:Number(r.importePrevisto)||0,pendiente:['pendiente','parcial'].includes(r.estadoCobro),ref:r});
  }
  for(const r of root.CFR21Materials?.items?.()||[]){if(!isDate(r.fecha))continue;
   rows.push({kind:'compras',id:String(r.id),fecha:date(r),label:'Material · '+text(r.proveedor),descripcion:'Proyecto: '+text(r.proyecto),importe:Number(r.importe)||0,pendiente:false,ref:r,material:true});
  }
  return rows;
 }
 function decorate(){
  const grid=$('agendaGrid');if(!grid)return;const types=getTypes();currentRows=collect();
  const events=typeof root.CFR23CalendarEvents==='function'?root.CFR23CalendarEvents():[];
  for(const cell of grid.querySelectorAll('.calDay')){
   const day=cell.dataset.date;if(!day)continue;
   let strip=cell.querySelector('.cfR23CalendarMarkers');if(!strip){strip=root.document.createElement('div');strip.className='cfR23CalendarMarkers';cell.appendChild(strip);}
   strip.replaceChildren();
   const operations=currentRows.filter(r=>r.fecha===day&&types.has(r.kind));
   const dayEvents=events.filter(e=>text(e.fecha).slice(0,10)===day);
   const combined=[...dayEvents.map(e=>({event:e})),...operations.map(r=>({operation:r}))];
   // Máximo tres globos + contador. Nunca se añaden filas de altura variable.
   const visible=combined.length>3?combined.slice(0,2):combined;
   for(const row of visible){
    const isEvent=!!row.event,entry=row.operation;
    const marker=root.document.createElement('button');marker.type='button';
    marker.className='cfR23Marker '+(isEvent?'isEvent':entry.pendiente?'isUnpaid':entry.kind==='facturas'?'isInvoice':entry.kind==='ingresos'?'isIncome':'isPurchase');
    const label=isEvent?text(row.event.evento||'Evento'):text(entry.label||'Operación');
    marker.setAttribute('aria-label',label);marker.title=label;
    marker.addEventListener('click',ev=>{ev.stopPropagation();if(isEvent)root.openAgendaEventModal?.(row.event.id);else show(entry);});
    strip.appendChild(marker);
   }
   if(combined.length>3){
    const more=root.document.createElement('button');more.type='button';more.className='cfR23More';
    more.textContent='+'+(combined.length-visible.length);more.setAttribute('aria-label','Ver todos los '+combined.length+' elementos del '+day);
    more.addEventListener('click',ev=>{ev.stopPropagation();showDay(day,dayEvents,operations);});strip.appendChild(more);
   }
  }
 }
 let activeDay='';
 function mode(dayMode){
  const add=$('cfR24DayAdd'),back=$('cfR24ReturnToDay'),view=$('cfR22OperationView');
  if(add)add.hidden=!dayMode;
  if(back)back.hidden=dayMode||!activeDay;
  if(view)view.hidden=dayMode;
 }
 function makeDayRow(title,description,color,onClick){
  const btn=root.document.createElement('button');btn.type='button';btn.className='cfR23DayRow';
  const layout=root.document.createElement('span');layout.className='cfR24DayRowContent';
  const dot=root.document.createElement('span');dot.className='cfR24DayDot '+color;dot.setAttribute('aria-hidden','true');
  const label=root.document.createElement('span');label.className='cfR24DayRowText';
  const strong=root.document.createElement('strong');strong.textContent=title;
  const small=root.document.createElement('small');small.textContent=description;
  label.append(strong,small);layout.append(dot,label);btn.appendChild(layout);
  btn.addEventListener('click',onClick);return btn;
 }
 function openDay(day){
  if(!isDate(day))return;
  const events=(typeof root.CFR23CalendarEvents==='function'?root.CFR23CalendarEvents():[])
    .filter(e=>text(e.fecha).slice(0,10)===day)
    .sort((a,b)=>text(a.horaInicio||'').localeCompare(text(b.horaInicio||'')));
  const operations=collect().filter(r=>r.fecha===day&&getTypes().has(r.kind))
    .sort((a,b)=>({compras:0,facturas:1,ingresos:2}[a.kind]??3)-({compras:0,facturas:1,ingresos:2}[b.kind]??3)||text(a.label).localeCompare(text(b.label)));
  showDay(day,events,operations);
 }
 function showDay(day,events,operations){
  activeDay=day;selected=null;
  const modal=$('cfR22OperationModal'),body=$('cfR22OperationBody');if(!modal||!body)return;
  $('cfR22OperationTitle').textContent='📅 '+day.split('-').reverse().join('/');
  body.replaceChildren();mode(true);
  const section=(label)=>{const h=root.document.createElement('h4');h.className='cfR24DayHeading';h.textContent=label;body.appendChild(h);};
  section('EVENTOS · '+events.length);
  if(!events.length){const p=root.document.createElement('p');p.textContent='No hay eventos para este día.';body.appendChild(p);}
  for(const event of events){
   const parts=[text(event.horaInicio),text(event.cliente),text(event.ubicacion)].filter(Boolean);
   body.appendChild(makeDayRow(text(event.evento||'Evento sin título'),parts.join(' · ')||'Ver evento','isEvent',()=>{
    close();root.openAgendaEventModal?.(event.id);
   }));
  }
  section('COMPRAS, FACTURAS E INGRESOS · '+operations.length);
  if(!operations.length){const p=root.document.createElement('p');p.textContent='No hay otras operaciones para este día.';body.appendChild(p);}
  for(const row of operations){
   const color=row.pendiente?'isUnpaid':row.kind==='compras'?'isPurchase':row.kind==='facturas'?'isInvoice':'isIncome';
   const state=row.pendiente?' · 🟠 Pendiente de cobro':'';
   body.appendChild(makeDayRow(row.label,[row.descripcion,money(row.importe)].filter(Boolean).join(' · ')+state,color,()=>show(row)));
  }
  modal.classList.remove('hidden');
 }
 function createEventForDay(){const day=activeDay;close();if(isDate(day))root.openAgendaEventModal?.(null,day);}
 function backToDay(){if(activeDay)openDay(activeDay);}
 function show(row){selected=row;const modal=$('cfR22OperationModal');if(!modal)return;mode(false);
  $('cfR22OperationTitle').textContent=row.label;
  const body=$('cfR22OperationBody');body.replaceChildren();
  const entries=[['Fecha',row.fecha],['Descripción',row.descripcion||'Sin descripción'],['Importe',money(row.importe)],['Estado',row.pendiente?'Pendiente de cobro / pago parcial':'Consulta el estado en su registro']];
  for(const [label,value] of entries){const p=root.document.createElement('p');const strong=root.document.createElement('strong');strong.textContent=label+': ';p.appendChild(strong);p.appendChild(root.document.createTextNode(value));body.appendChild(p);}
  modal.classList.remove('hidden');
 }
 function close(){$('cfR22OperationModal')?.classList.add('hidden');selected=null;activeDay='';}
 async function viewSelected(){const r=selected;if(!r)return;close();
  if(r.material){await root.CFR21Materials?.openItem?.(r.id);return;}
  if(r.kind==='ingresos'){root.openPendingIncomeForm?.(r.id);return;}
  root.openRecordData?.(r.ref);
 }

 async function refresh(){
  const key=accountKey();if(!key){currentRows=[];account='';decorate();return;}
  account=key;
  try{await root.loadPendingIncome?.(false);}catch(_){}
  try{await root.CFR21Materials?.load?.();}catch(_){}
  if(accountKey()!==key){account='';currentRows=[];return;}
  decorate();
 }
 root.document.querySelectorAll('#cfR22AgendaLegend input').forEach(el=>el.addEventListener('change',decorate));
 return Object.freeze({decorate,refresh,close,viewSelected,collect,getTypes,showDay,openDay,createEventForDay,backToDay});
})();root.CFR22Agenda=agenda;
})(window);
