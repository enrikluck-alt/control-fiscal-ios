/* Control Fiscal R10 - Documentos personales (carpetas jerárquicas + ficheros Drive).
   Solo se almacenan metadatos en CF_Registros_v2; los PDFs/JPG/PNG permanecen
   privados dentro del Drive autorizado por cada cuenta. */
(function(root){'use strict';
let nodes=[],folder=null,accountId=null,pending=false;
const el=id=>document.getElementById(id);
const uid=()=>root.crypto?.randomUUID?.()||('doc-'+Date.now()+'-'+Math.random().toString(36).slice(2));
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const current=()=>root.CFGoogleAccount?.active();
const status=s=>{if(el('cfDocLibraryStatus'))el('cfDocLibraryStatus').textContent=s;};
function verifyAccount(){const s=current();if(!s?.id||!s?.token)throw Error('Inicia sesión con Google antes de consultar documentos.');if(accountId&&accountId!==s.id){nodes=[];folder=null;}accountId=s.id;return s;}
async function load(){verifyAccount();const result=await root.CFGoogleData.action({accion:'listarDocumentos'});verifyAccount();nodes=Array.isArray(result.documentos)?result.documentos:[];if(folder&&!nodes.some(x=>x.id===folder&&x.tipo==='carpeta'))folder=null;render();}
function path(){const result=[];let parent=folder;const visited=new Set();while(parent&&!visited.has(parent)){visited.add(parent);const item=nodes.find(x=>x.id===parent);if(!item)break;result.unshift(item);parent=item.parentId||null;}return result;}
function render(){
 const trail=el('cfDocTrail'),wrap=el('cfDocLibraryItems');if(!trail||!wrap)return;
 trail.replaceChildren();const parts=[{id:null,nombre:'Inicio / Documentos'},...path()];parts.forEach(p=>{const b=document.createElement('button');b.type='button';b.textContent=p.nombre;b.onclick=()=>{folder=p.id;render()};trail.appendChild(b)});
 wrap.replaceChildren();const list=nodes.filter(x=>(x.parentId||null)===folder).sort((a,b)=>Number(a.tipo!=='carpeta')-Number(b.tipo!=='carpeta')||String(a.nombre).localeCompare(String(b.nombre),'es'));
 if(!list.length){const empty=document.createElement('div');empty.className='settingsHint';empty.textContent='Carpeta vacía. Crea una subcarpeta o sube un PDF, JPG o PNG.';wrap.appendChild(empty);}
 list.forEach(doc=>{
  const row=document.createElement('div');row.className='cfDocNode';
  const icon=document.createElement('span');icon.textContent=doc.tipo==='carpeta'?'📁':(doc.mime==='application/pdf'?'📄':'🖼️');icon.style.fontSize='25px';
  const name=document.createElement('div');name.className='cfDocNodeName';name.textContent=doc.nombre;
  const view=document.createElement('button');view.type='button';view.textContent=doc.tipo==='carpeta'?'Abrir':'Ver';view.onclick=()=>{
   if(doc.tipo==='carpeta'){folder=doc.id;render();}else if(typeof root.openCFDocumentViewer==='function')root.openCFDocumentViewer(doc.url);else status('No está disponible el visor en esta versión.');
  };
  const del=document.createElement('button');del.type='button';del.textContent='Eliminar';del.setAttribute('aria-label','Eliminar '+doc.nombre);del.onclick=()=>remove(doc);
  row.append(icon,name,view,del);wrap.appendChild(row);
 });
 status(list.length+' elemento(s) · Guardados de forma privada en tu cuenta Google.');
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
