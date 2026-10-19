/* V78: libro personal de prueba. Token solo en memoria; llamadas nativas iOS. */
(function(global){
'use strict';
const ROOT='https://www.googleapis.com';
const TITLE='Control Fiscal - Datos fiscales';
const TABS=['Configuracion','Compras','Facturas','Inventario','Clientes','Agenda','Ingresos'];
const KEY='controlFiscalVersion';
function checkToken(t){if(typeof t!=='string'||t.length<20)throw Error('Falta token OAuth válido');}
async function request(token,path,method='GET',body){
  checkToken(token);
  const http=global.CapacitorHttpNative;
  if(!http||typeof http.request!=='function')throw Error('HTTP nativo no disponible');
  const opts={url:ROOT+path,method,headers:{Authorization:'Bearer '+token,Accept:'application/json'}};
  if(body!==undefined){opts.headers['Content-Type']='application/json';opts.data=body;}
  let response;
  try{response=await http.request(opts);}catch(e){throw Error('Error de transporte nativo: '+String(e?.message||e).slice(0,180));}
  let data=response.data;
  if(typeof data==='string'){try{data=JSON.parse(data)}catch{data={}}}
  if(!data||typeof data!=='object')data={};
  if(response.status<200||response.status>=300)throw Error('Google API HTTP '+response.status+': '+String(data.error?.message||data.error?.status||'sin detalle').slice(0,240));
  return data;
}
async function findBooks(token){
  const q="mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false and appProperties has { key = '"+KEY+"' and value = '78' }";
  const books=[];let pageToken;
  do{
    const p=new URLSearchParams({q,fields:'nextPageToken,files(id,name,appProperties)',pageSize:'100'});
    if(pageToken)p.set('pageToken',pageToken);
    const r=await request(token,'/drive/v3/files?'+p.toString());
    books.push(...(r.files||[]));pageToken=r.nextPageToken;
  }while(pageToken);
  return books;
}
async function ensureTabs(token,id){
  const r=await request(token,'/sheets/v4/spreadsheets/'+encodeURIComponent(id)+'?fields=sheets.properties.title');
  const existing=new Set((r.sheets||[]).map(s=>s.properties?.title));
  const missing=TABS.filter(t=>!existing.has(t));
  if(missing.length){
    await request(token,'/sheets/v4/spreadsheets/'+encodeURIComponent(id)+':batchUpdate','POST',{
      requests:missing.map(title=>({addSheet:{properties:{title}}}))
    });
  }
  return {missing:missing.length};
}
async function findOrCreateBook(token){
  const books=await findBooks(token);
  if(books.length>1)throw Error('Hay varios libros V78; no se creará otro. Revisar Drive.');
  if(books.length===1){
    const book=books[0];
    try{const tabs=await ensureTabs(token,book.id);return {id:book.id,name:book.name,created:false,tabsAdded:tabs.missing};}
    catch(e){throw Error('Libro existente ID '+book.id+'; '+e.message);}
  }
  // Drive crea y etiqueta en UNA petición, para poder recuperarlo incluso si Sheets falla.
  const created=await request(token,'/drive/v3/files?fields=id,name,appProperties','POST',{
    name:TITLE,mimeType:'application/vnd.google-apps.spreadsheet',appProperties:{[KEY]:'78'}
  });
  if(!created.id)throw Error('Drive no devolvió el ID del libro');
  try{
    const tabs=await ensureTabs(token,created.id);
    return {id:created.id,name:created.name||TITLE,created:true,tabsAdded:tabs.missing};
  }catch(e){
    throw Error('Libro creado, pero faltó configurar pestañas. NO repetir creación manualmente. ID: '+created.id+'; '+e.message);
  }
}
global.ControlFiscalDriveV78=Object.freeze({findBooks,findOrCreateBook});
})(window);
