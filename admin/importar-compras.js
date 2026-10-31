/* Control Fiscal R28 · importación de compras en navegador.
 * Usuario propio: OAuth Google + Drive/Sheets de esa cuenta; NO se envían datos fiscales
 * a Firebase Firestore. Este módulo web NO usa tokens nativos del iPhone.
 */
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {MARK,LEDGER,parseCsv,normalizeDate,euroAmount,taxParts,sniffFile,normalizeName,ledgerRecord,ledgerRow,existingPurchases} from './importar-compras-core.mjs';

const app=initializeApp({
  apiKey:'AIzaSyAsxoyGelj8nuzuVcc0bDfqXFUZbY6wGMw',
  authDomain:'control-fiscal-511118.firebaseapp.com',
  projectId:'control-fiscal-511118',
  appId:'1:429272495544:web:04878cb97369290a30cb4d'
});
const auth=getAuth(app), $=id=>document.getElementById(id);
let session=null,book=null,rows=[],busy=false,known={requests:new Set(),hashes:new Set()};
const uid=()=>crypto.randomUUID();
const uuid=()=>crypto.randomUUID();
const displayMoney=x=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(x||0);
function announce(message,type='info'){$('status').textContent=message;$('status').className='status '+(type==='error'?'error':type==='success'?'success':'');}
function err(error){return String(error?.message||error||'Error desconocido').slice(0,500);}
function requireSession(){if(!session?.token||!auth.currentUser||auth.currentUser.uid!==session.uid)throw Error('Se ha cerrado o cambiado la sesión. Inicia sesión de nuevo.');return session;}
function requireBook(){const s=requireSession();if(!book?.id||book.email!==s.email||book.uid!==s.uid)throw Error('Selecciona y verifica tu libro de Google Sheets.');return {s,id:book.id};}
async function google(url,options={}){
 const s=requireSession();let response;
 try{response=await fetch(url,{...options,headers:{Authorization:'Bearer '+s.token,Accept:'application/json',...(options.headers||{})}});}
 catch(e){throw Error('No se pudo conectar con Google: '+err(e));}
 let body;try{body=await response.json();}catch{body={};}
 if(!response.ok){const detail=String(body?.error?.message||body?.error||response.statusText||'Sin detalle').slice(0,250);
   if(response.status===401)throw Error('La autorización de Google ha caducado. Vuelve a iniciar sesión. ('+detail+')');
   throw Error('Google HTTP '+response.status+': '+detail);
 }
 return body;
}
function sheetId(value){const raw=String(value||'').trim(),match=raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);const id=match?match[1]:raw;return /^[a-zA-Z0-9_-]{20,}$/.test(id)?id:'';}
async function signIn(){
 if(busy)return;
 $('login').disabled=true;
 try{
  const provider=new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/spreadsheets');
  provider.addScope('https://www.googleapis.com/auth/drive.file');
  provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
  provider.setCustomParameters({prompt:'consent',access_type:'online'});
  const result=await signInWithPopup(auth,provider);
  const token=GoogleAuthProvider.credentialFromResult(result)?.accessToken;
  const email=String(result.user.email||'').toLowerCase();
  if(!token||!email||!result.user.emailVerified)throw Error('Google no ha proporcionado permisos y correo verificado. Vuelve a iniciar sesión.');
  session={token,email,uid:result.user.uid};book=null;rows=[];known={requests:new Set(),hashes:new Set()};
  $('account').textContent='Conectado: '+email;
  $('auth-section').classList.add('hidden');$('book-section').classList.remove('hidden');$('import-section').classList.add('hidden');$('logout').classList.remove('hidden');
  announce('Sesión verificada. Ahora selecciona el libro personal que utilizas en Control Fiscal.','success');
  await discoverBooks();
 }catch(error){announce('No se ha podido completar el acceso: '+err(error)+'. Si Google bloquea los permisos, revisa la pantalla de consentimiento OAuth y sus usuarios de prueba.','error');}
 finally{$('login').disabled=false;}
}
async function discoverBooks(){
 if(busy)return;
 $('refresh-books').disabled=true;
 try{
  const q="mimeType='application/vnd.google-apps.spreadsheet' and trashed=false and (name contains 'Control Fiscal' or name contains 'Control fiscal')";
  const params=new URLSearchParams({q,fields:'nextPageToken,files(id,name,mimeType,ownedByMe)',pageSize:'100'});
  const entries=[];let token='';
  for(let i=0;i<10;i++){
   if(token)params.set('pageToken',token);else params.delete('pageToken');
   const res=await google('https://www.googleapis.com/drive/v3/files?'+params);
   entries.push(...(res.files||[]).filter(x=>x.ownedByMe===true));token=res.nextPageToken||'';if(!token)break;
  }
  const sel=$('books');sel.replaceChildren(new Option('Selecciona tu libro de Control Fiscal…',''));
  for(const entry of entries)sel.append(new Option(entry.name+' · '+entry.id.slice(0,7)+'…',entry.id));
  if(entries.length===1)sel.value=entries[0].id;
  announce(entries.length?'Encontrados '+entries.length+' libros de tu cuenta. Elige el correcto.':'No hay libros con ese nombre. Puedes pegar el enlace de tu Google Sheets existente.');
 }catch(error){announce('No se pudieron buscar libros de Drive: '+err(error)+'. Si conoces el enlace de tu Google Sheets, puedes pegarlo abajo.','error');}
 finally{$('refresh-books').disabled=false;}
}
async function openBook(){
 if(busy)return;
 const manually=$('manual-book').value.trim();
 const id=manually?sheetId(manually):sheetId($('books').value);
 if(!id){announce('Selecciona un libro o pega el enlace completo de Google Sheets.','error');return;}
 $('connect-book').disabled=true;
 try{
  const s=requireSession();
  const meta=await google('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?fields=id,name,trashed,ownedByMe,mimeType');
  if(!meta.ownedByMe||meta.trashed||meta.mimeType!=='application/vnd.google-apps.spreadsheet')throw Error('El libro debe ser de tu cuenta de Google y no estar en la papelera.');
  const info=await google('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(id)+'?fields=spreadsheetId,properties(title),sheets(properties(title))');
  const tabs=new Set((info.sheets||[]).map(x=>x.properties?.title));
  if(info.spreadsheetId!==id||!tabs.has(LEDGER)||!tabs.has('Compras'))throw Error('El archivo no es un libro Control Fiscal compatible (faltan Compras o CF_Registros_v2). Abre la app en iPhone primero.');
  const localKnown=await fetchExisting(id);
  requireSession();
  book={id,name:meta.name,email:s.email,uid:s.uid};known=localKnown;rows=[];
  $('current-book').textContent='✅ Libro verificado: '+meta.name+' (propiedad de '+s.email+')';
  $('import-section').classList.remove('hidden');renderRows();
  announce('Libro vinculado. Selecciona archivos PDF/JPG/PNG o un CSV y revisa las compras antes de importarlas.','success');
 }catch(error){announce('No se ha podido abrir el libro: '+err(error),'error');}
 finally{$('connect-book').disabled=false;}
}
async function fetchExisting(id){
 const range=encodeURIComponent("'"+LEDGER+"'!A:C");
 const r=await google('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(id)+'/values/'+range);
 return existingPurchases(r.values||[]);
}
function draft(record={}){
 return {id:uid(),requestId:'IMPORT-PC-'+uid(),file:null,mime:'',archivoNombre:record.archivoNombre||'',fecha:record.fecha||'',tercero:record.tercero||'',concepto:record.concepto||'',total:String(record.total??''),ivaPorcentaje:String(record.ivaPorcentaje??'21'),selected:true,status:'pending',message:'Pendiente',uploadUrl:'',hash:'',saved:false};
}
function setRowStatus(r,status,message){r.status=status;r.message=message;renderRows();}
function attachFile(row,file){if(row.file)return false;row.file=file;row.mime=sniffFile(file);row.archivoNombre=file.name;return true;}
async function receiveFiles(files){
 if(busy||!book){announce('Selecciona tu libro antes de añadir archivos.','error');return;}
 const list=[...files];if(!list.length)return;
 let added=0,matched=0;const errors=[];
 for(const file of list){
  if(file.name.toLowerCase().endsWith('.csv')){try{const data=parseCsv(await file.text());
    if(data.length>500)throw Error('Máximo 500 filas por CSV. Divide el archivo.');
    for(const item of data){const target=rows.find(x=>!x.saved&&x.file&&item.archivoNombre&&normalizeName(x.file.name)===normalizeName(item.archivoNombre));
      if(target){Object.assign(target,{fecha:item.fecha||item.fechaOriginal,tercero:item.tercero,concepto:item.concepto,total:item.total,ivaPorcentaje:item.ivaPorcentaje});matched++;}
      else{rows.push(draft({...item,fecha:item.fecha||item.fechaOriginal}));added++;}
    }
  }catch(e){errors.push(file.name+': '+err(e));}continue;}
  try{
   const mime=sniffFile(file);
   if(!mime)throw Error('Solo se admiten PDF, JPG, PNG y CSV.');
   const match=rows.find(x=>!x.saved&&!x.file&&x.archivoNombre&&normalizeName(x.archivoNombre)===normalizeName(file.name));
   if(match){attachFile(match,file);matched++;}
   else{const newRow=draft({archivoNombre:file.name,concepto:file.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').slice(0,120)});attachFile(newRow,file);rows.push(newRow);added++;}
  }catch(e){errors.push(file.name+': '+err(e));}
 }
 renderRows();
 announce(`Añadidos ${added} registros y asociados ${matched} adjuntos. ${errors.length?'Problemas:\n'+errors.join('\n'):''}`,errors.length?'error':'info');
}
function inputFor(row,field,type='text',label='',max=''){
 const inp=document.createElement('input');inp.type=type;inp.value=row[field]||'';inp.setAttribute('aria-label',label);
 if(type==='date'){inp.style.minWidth='135px';inp.style.width='144px';}else if(field==='tercero'){inp.style.width='155px';}else if(field==='concepto'){inp.style.width='175px';}else if(field==='ivaPorcentaje'){inp.style.width='75px';}else if(field==='total'){inp.style.width='100px';}if(max)inp.maxLength=max;
 inp.disabled=row.saved||busy;
 inp.addEventListener('input',()=>{row[field]=inp.value;updateFooter();});
 return inp;
}
function renderRows(){
 const body=$('rows');body.replaceChildren();
 for(const row of rows){
  const tr=document.createElement('tr');
  const checkTd=document.createElement('td'),check=document.createElement('input');check.type='checkbox';check.checked=row.selected;check.disabled=row.saved||busy;check.setAttribute('aria-label','Incluir compra '+row.archivoNombre);
  check.addEventListener('change',()=>{row.selected=check.checked;updateFooter();});checkTd.append(check);tr.append(checkTd);
  const fileTd=document.createElement('td');fileTd.style.maxWidth='150px';fileTd.style.overflowWrap='anywhere';fileTd.textContent=row.file?row.file.name:(row.archivoNombre||'Sin justificante');
  if(row.uploadUrl){const a=document.createElement('a');a.href=row.uploadUrl;a.target='_blank';a.rel='noopener noreferrer';a.textContent=' · Ver adjunto';fileTd.append(a);}
  if(row.file){const preview=document.createElement('button');preview.type='button';preview.textContent='Abrir archivo';preview.className='secondary';preview.style.padding='4px 8px';preview.style.display='block';preview.style.marginTop='5px';
   preview.addEventListener('click',()=>{const url=URL.createObjectURL(row.file);window.open(url,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(url),60000);});fileTd.append(preview);}
  tr.append(fileTd);
  for(const [field,type,label,max] of [['fecha','date','Fecha real de la compra',''],['tercero','text','Proveedor','160'],['concepto','text','Concepto','500'],['total','text','Total con IVA',''],['ivaPorcentaje','text','Porcentaje de IVA','']]){
   const td=document.createElement('td');td.append(inputFor(row,field,type,label,max));tr.append(td);
  }
  const stateTd=document.createElement('td');const state=document.createElement('span');state.className='state '+(row.status==='saved'||row.status==='duplicate'?'success':row.status==='error'?'error':'pending');state.textContent=row.message;stateTd.append(state);tr.append(stateTd);
  const last=document.createElement('td');if(!row.saved&&!busy){const remove=document.createElement('button');remove.className='secondary';remove.type='button';remove.textContent='Quitar';remove.addEventListener('click',()=>{rows=rows.filter(r=>r.id!==row.id);renderRows();});last.append(remove);}tr.append(last);
  body.append(tr);
 }
 if(!rows.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=9;td.textContent='Aún no hay compras seleccionadas.';tr.append(td);body.append(tr);}
 updateFooter();
}
function updateFooter(){
 const selected=rows.filter(r=>r.selected&&!r.saved);let total=0;
 for(const r of selected){const v=euroAmount(r.total);if(Number.isFinite(v))total+=v;}
 $('queue-count').textContent=`${rows.length} registros · ${selected.length} pendientes seleccionados · ${rows.filter(x=>x.saved).length} guardados`;
 $('total-amount').textContent='Total seleccionado: '+displayMoney(total);
 $('import').disabled=!selected.length||busy||!book;
}
async function shaFile(file){const content=await file.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',content);return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function uploadFile(row){
 if(!row.file||row.uploadUrl)return row.uploadUrl||'';
 const mime=sniffFile(row.file);
 const boundary='cf-r28-'+uuid().replace(/-/g,'');
 const safe=row.file.name.replace(/[\x00-\x1f/\\]/g,'_').slice(0,150);
 const meta={name:safe,description:'Justificante de compra de Control Fiscal · importación desde ordenador'};
 const blob=new Blob([
   '--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n',
   JSON.stringify(meta),'\r\n--'+boundary+'\r\nContent-Type: '+mime+'\r\n\r\n',
   row.file,'\r\n--'+boundary+'--\r\n'
 ],{type:'multipart/related; boundary='+boundary});
 const data=await google('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',{
   method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body:blob
 });
 if(!/^[A-Za-z0-9_-]{15,}$/.test(data.id||''))throw Error('Drive no devolvió un ID de archivo válido.');
 row.uploadUrl='https://drive.google.com/file/d/'+encodeURIComponent(data.id)+'/view';
 return row.uploadUrl;
}
async function appendLedger(r){
 const {id}=requireBook();
 const addr=encodeURIComponent("'"+LEDGER+"'!A:C");
 const url='https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(id)+'/values/'+addr+':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS';
 return google(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({values:[ledgerRow(r,new Date().toISOString())]})});
}
async function startImport(){
 if(busy)return;
 try{requireBook();}catch(e){announce(err(e),'error');return;}
 const selected=rows.filter(r=>r.selected&&!r.saved);
 if(!selected.length)return;
 if(selected.length>200){announce('Para reducir errores, importa como máximo 200 compras por lote.','error');return;}
 const issues=[];
 for(let i=0;i<selected.length;i++){
  const r=selected[i];try{ledgerRecord(r,uuid);if(r.file)sniffFile(r.file);}catch(e){issues.push((i+1)+'. '+(r.archivoNombre||'Fila CSV')+': '+err(e));}
 }
 if(issues.length){announce('Antes de importar corrige estas filas:\n'+issues.slice(0,20).join('\n')+(issues.length>20?'\n…':''),'error');return;}
 const total=selected.reduce((sum,r)=>sum+taxParts(r.total,r.ivaPorcentaje).total,0);
 if(!confirm(`Vas a guardar ${selected.length} compras por ${displayMoney(total)} en tu libro Google Sheets personal. Los documentos se subirán a tu Drive privado. ¿Continuar?`))return;
 busy=true;renderRows();let done=0,duplicates=0,failures=0;
 announce('Iniciando importación. No cierres esta pestaña hasta que termine.');
 for(const [index,row] of selected.entries()){
  try{
   requireBook();row.status='working';row.message=`Importando (${index+1}/${selected.length})…`;renderRows();
   if(known.requests.has(row.requestId)){
    row.saved=true;row.status='duplicate';row.message='Ya registrada (sin duplicar)';duplicates++;continue;
   }
   if(row.file){
    row.hash=row.hash||await shaFile(row.file);
    if(known.hashes.has(row.hash)){row.status='duplicate';row.message='Archivo ya importado; omitido';row.saved=true;duplicates++;continue;}
   }
   const url=await uploadFile(row);
   // Guardar el ID en la fila de Sheets siguiendo la estructura existente.
   const record=ledgerRecord({...row,facturaUrl:url,importacionPcHash:row.hash},uuid);
   try{await appendLedger(record);}catch(e){
    // Una respuesta de red perdida puede ocultar una escritura confirmada.
    // Antes de permitir reintentar, comprobar si se guardó el requestId.
    try{const refreshed=await fetchExisting(book.id);known=refreshed;if(!known.requests.has(row.requestId))throw e;}
    catch(recheck){throw new Error(err(e)+' (no se pudo confirmar el registro; revisa tu Google Sheets antes de repetir la importación).');}
   }
   known.requests.add(row.requestId);if(row.hash)known.hashes.add(row.hash);
   row.saved=true;row.status='saved';row.message='✓ Guardada en Sheets';done++;
  }catch(e){row.status='error';row.message=err(e);failures++;}
  finally{$('bar').style.width=Math.round((index+1)/selected.length*100)+'%';renderRows();}
 }
 busy=false;renderRows();
 announce(`Importación terminada: ${done} compras guardadas, ${duplicates} duplicadas omitidas y ${failures} pendientes de revisar.${failures?' Puedes corregir o reintentar solo las pendientes.':''}`,failures?'error':'success');
}
function clearPending(){if(busy)return;rows=rows.filter(r=>r.saved);renderRows();}
function downloadTemplate(){
 const csv='\ufefffecha;proveedor;concepto;total;iva;archivo\r\n2026-10-01;Proveedor de ejemplo;Material para proyecto;121,00;21;factura_ejemplo.pdf\r\n';
 const a=document.createElement('a');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 a.href=url;a.download='ControlFiscal_Plantilla_Compras.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
}
async function logout(){
 if(busy){announce('Termina la importación antes de cerrar sesión.','error');return;}
 session=null;book=null;rows=[];known={requests:new Set(),hashes:new Set()};
 try{await signOut(auth);}catch{};
 $('account').textContent='Sin conectar';$('auth-section').classList.remove('hidden');$('book-section').classList.add('hidden');$('import-section').classList.add('hidden');$('logout').classList.add('hidden');renderRows();announce('Sesión cerrada.');
}
$('login').addEventListener('click',signIn);
$('logout').addEventListener('click',logout);
$('refresh-books').addEventListener('click',discoverBooks);
$('connect-book').addEventListener('click',openBook);
$('files').addEventListener('change',async event=>{await receiveFiles(event.target.files);event.target.value='';});
$('csv').addEventListener('change',async event=>{await receiveFiles(event.target.files);event.target.value='';});
$('folder').addEventListener('change',async event=>{await receiveFiles(event.target.files);event.target.value='';});
$('template').addEventListener('click',downloadTemplate);
$('clear-pending').addEventListener('click',clearPending);
$('add-manual').addEventListener('click',()=>{if(busy||!book)return;rows.push(draft({}));renderRows();announce('Nueva compra creada. Completa los datos antes de guardarla.');});
$('import').addEventListener('click',startImport);
$('select-all').addEventListener('change',event=>{rows.forEach(r=>{if(!r.saved)r.selected=event.target.checked;});renderRows();});
$('bulk-apply').addEventListener('click',()=>{
 if(busy)return;
 const provider=$('bulk-provider').value.trim(),date=$('bulk-date').value,iva=$('bulk-iva').value.trim();
 if(!provider&&!date&&!iva){announce('Rellena al menos uno de los campos comunes.','error');return;}
 if(iva&&(Number(iva)<0||Number(iva)>100)){announce('El IVA común debe estar entre 0 y 100.','error');return;}
 let count=0;
 rows.forEach(r=>{if(!r.saved&&r.selected){if(provider)r.tercero=provider;if(date)r.fecha=date;if(iva)r.ivaPorcentaje=iva;count++;}});
 renderRows();announce('Datos comunes aplicados a '+count+' compras. Revisa cada fila antes de guardar.');
});

$('books').addEventListener('change',()=>{$('manual-book').value='';});
const zone=$('drop-zone');
zone.addEventListener('dragover',event=>{event.preventDefault();zone.classList.add('dragging');});
zone.addEventListener('dragleave',()=>zone.classList.remove('dragging'));
zone.addEventListener('drop',async event=>{event.preventDefault();zone.classList.remove('dragging');await receiveFiles(event.dataTransfer.files);});
