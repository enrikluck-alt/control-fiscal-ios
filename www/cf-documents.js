/* Control Fiscal R10 - Documentos personales (carpetas jerárquicas + ficheros Drive).
   Solo se almacenan metadatos en CF_Registros_v2; los PDFs/JPG/PNG permanecen
   privados dentro del Drive autorizado por cada cuenta. */
(function(root){'use strict';
let nodes=[],folder=null,accountId=null,pending=false;
const el=id=>document.getElementById(id);
const uid=()=>root.crypto?.randomUUID?.()||('doc-'+Date.now()+'-'+Math.random().toString(36).slice(2));
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const current=()=>root.CFGoogleAccount?.active();
let thumbnails=null;let renderEpoch=0;let thumbLib=null;const previewUrls=new Set();
// A bounded, session-only private cache eliminates a second Drive download when a user
// taps a document whose thumbnail was already loaded.
const cached=new Map();let cachedBytes=0;const MAX_CACHE=12*1024*1024;
function cacheKey(book,id){return String(book||'')+':'+String(id||'');}
function clearCache(){cached.clear();cachedBytes=0;}
function cachePut(book,id,blob){if(!book||!id||blob.size>MAX_CACHE)return;
 const key=cacheKey(book,id);const old=cached.get(key);if(old)cachedBytes-=old.size;
 cached.delete(key);cached.set(key,blob);cachedBytes+=blob.size;
 while(cachedBytes>MAX_CACHE){const first=cached.keys().next().value;cachedBytes-=cached.get(first).size;cached.delete(first);}
}
root.CFDocBlobCache={get:(book,id)=>cached.get(cacheKey(book,id))||null,clear:clearCache};
const driveId=u=>/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/.exec(String(u||''))?.[1]||null;
function resetPreviews(){renderEpoch++;thumbnails?.disconnect();thumbnails=null;for(const u of previewUrls)URL.revokeObjectURL(u);previewUrls.clear();}
async function preview(doc,holder,epoch){
 const id=driveId(doc.url),s=current();if(!id||!s?.token||!s?.id)return;
 try{
  const response=await root.fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?alt=media',{headers:{Authorization:'Bearer '+s.token}});
  if(!response.ok)throw Error('Google Drive '+response.status);
  const blob=await response.blob();if(blob.size>6*1024*1024)throw Error('Documento demasiado grande para miniatura.');
  if(current()?.id===s.id)cachePut(s.id,id,blob);
  if(epoch!==renderEpoch||s.id!==current()?.id||!holder.isConnected)return;
  if(doc.mime==='application/pdf'){
   if(!thumbLib)thumbLib=import('./vendor/pdf.min.mjs').then(lib=>{lib.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.min.mjs',document.baseURI).href;return lib;}).catch(e=>{thumbLib=null;throw e;});
   const lib=await thumbLib;if(epoch!==renderEpoch)return;
   const load=lib.getDocument({data:new Uint8Array(await blob.arrayBuffer()),isEvalSupported:false});const pdf=await load.promise;
   try{const page=await pdf.getPage(1);if(epoch!==renderEpoch||!holder.isConnected)return;
    const base=page.getViewport({scale:1}),scale=Math.min(1.7,165/base.width);
    const dpr=document.body.classList.contains('cf-performance-low')?1:Math.min(root.devicePixelRatio||1,1.5),vp=page.getViewport({scale:scale*dpr});
    const canvas=document.createElement('canvas');canvas.width=Math.ceil(vp.width);canvas.height=Math.ceil(vp.height);canvas.style.maxWidth='100%';canvas.style.maxHeight='100%';
    await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;
    if(epoch===renderEpoch&&holder.isConnected)holder.replaceChildren(canvas);
   }finally{await pdf.destroy();}
  }else if(/^image\/(png|jpeg)$/.test(doc.mime||'')){
   const url=URL.createObjectURL(blob);previewUrls.add(url);
   const img=document.createElement('img');img.alt='Vista previa de '+String(doc.nombre||'documento');img.loading='lazy';img.src=url;
   if(epoch===renderEpoch&&holder.isConnected)holder.replaceChildren(img);
  }
 }catch(e){if(epoch===renderEpoch&&holder.isConnected)holder.title='La vista previa no está disponible: '+(e.message||e);}
}

const status=s=>{if(el('cfDocLibraryStatus'))el('cfDocLibraryStatus').textContent=s;};
function verifyAccount(){const s=current();if(!s?.id||!s?.token)throw Error('Inicia sesión con Google antes de consultar documentos.');if(accountId&&accountId!==s.id){nodes=[];folder=null;clearCache();}accountId=s.id;return s;}
async function load(){verifyAccount();const result=await root.CFGoogleData.action({accion:'listarDocumentos'});verifyAccount();nodes=Array.isArray(result.documentos)?result.documentos:[];if(folder&&!nodes.some(x=>x.id===folder&&x.tipo==='carpeta'))folder=null;render();}
function path(){const result=[];let parent=folder;const visited=new Set();while(parent&&!visited.has(parent)){visited.add(parent);const item=nodes.find(x=>x.id===parent);if(!item)break;result.unshift(item);parent=item.parentId||null;}return result;}
function render(){
 const trail=el('cfDocTrail'),wrap=el('cfDocLibraryItems');if(!trail||!wrap)return;
 resetPreviews();const epoch=renderEpoch;
 trail.replaceChildren();const parts=[{id:null,nombre:'Inicio / Documentos'},...path()];parts.forEach(p=>{const b=document.createElement('button');b.type='button';b.textContent=p.nombre;b.onclick=()=>{folder=p.id;render()};trail.appendChild(b)});
 wrap.replaceChildren();const list=nodes.filter(x=>(x.parentId||null)===folder).sort((a,b)=>Number(a.tipo!=='carpeta')-Number(b.tipo!=='carpeta')||String(a.nombre).localeCompare(String(b.nombre),'es'));
 if(!list.length){const empty=document.createElement('div');empty.className='settingsHint';empty.style.gridColumn='1/-1';empty.textContent='Carpeta vacía. Crea una subcarpeta o sube un PDF, JPG o PNG.';wrap.appendChild(empty);}
 if(root.IntersectionObserver){thumbnails=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;thumbnails?.unobserve(entry.target);const f=entry.target._cfDoc; if(f)preview(f,entry.target,epoch);}}, {root:null,rootMargin:'160px',threshold:0.01});}
 list.forEach(doc=>{
  const row=document.createElement('div');row.className='cfDocNode';
  const thumb=document.createElement('div');thumb.className='cfDocThumb';thumb.textContent=doc.tipo==='carpeta'?'📁':(doc.mime==='application/pdf'?'📄':'🖼️');
  const name=document.createElement('div');name.className='cfDocNodeName';name.textContent=doc.nombre;
  const actions=document.createElement('div');actions.className='cfDocActions';
  const view=document.createElement('button');view.type='button';view.textContent=doc.tipo==='carpeta'?'Abrir':'Ver';view.onclick=()=>{
   if(doc.tipo==='carpeta'){folder=doc.id;render();}else if(typeof root.openCFDocumentViewer==='function')root.openCFDocumentViewer(doc.url);else status('No está disponible el visor en esta versión.');
  };
  const del=document.createElement('button');del.type='button';del.textContent='Eliminar';del.setAttribute('aria-label','Eliminar '+doc.nombre);del.onclick=()=>remove(doc);
  actions.append(view,del);row.append(thumb,name,actions);wrap.appendChild(row);
  if(doc.tipo==='archivo'){thumb._cfDoc=doc;if(thumbnails)thumbnails.observe(thumb);else preview(doc,thumb,epoch);}
  else thumb.addEventListener('click',()=>{folder=doc.id;render();});
 });
 status(list.length+' elemento(s) · Vista en cuadrícula · Guardados en tu Google Drive.');
}
async function open(){root.only('documentsPage');root.nav('home');if(accountId&&current()?.id!==accountId){nodes=[];folder=null;}try{status('Cargando tus documentos…');await load();}catch(e){status('No se pudieron consultar: '+(e.message||e));}}
async function newFolder(){
 if(pending)return;const raw=root.prompt('Nombre de la carpeta (puedes crear carpetas dentro de otras):','');if(raw===null)return;
 const name=raw.trim();if(!name||name.length>120){status('El nombre debe tener entre 1 y 120 caracteres.');return;}
 if(nodes.some(x=>x.parentId===folder&&x.nombre.toLocaleLowerCase('es')===name.toLocaleLowerCase('es'))){status('Ya existe un elemento con ese nombre.');return;}
 pending=true;status('Creando carpeta…');try{verifyAccount();await root.CFGoogleData.action({accion:'guardarDocumento',documento:{id:uid(),tipo:'carpeta',nombre:name,parentId:folder,fecha:new Date().toISOString()}});await load();}catch(e){status('No se pudo crear: '+(e.message||e));}finally{pending=false;}
}
async function upload(file){
 const input=el('cfDocUpload');if(!file)return;const s=verifyAccount();
 if(!['application/pdf','image/png','image/jpeg'].includes(file.type)){status('Solo PDF, JPG o PNG.');if(input)input.value='';return;}
 if(file.size>5*1024*1024){status('Archivo superior a 5 MB. Redúcelo antes de subir.');if(input)input.value='';return;}
 if(pending)return;pending=true;status('Subiendo el documento…');const owner=s.id;
 try{
  const base64=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]||'');r.onerror=()=>reject(Error('No se pudo leer el archivo.'));r.readAsDataURL(file);});
  if(current()?.id!==owner)throw Error('La cuenta de Google cambió.');
  const url=await root.CFGoogleUploads.upload(file.name,file.type,base64,root.CFGoogleAccount.active());
  if(current()?.id!==owner)throw Error('La cuenta cambió después de subir el archivo. Comprueba Drive.');
  await root.CFGoogleData.action({accion:'guardarDocumento',documento:{id:uid(),nombre:file.name,tipo:'archivo',mime:file.type,url,parentId:folder,fecha:new Date().toISOString()}});
  await load();if(typeof root.cfSuccessFeedback==='function')await root.cfSuccessFeedback();
 }catch(e){status('No se pudo subir: '+(e.message||e));}
 finally{pending=false;if(input)input.value='';}
}
async function remove(doc){
 if(pending)return;if(doc.tipo==='carpeta'&&nodes.some(x=>x.parentId===doc.id)){status('Esta carpeta contiene archivos o subcarpetas. Vacíala antes.');return;}
 if(!root.confirm('¿Quitar «'+doc.nombre+'» del archivo de Control Fiscal? El archivo original seguirá en Drive para evitar pérdidas accidentales.'))return;
 pending=true;try{await root.CFGoogleData.action({accion:'eliminarDocumento',id:doc.id});await load();if(typeof root.cfSuccessFeedback==='function')await root.cfSuccessFeedback();}catch(e){status('No se pudo quitar: '+(e.message||e));}finally{pending=false;}
}
function back(){if(folder){folder=path().at(-2)?.id||null;render();}else root.goHome();}
root.CFDocuments=Object.freeze({open,newFolder,upload,back});
})(window);
