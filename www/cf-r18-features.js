/* Control Fiscal R18. Agenda: seleccion de inventario, planos privados y partes PDF.
   Los ficheros se guardan en el Drive del usuario (NO en Firestore).
   La selección NO descuenta el stock; valida reservas de eventos coincidentes. */
(function(root){'use strict';
 const $=id=>document.getElementById(id);
 const tr=s=>root.CFi18n?.t(s)||s;
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const mimeOk=new Set(['application/pdf','image/jpeg','image/png']);
 const MAX=5*1024*1024;
 let materialLines=[],attached=[],pendingFiles=[],activeBook='';
 const uid=()=>root.crypto?.randomUUID?.()||String(Date.now())+Math.random().toString(36).slice(2);
 const field=(id)=>$(id)?.value||'';
 const itemById=id=>(root.CFR18InventorySnapshot?.()||[]).find(i=>String(i.id)===String(id));
 const selected=()=>materialLines.filter(m=>m.id&&Number(m.cantidad)>0);
 const overlaps=(a,b)=>{
   if(String(a.fecha||'').slice(0,10)!==String(b.fecha||'').slice(0,10))return false;
   // Sin horas completas, el día se considera ocupado entero.
   const minute=t=>/^\d\d:\d\d$/.test(t||'')?Number(t.slice(0,2))*60+Number(t.slice(3,5)):null;
   const as=minute(a.horaInicio),ae=minute(a.horaFin),bs=minute(b.horaInicio),be=minute(b.horaFin);
   if([as,ae,bs,be].some(x=>x===null)||ae<=as||be<=bs)return true;
   return as<be&&bs<ae;
 };
 const context=()=>({id:root.CFR18EditingEvent?.()||'',fecha:field('agendaEventDate'),horaInicio:field('agendaEventStart'),horaFin:field('agendaEventEnd')});
 function reservations(id,event,otherEvents){
   let count=0;
   for(const e of otherEvents||root.CFR18AgendaSnapshot?.()||[]){
     if(String(e.id)===String(event.id)||!overlaps(e,event))continue;
     const lines=Array.isArray(e.materiales)?e.materiales:[];
     for(const m of lines)if(String(m.id)===String(id))count+=Number(m.cantidad)||0;
   }return count;
 }
 function available(id,event,inventory,events){
   const i=(inventory||root.CFR18InventorySnapshot?.()||[]).find(x=>String(x.id)===String(id));
   if(!i||String(i.estado||'Disponible').toLowerCase()!=='disponible')return 0;
   return Math.max(0,(Number(i.cantidad)||0)-reservations(id,event,events));
 }
 function draw(){
   const pick=$('cfEventStockSelect'),list=$('cfEventStockList'),notice=$('cfEventStockStatus');if(!pick||!list)return;
   const current=pick.value;const items=root.CFR18InventorySnapshot?.()||[];
   pick.replaceChildren(new Option(tr('Selecciona un artículo'),''));
   for(const i of items.sort((a,b)=>String(a.articulo).localeCompare(String(b.articulo)))){
     const n=available(i.id,context());const opt=new Option(`${i.articulo} · ${n} ${i.unidad||'ud.'}`,i.id);
     opt.disabled=n<=0;pick.add(opt);
   }
   if([...pick.options].some(x=>x.value===current))pick.value=current;
   list.replaceChildren();for(const m of materialLines){
     const i=itemById(m.id),row=document.createElement('div');row.className='cfEventStockRow';
     const name=document.createElement('span');name.textContent=i?.articulo||m.nombre||'Artículo no encontrado';
     const qty=document.createElement('input');qty.type='number';qty.min='1';qty.step='1';qty.inputMode='numeric';qty.value=String(m.cantidad);qty.setAttribute('aria-label','Cantidad '+name.textContent);
     qty.addEventListener('change',()=>{const next=Math.round(Number(qty.value));const max=available(m.id,context());if(!Number.isFinite(next)||next<1||next>max){qty.value=String(m.cantidad);notify('No hay suficiente stock. Disponible para este evento: '+max,'err');return;}m.cantidad=next;draw();});
     const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Quitar '+name.textContent);remove.onclick=()=>{materialLines=materialLines.filter(x=>x!==m);draw();};
     row.append(name,qty,remove);list.append(row);
   }
   if(notice)notice.textContent=materialLines.length?`${materialLines.length} artículo(s) · cantidades reservadas solo para eventos coincidentes en fecha y horario.`:'No has seleccionado materiales. Puedes escribir otros objetos en «Qué tengo que llevar».';
 }
 function notify(message,kind=''){const n=$('cfEventStockStatus');if(n){n.textContent=tr(message);n.className='settingsHint '+(kind==='err'?'cfR18Error':'');}else root.showToastMessage?.('Agenda',message);}
 function addMaterial(){const id=field('cfEventStockSelect');if(!id)return;const i=itemById(id);const avail=available(id,context());const existing=materialLines.find(x=>String(x.id)===String(id));if(!i||avail<1||existing&&existing.cantidad>=avail){notify('No hay stock disponible para añadir este material.','err');return;}if(existing)existing.cantidad++;else materialLines.push({id:String(i.id),nombre:String(i.articulo),unidad:String(i.unidad||'unidades'),cantidad:1});draw();}
 function drawAttachments(){const wrap=$('cfEventAttachments'),counter=$('cfEventAttachmentsCounter');if(!wrap)return;wrap.replaceChildren();
  const all=[...attached.map(x=>({...x,saved:true})),...pendingFiles.map(x=>({nombre:x.name,mime:x.type,saved:false}))];
  all.forEach((f,i)=>{const line=document.createElement('div');line.className='cfEventAttachment';
   const name=document.createElement('span');name.textContent=(f.mime==='application/pdf'?'📄 ':'🖼️ ')+f.nombre+(f.saved?'':' · pendiente de guardar');
   if(f.saved){const view=document.createElement('button');view.type='button';view.textContent=tr('Ver');view.onclick=()=>root.openCFDocumentViewer(f.url);line.append(name,view);
     const share=document.createElement('button');share.type='button';share.textContent=tr('Compartir');share.onclick=()=>shareAttachment(i).catch(e=>notify(e.message,'err'));line.append(share);
   }else line.append(name);
   const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Quitar '+f.nombre);remove.onclick=()=>{if(f.saved)attached.splice(i,1);else pendingFiles.splice(i-attached.length,1);drawAttachments();};line.append(remove);wrap.append(line);
  });
  if(counter)counter.textContent=`${all.length} archivo(s), máximo 5 MB por archivo (PDF, JPG o PNG). Los archivos se guardarán en tu Google Drive.`;
 }
 function onFiles(files){for(const f of Array.from(files||[])){
   if(!mimeOk.has(f.type)||f.size>MAX||f.size<1){notify('Solo se admiten PDF, JPG y PNG de hasta 5 MB.','err');continue;}
   if(attached.length+pendingFiles.length>=12){notify('Máximo 12 archivos por evento.','err');break;}
   pendingFiles.push(f);
  }drawAttachments();const input=$('cfEventFileInput');if(input)input.value='';}
 function onOpen(event){const acc=root.CFGoogleAccount?.active();activeBook=acc?.id||'';
   materialLines=Array.isArray(event?.materiales)?event.materiales.map(x=>({id:String(x.id),nombre:String(x.nombre||''),cantidad:Number(x.cantidad)||1,unidad:String(x.unidad||'unidades')})):[];
   attached=Array.isArray(event?.adjuntos)?event.adjuntos.filter(f=>f?.url&&f?.mime&&mimeOk.has(f.mime)).map(x=>({...x})):[];
   pendingFiles=[];draw();drawAttachments();
   const selectedBook=activeBook;
   if(selectedBook)root.callAction({accion:'listarInventario'}).then(data=>{
    if(root.CFGoogleAccount?.active()?.id!==selectedBook)return;
    root.CFR18ReplaceInventory?.(data.items||[]);draw();
   }).catch(e=>notify('No se pudo actualizar el inventario: '+(e.message||e),'err'));
 }
 async function beforeSave(){
  const acc=root.CFGoogleAccount?.active();if(!acc?.id||acc.id!==activeBook)throw Error('La sesión ha cambiado. Abre de nuevo el evento.');
  // Validación de stock con una lectura reciente de Google Sheets: si falla, NO se autoriza la reserva.
  if(materialLines.length){
   const [inventory,agenda]=await Promise.all([root.callAction({accion:'listarInventario'}),root.callAction({accion:'listarAgenda'})]);
   if(root.CFGoogleAccount?.active()?.id!==activeBook)throw Error('La sesión cambió durante la comprobación.');
   const items=inventory.items||[],events=agenda.eventos||[];
   for(const m of materialLines){const remaining=available(m.id,context(),items,events);if(!Number.isSafeInteger(m.cantidad)||m.cantidad<1||m.cantidad>remaining)throw Error('Stock insuficiente de '+(m.nombre||m.id)+'. Disponible: '+remaining+'. Cambia la cantidad para guardar.');}
  }
  for(const f of pendingFiles){
   const bytes=await new Promise((ok,bad)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(',')[1]);r.onerror=()=>bad(Error('No se puede leer '+f.name));r.readAsDataURL(f);});
   if(root.CFGoogleAccount?.active()?.id!==activeBook)throw Error('Se cambió de cuenta durante la subida.');
   const url=await root.CFGoogleUploads.upload(f.name,f.type,bytes,acc);
   attached.push({id:uid(),nombre:f.name,mime:f.type,url,fecha:new Date().toISOString()});
   pendingFiles=pendingFiles.filter(x=>x!==f);drawAttachments();
  }
  return {materiales:selected().map(x=>({...x})),adjuntos:attached.map(x=>({...x}))};
 }
 function outputPDF(event){
  if(!root.CFjsPDF)throw Error('No se ha cargado el generador de PDF.');
  const pdf=new root.CFjsPDF({format:'a4',unit:'mm'});let y=22;
  function text(str,size=10,bold=false){pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(size);for(const line of pdf.splitTextToSize(String(str||'').replace(/[\r\n]+/g,' '),170)){if(y>275){pdf.addPage();y=22;}pdf.text(line,20,y);y+=size*.45+2.6;}}
  text('CONTROL FISCAL · HOJA DE MATERIAL',15,true);y+=4;text('Evento: '+(event?.evento||field('agendaEventName')),12,true);
  text('Fecha: '+(event?.fecha||field('agendaEventDate'))+'  Hora: '+(event?.horaInicio||field('agendaEventStart')));
  text('Lugar: '+(event?.ubicacion||field('agendaEventLocation')));text('Cliente: '+(event?.cliente||field('agendaEventClient')));y+=5;
  text('MATERIAL DEL INVENTARIO',12,true);for(const m of (event?.materiales||selected()))text('[ ]  '+String(m.cantidad)+' '+String(m.unidad||'ud.')+' — '+String(m.nombre||m.id),11);
  const other=event?.llevar??field('agendaEventBring');if(other){y+=4;text('OTROS ELEMENTOS / INSTRUCCIONES',11,true);text(other,10);}
  y+=6;text('Preparado por: ____________________    Comprobado por: ____________________',9);
  return {base64:pdf.output('datauristring').split(',')[1],name:'Material_Evento_'+String(event?.evento||field('agendaEventName')||'agenda').replace(/[^A-Za-z0-9_-]/g,'_').slice(0,40)+'.pdf'};
 }
 async function sharePDF(doc){
  if(!root.CFFilesystem||!root.CFShare||!root.CFDirectory)throw Error('Compartir o imprimir requiere la aplicación nativa instalada.');
  const filename=doc.name.replace(/[^A-Za-z0-9_.-]/g,'_');const path='control-fiscal-'+Date.now()+'-'+filename;
  await root.CFFilesystem.writeFile({path,data:doc.base64,directory:root.CFDirectory.Cache});
  const uri=await root.CFFilesystem.getUri({path,directory:root.CFDirectory.Cache});
  await root.CFShare.share({title:filename,url:uri.uri,dialogTitle:'Imprimir (AirPrint) o compartir PDF'});
 }
 async function printList(){try{await sharePDF(outputPDF());}catch(e){notify(e.message,'err');}}
 const driveId=u=>/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/.exec(String(u||''))?.[1]||null;
 async function shareAttachment(index){
   const f=attached[index],s=root.CFGoogleAccount?.active(),id=driveId(f?.url);
   if(!s?.token||s.id!==activeBook||!id||!mimeOk.has(f.mime))throw Error('No se puede compartir este archivo desde la cuenta actual.');
   const response=await root.fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?alt=media',{headers:{Authorization:'Bearer '+s.token}});
   if(!response.ok)throw Error('No se ha podido descargar el archivo privado (HTTP '+response.status+').');
   const blob=await response.blob();if(blob.size>MAX)throw Error('Archivo demasiado grande para compartir.');
   const data=await new Promise((ok,bad)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(',')[1]);r.onerror=()=>bad(Error('No se pudo preparar el archivo.'));r.readAsDataURL(blob);});
   await sharePDF({name:f.nombre,base64:data});
 }
 async function openRoute(provider){
  const destination=field('agendaEventLocation').trim();if(!destination)return notify('Introduce una dirección para consultar la ruta.','err');
  const launch=root.CFAppLauncher;const dest=encodeURIComponent(destination);
  const scheme=provider==='apple'?'maps://?daddr='+dest+'&dirflg=d':'comgooglemaps://?daddr='+dest+'&directionsmode=driving';
  if(launch?.openUrl){
   try{
    if(provider==='google'&&launch.canOpenUrl&&!(await launch.canOpenUrl({url:'comgooglemaps://'})).value){notify('Google Maps no está instalado. Utiliza Apple Maps o instala Google Maps.','err');return;}
    const result=await launch.openUrl({url:scheme});if(result?.completed===false)throw Error('No se pudo abrir Mapas.');return;
   }catch(e){notify('No se pudo iniciar la ruta: '+(e.message||e),'err');return;}
  }
  // Web de escritorio: el navegador abre indicaciones explícitas, nunca el visor de Capacitor.
  const web=provider==='apple'?'https://maps.apple.com/?daddr='+dest+'&dirflg=d':'https://www.google.com/maps/dir/?api=1&destination='+dest+'&travelmode=driving&dir_action=navigate';
  root.open(web,'_blank','noopener');
 }
 document.addEventListener('click',event=>{
   const node=event.target?.closest?.('[data-cf-open-map]');
   if(node&&root.openAgendaEventModal){event.preventDefault();root.openAgendaEventModal(node.dataset.cfOpenMap);}
 });
 root.CFEventTools=Object.freeze({onOpen,onFiles,addMaterial,draw,beforeSave,printList,shareAttachment,openRoute,available,overlaps,outputPDF});
})(window);
