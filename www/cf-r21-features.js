/* Control Fiscal R21 · Funciones privadas de administrador, proyectos y documentación.
   Firestore almacena solo sugerencias. Facturas y registros siguen en el Google
   Drive/Sheets del usuario activo. No incorpora ningún UID administrativo al cliente. */
(function(root){'use strict';
const $=id=>root.document.getElementById(id);
const text=v=>String(v??'').trim();
const euro=v=>(Number(v)||0).toLocaleString('es-ES',{style:'currency',currency:'EUR'});
const status=(id,msg)=>{const el=$(id);if(el)el.textContent=text(msg);};
const session=()=>{const a=root.CFGoogleAccount?.active();if(!a?.id||!a?.email||!a.token)throw Error('Inicia sesión en tu libro privado de Google.');return {id:a.id,email:a.email,token:a.token};};
const same=s=>{const a=root.CFGoogleAccount?.active();if(!a||a.id!==s.id||a.email!==s.email)throw Error('Has cambiado de cuenta de Google. Se ha cancelado la operación.');};
const page=name=>{if(typeof root.only==='function')root.only(name);const n=name==='cfR21AdminPage'?'settings':'sale';root.nav?.(n);};
function fileToBase64(file){return new Promise((resolve,reject)=>{if(!file||file.size>5*1024*1024)reject(Error('Archivo vacío o superior a 5 MB.'));else{const reader=new FileReader();reader.onerror=()=>reject(Error('No se pudo leer el archivo.'));reader.onload=()=>resolve(String(reader.result||'').split(',')[1]||'');reader.readAsDataURL(file);}});}
const allowedMime=m=>['application/pdf','image/png','image/jpeg'].includes(m);
root.CFR21Files=Object.freeze({fileToBase64,allowedMime});
// ===== Administrador: las reglas de Firestore, NO el frontend, deciden quién accede =====
const admin=(function(){
let rows=[],activeAccount=null,confirmed=false;
const apiBase='https://firestore.googleapis.com/v1/projects/control-fiscal-511118/databases/(default)/documents';
const collection='control_fiscal_sugerencias';
const decode=v=>{if(!v||typeof v!=='object')return null;if('stringValue'in v)return v.stringValue;if('timestampValue'in v)return v.timestampValue;if('booleanValue'in v)return v.booleanValue;if('integerValue'in v)return Number(v.integerValue);return null;};
const fromDoc=v=>{const fields=v.fields||{},row={id:String(v.name||'').split('/').pop()};for(const [k,val] of Object.entries(fields))row[k]=decode(val);row.name=v.name;return row;};
async function request(url,options={}){
 const s=session(),auth=await root.CFFirebaseAuth.ensureSignedIn();same(s);
 const headers={Authorization:'Bearer '+auth.idToken,...(options.body?{'Content-Type':'application/json'}:{})};
 const response=await root.fetch(url,{...options,headers});same(s);
 const json=await response.json().catch(()=>({}));
 if(!response.ok)throw Error('Firestore HTTP '+response.status+': '+text(json.error?.message||'Permiso denegado o sesión caducada.'));
 return json;
}
const listUrl=apiBase+'/'+collection+'?pageSize=100&orderBy=fecha%20desc';
async function check(){
 const entry=$('cfR21AdminEntry');if(!entry)return false;
 entry.hidden=true;confirmed=false;rows=[];render();
 try{
  const s=session();const auth=await root.CFFirebaseAuth.ensureSignedIn();
  const output=await root.fetch(listUrl.replace('pageSize=100','pageSize=1'),{headers:{Authorization:'Bearer '+auth.idToken}});
  same(s);if(!output.ok)return false;
  await output.json().catch(()=>({}));activeAccount=s.email+':'+s.id;confirmed=true;entry.hidden=false;return true;
 }catch{return false;}
}
async function open(){
 if(!await check()){root.showToastMessage?.('Acceso restringido','Tu cuenta Firebase no tiene permiso de administrador. Verifica el UID de las reglas.');return;}
 page('cfR21AdminPage');return load();
}
function close(){page('settingsPage');root.openSettings?.();}
function render(){
 const holder=$('cfR21AdminCards');if(!holder)return;
 holder.replaceChildren();
 const query=text($('cfR21AdminSearch')?.value).toLocaleLowerCase(),filter=$('cfR21AdminFilter')?.value||'all';
 const show=rows.filter(r=>(filter==='all'||r.estado===filter)&&[r.nombre,r.mensaje,r.tipo,r.uid].some(v=>text(v).toLocaleLowerCase().includes(query)));
 if(!show.length){holder.textContent='No hay sugerencias con estos filtros.';return;}
 for(const item of show){
  const card=root.document.createElement('article');card.className='cfR21Message';
  const heading=root.document.createElement('h3');heading.textContent=(item.tipo||'Sugerencia')+' · '+(item.estado||'pendiente');card.appendChild(heading);
  const meta=root.document.createElement('div');meta.className='cfR21Meta';const date=item.fecha?new Date(item.fecha):null;
  meta.textContent=(date&&!Number.isNaN(date.getTime())?date.toLocaleString('es-ES')+' · ':'')+(item.nombre||'Usuario')+' · '+(item.plataforma||'Plataforma desconocida');card.appendChild(meta);
  const msg=root.document.createElement('p');msg.textContent=text(item.mensaje);card.appendChild(msg);
  const id=root.document.createElement('small');id.className='cfR21Meta';id.textContent='Usuario Firebase: '+text(item.uid);card.appendChild(id);
  const actions=root.document.createElement('div');actions.className='cfR21Actions';
  const consent=item.permiteRespuesta===true&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(item.correoRespuesta));
  if(consent){const a=root.document.createElement('a');a.textContent='✉️ Responder por correo';a.href='mailto:'+encodeURIComponent(item.correoRespuesta)+'?subject='+encodeURIComponent('Control Fiscal · respuesta a '+text(item.tipo));actions.appendChild(a);}
  else {const small=root.document.createElement('small');small.className='cfR21Meta';small.textContent='Sin autorización para responder por correo.';actions.appendChild(small);}
  for(const [next,label] of [['leida','Marcar leída'],['respondida','Marcar respondida']]){
   if(item.estado===next)continue;const b=root.document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>mark(item,next,b));actions.appendChild(b);
  }
  card.appendChild(actions);holder.appendChild(card);
 }
}
async function load(){
 status('cfR21AdminStatus','Consultando sugerencias con tu cuenta Firebase…');
 try{
  if(!confirmed||!activeAccount)throw Error('Abre la sección desde Ajustes con tu usuario administrador.');
  const s=session();if(activeAccount!==s.email+':'+s.id)throw Error('Ha cambiado el usuario activo.');
  const data=await request(listUrl);rows=(data.documents||[]).map(fromDoc);
  render();status('cfR21AdminStatus',rows.length+' sugerencias cargadas (máximo 100 más recientes).');
 }catch(e){rows=[];render();status('cfR21AdminStatus','No se pudieron cargar: '+text(e.message||e));}
}
async function mark(item,estado,btn){
 btn.disabled=true;
 try{
  const body={writes:[{update:{name:item.name,fields:{estado:{stringValue:estado}}},updateMask:{fieldPaths:['estado']},updateTransforms:[{fieldPath:'revisadoEn',setToServerValue:'REQUEST_TIME'}]}]};
  await request('https://firestore.googleapis.com/v1/projects/control-fiscal-511118/databases/(default)/documents:commit',{method:'POST',body:JSON.stringify(body)});
  item.estado=estado;render();status('cfR21AdminStatus','Estado actualizado en Firestore.');
 }catch(e){status('cfR21AdminStatus','Error al actualizar: '+text(e.message||e));btn.disabled=false;}
}
['cfR21AdminFilter','cfR21AdminSearch'].forEach(id=>root.document.addEventListener('input',event=>{if(event.target?.id===id)render();}));
return Object.freeze({check,open,close,load,render});
})();root.CFR21Admin=admin;
// ===== Proyecto: adjuntos extra independientes del asiento contable =====
const materials=(function(){let list=[];let accountKey='';
function items(){const s=root.CFGoogleAccount?.active();return s&&accountKey===s.email+':'+s.id?list.slice():[];}
async function open(){page('cfR21MaterialPage');if($('cfR21MaterialDate')&&!$('cfR21MaterialDate').value){const d=new Date();$('cfR21MaterialDate').value=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}await load();}
function close(){root.openFacturacionPage?.();}
async function load(){
 status('cfR21MaterialStatus','Cargando justificantes de tu Google Sheets…');
 try{const s=session(),data=await root.CFGoogleData.action({accion:'listarFacturasMaterialProyecto'});same(s);
 list=Array.isArray(data.facturas)?data.facturas:[];accountKey=s.email+':'+s.id;render();status('cfR21MaterialStatus',list.length+' facturas vinculadas a proyectos.');
 }catch(e){list=[];render();status('cfR21MaterialStatus','No se pudieron consultar: '+text(e.message||e));}
}
function render(){const holder=$('cfR21MaterialList');if(!holder)return;holder.replaceChildren();
 const ordered=items().sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)));
 if(!ordered.length){holder.textContent='Todavía no hay facturas de material vinculadas a proyectos.';return;}
 for(const r of ordered){const card=root.document.createElement('article');card.className='cfR21Message';
 const h=root.document.createElement('h3');h.textContent=r.proyecto;card.appendChild(h);
 const t=root.document.createElement('p');t.textContent=r.proveedor+' · '+r.fecha+' · '+euro(r.importe);card.appendChild(t);
 const b=root.document.createElement('button');b.className='guideBtn';b.textContent='📄 Ver factura';b.onclick=()=>root.openCFDocumentViewer?.(r.documentoUrl);card.appendChild(b);holder.appendChild(card);
 }
}
async function save(){
 const project=text($('cfR21Project')?.value),vendor=text($('cfR21Vendor')?.value),date=text($('cfR21MaterialDate')?.value),amount=Number($('cfR21MaterialAmount')?.value),file=$('cfR21MaterialFile')?.files?.[0],button=$('cfR21MaterialSave');
 if(!project||!vendor||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)||!(amount>0))return status('cfR21MaterialStatus','Completa proyecto, proveedor, fecha e importe positivo.');
 if(!file||!allowedMime(file.type)||file.size>5*1024*1024)return status('cfR21MaterialStatus','Selecciona un archivo PDF, JPG o PNG de hasta 5 MB.');
 button.disabled=true;
 try{
  const s=session();status('cfR21MaterialStatus','Subiendo la factura al Drive privado…');
  const base64=await fileToBase64(file);const url=await root.CFGoogleUploads.upload(file.name,file.type,base64,root.CFGoogleAccount.active());same(s);
  status('cfR21MaterialStatus','Guardando el vínculo con el proyecto en Sheets…');
  const result=await root.CFGoogleData.action({accion:'guardarFacturaMaterialProyecto',factura:JSON.stringify({proyecto:project,proveedor:vendor,fecha:date,importe:amount,documentoUrl:url})});
  if(!result?.ok||!result.id)throw Error('Sheets no ha confirmado el registro. El archivo ya subido puede estar en Drive: compruébalo antes de reintentar.');
  status('cfR21MaterialStatus','Factura registrada en el proyecto.');$('cfR21MaterialFile').value='';await load();
 }catch(e){status('cfR21MaterialStatus','No guardado: '+text(e.message||e));}finally{button.disabled=false;}
}
return Object.freeze({open,close,load,save,items});})();root.CFR21Materials=materials;
// ===== Preparación y selección granular para el gestor =====
const exporter=(function(){let candidates=[],preparedRange='',preparedAccount='';
function range(){const from=text($('emailDesde')?.value),to=text($('emailHasta')?.value);if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||from>to)throw Error('Selecciona dos fechas válidas, desde y hasta.');return {from,to};}
function types(){return new Set([...root.document.querySelectorAll('#cfR21DocTypes input:checked')].map(x=>x.value));}
function identify(url){const value=text(url);if(!/^https:\/\/(drive\.google\.com|docs\.google\.com)\//.test(value))return '';
 return value.match(/\/d\/([\w-]+)/)?.[1]||new URL(value).searchParams.get('id')||'';}
function docDate(r){const raw=text(r.fecha).slice(0,10);if(/^\d{4}-\d{2}-\d{2}$/.test(raw))return raw;const d=new Date(r.fecha);return !Number.isNaN(d.getTime())?d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'):'';}
function list(){const {from,to}=range(),selected=types(),files=[],missing=[];
 const add=(type,r,url,label)=>{
  const date=docDate(r);if(!date||date<from||date>to)return;
  const id=identify(url);if(!id){missing.push(label);return;}
  files.push({type,label,date,id,url});
 };
 for(const r of root.CFR20Data?.records?.()||[]){
  const type=r.tipo==='Compra'?'compras':['Facturado','Facturación'].includes(r.tipo)?'emitidas':'';
  if(!type||!selected.has(type)||r.estado==='BORRADOR')continue;
  add(type,r,r.facturaUrl||r.pdfUrl||r.archivoUrl,(type==='compras'?'Compra: ':'Factura: ')+text(r.tercero||r.numeroFactura||r.concepto));
 }
 if(selected.has('independientes'))for(const r of root.CFR20Data?.incomes?.()||[])add('independientes',r,r.facturaUrl,'Ingreso independiente: '+text(r.persona||r.servicio));
 if(selected.has('material'))for(const r of materials.items())add('material',r,r.documentoUrl,'Material / '+r.proyecto+' / '+r.proveedor);
 return {from,to,files,missing};
}
async function prepare(){
 try{
  const s=session();
  if(types().has('material'))await materials.load();
  if(types().has('independientes'))await root.loadPendingIncome?.(false);
  same(s);
  const {from,to,files,missing}=list(),unique=new Set();candidates=files.filter(x=>{const key=x.id;if(unique.has(key))return false;unique.add(key);return true;});
  preparedRange=from+':'+to+':'+[...types()].sort().join(',');preparedAccount=s.email+':'+s.id;
  const holder=$('cfR21ExportItems');holder.replaceChildren();
  for(let i=0;i<candidates.length;i++){
   const row=root.document.createElement('label');row.className='cfR21ExportItem';const checkbox=root.document.createElement('input');checkbox.type='checkbox';checkbox.checked=true;checkbox.value=String(i);row.appendChild(checkbox);
   const label=root.document.createElement('span');label.textContent=candidates[i].date+' · '+candidates[i].label;row.appendChild(label);holder.appendChild(row);
  }
  status('cfR21ExportCount',candidates.length+' archivos disponibles'+(missing.length?' · '+missing.length+' registros sin adjunto (omitidos)':'')+'. Revisa cada casilla antes de enviar.');
 }catch(e){candidates=[];preparedRange='';status('cfR21ExportCount',text(e.message||e));$('cfR21ExportItems')?.replaceChildren();}
}
async function download(id,sessionId){
 const active=root.CFGoogleAccount.active();same(sessionId);
 let response=await root.fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?alt=media',{headers:{Authorization:'Bearer '+active.token}});
 if(response.status===401&&root.CFGoogleAccount.refreshAuthorization){const token=await root.CFGoogleAccount.refreshAuthorization(active.token);response=await root.fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?alt=media',{headers:{Authorization:'Bearer '+token}});}
 same(sessionId);if(!response.ok)throw Error('No se pudo descargar un archivo (Drive HTTP '+response.status+').');
 const blob=await response.blob();if(blob.size===0||blob.size>5*1024*1024)throw Error('Archivo vacío o superior a 5 MB.');
 const mime=text(blob.type).split(';')[0];if(!allowedMime(mime))throw Error('Formato incompatible con el envío (solo PDF, JPG o PNG).');
 const base64=await fileToBase64(new File([blob],'adjunto',{type:mime}));return {mime,base64};
}
async function send(){
 const statusId='emailStatus',button=$('emailBtn');
 try{
  const s=session(),{from,to}=range(),email=text($('emailDestino')?.value),actual=from+':'+to+':'+[...types()].sort().join(',');
  if(preparedAccount!==s.email+':'+s.id||preparedRange!==actual)throw Error('Ha cambiado la fecha, tipo o cuenta. Pulsa Buscar documentos nuevamente.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Introduce el correo del gestor.');
  const indexes=[...root.document.querySelectorAll('#cfR21ExportItems input:checked')].map(x=>Number(x.value));
  const docs=indexes.map(i=>candidates[i]).filter(Boolean);if(!docs.length)throw Error('Marca al menos un documento.');if(docs.length>15)throw Error('Máximo 15 adjuntos por correo. Selecciona menos archivos.');
  if(!root.confirm('¿Enviar '+docs.length+' documentos seleccionados a '+email+' mediante tu Gmail? Revisa destinatario y selección antes de aceptar.'))return;
  button.disabled=true;const attachments=[];let size=0;
  for(let i=0;i<docs.length;i++){
   status(statusId,'Descargando '+(i+1)+' de '+docs.length+' documentos privados…');
   const fetched=await download(docs[i].id,s);size+=fetched.base64.length*3/4;if(size>12*1024*1024)throw Error('Los documentos superan 12 MB. Selecciona menos archivos.');
   const ext=fetched.mime==='application/pdf'?'pdf':fetched.mime==='image/png'?'png':'jpg';
   attachments.push({...fetched,name:(docs[i].type+'_'+docs[i].date+'_'+String(i+1))+'.'+ext});
  }
  same(s);status(statusId,'Enviando los documentos seleccionados con Gmail…');
  const out=await root.CFGoogleExtras.sendDocuments({recipient:email,attachments,from,to});
  if(!out?.id)throw Error('Gmail no ha confirmado el envío.');
  localStorage.setItem('cf_email_destino',email);status(statusId,'✅ Gmail ha confirmado el envío de '+attachments.length+' archivos a '+email+'.');
 }catch(e){status(statusId,'No enviado: '+text(e.message||e));}finally{if(button)button.disabled=false;}
}
root.document.querySelectorAll('#cfR21DocTypes input').forEach(x=>x.addEventListener('change',prepare));
return Object.freeze({prepare,send,identify,list});})();root.CFR21Export=exporter;
// ===== Spotlight tutorial: cuatro lados realmente atenuados y zona visible =====
const tour=(function(){let observed=null;
function clear(){const el=$('cfTourSpotlight');if(el)el.style.display='none';observed=null;}
function spotlight(target){
 observed=target;const spot=$('cfTourSpotlight');if(!spot||!target||!target.isConnected)return clear();
 const r=target.getBoundingClientRect(),margin=7;
 if(r.width<1||r.height<1)return clear();
 const left=Math.max(5,r.left-margin),top=Math.max(5,r.top-margin),right=Math.min(root.innerWidth-5,r.right+margin),bottom=Math.min(root.innerHeight-5,r.bottom+margin);
 if(right<=left||bottom<=top)return clear();
 Object.assign(spot.style,{left:left+'px',top:top+'px',width:right-left+'px',height:bottom-top+'px',display:'block'});
}
function settingsTarget(title){const v=text(title).toLocaleLowerCase('es');if(/notificacion|notificación/.test(v))return 'notificaciones';if(/idioma|orientaci|diseño|rendimiento/.test(v))return 'idioma';if(/privacidad|sugerencia|firebase|administración/.test(v))return 'sugerencias';if(/emisor|facturaci.n · datos/.test(v))return 'datos de facturación';if(/dónde volver|tutorial/.test(v))return 'información y herramientas';return '';}
root.addEventListener('resize',()=>observed&&spotlight(observed),{passive:true});
root.addEventListener('scroll',()=>observed&&spotlight(observed),{passive:true,capture:true});
return Object.freeze({spotlight,settingsTarget,clear});})();root.CFR21Tour=tour;
// El botón de proyectos se monta después del formulario original, sin alterar el diseño ni el código V76.
const oldFacturacion=root.openFacturacionPage;
if(typeof oldFacturacion==='function')root.openFacturacionPage=function(...args){
 const result=oldFacturacion.apply(this,args);
 const parent=$('formBody');
 const target=parent?.querySelector('.pendingIncomeButton');
 if(target && !parent.querySelector('[data-cf-r21-material-link]')){
  const button=root.document.createElement('button');button.type='button';button.className='guideBtn';button.dataset.cfR21MaterialLink='1';
  button.textContent='📁 FACTURAS DE MATERIAL POR PROYECTO';button.style.margin='12px 0 4px';button.onclick=()=>materials.open();
  const info=root.document.createElement('p');info.className='settingsHint';info.textContent='Reúne facturas de distintos proveedores por proyecto sin duplicar importes. Registra los gastos contables desde Compras.';
  target.insertAdjacentElement('afterend',button);button.insertAdjacentElement('afterend',info);
 }
 return result;
};
// Comprobar permisos al entrar en Ajustes, sin confiar en un UID embebido ni mostrar admin a otros usuarios.
const oldOpenSettings=root.openSettings;
if(typeof oldOpenSettings==='function')root.openSettings=function(...args){oldOpenSettings.apply(this,args);admin.check().catch(()=>{});};
})();
