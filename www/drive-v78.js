/* V78 recovery-only: NEVER creates another spreadsheet. */
(function(global){'use strict';
const DRIVE_ROOT='https://www.googleapis.com';
const SHEETS_ROOT='https://sheets.googleapis.com';
const TABS=['Configuracion','Compras','Facturas','Inventario','Clientes','Agenda','Ingresos'];
async function request(token,path,method='GET',body){
 if(typeof token!=='string'||token.length<20)throw Error('Token OAuth ausente');
 const http=global.CapacitorHttpNative;
 if(!http||typeof http.request!=='function')throw Error('HTTP nativo no disponible');
 const root=path.startsWith('/sheets/v4/')?SHEETS_ROOT:DRIVE_ROOT;
 const apiPath=path.startsWith('/sheets/v4/')?path.slice('/sheets'.length):path;
 const opts={url:root+apiPath,method,headers:{Authorization:'Bearer '+token,Accept:'application/json'}};
 if(body!==undefined){opts.headers['Content-Type']='application/json';opts.data=body;}
 let r;try{r=await http.request(opts);}catch(e){throw Error('Error de transporte: '+String(e?.message||e).slice(0,180));}
 let d=r.data;if(typeof d==='string'){try{d=JSON.parse(d)}catch{d={raw:d.slice(0,150)}}}
 if(!d||typeof d!=='object')d={};
 if(r.status<200||r.status>=300){const detail=d.error?.message||d.error?.status||d.message||d.raw||'sin detalle';throw Error('HTTP '+r.status+' '+String(detail).slice(0,260));}
 return d;
}
function parseId(raw){const s=String(raw||'').trim();const m=s.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);const id=m?m[1]:s;if(!/^[a-zA-Z0-9_-]{20,}$/.test(id))throw Error('Introduce el ID o la URL completa de la hoja existente');return id;}
async function inspect(token,rawId){const id=parseId(rawId);
 const drive=await request(token,'/drive/v3/files/'+encodeURIComponent(id)+'?fields=id,name,mimeType,appProperties');
 if(drive.mimeType!=='application/vnd.google-apps.spreadsheet')throw Error('El archivo de Drive no es Google Sheets');
 let sheet;try{sheet=await request(token,'/sheets/v4/spreadsheets/'+encodeURIComponent(id)+'?fields=spreadsheetId,sheets(properties(sheetId,title))');}
 catch(e){throw Error('Drive encuentra "'+drive.name+'" pero Sheets API falla: '+e.message+'. No se ha modificado nada. Comprueba que Google Sheets API esté habilitada en el proyecto y el alcance del token.');}
 return {id,drive,sheet};
}
async function repair(token,rawId){const before=await inspect(token,rawId);const sheets=before.sheet.sheets||[];
 const names=new Set(sheets.map(s=>s.properties?.title));const requests=[];
 const defaultSheet=sheets.find(s=>['Hoja 1','Sheet1'].includes(s.properties?.title));
 if(defaultSheet&&!names.has('Configuracion')){requests.push({updateSheetProperties:{properties:{sheetId:defaultSheet.properties.sheetId,title:'Configuracion'},fields:'title'}});names.add('Configuracion');}
 for(const title of TABS)if(!names.has(title))requests.push({addSheet:{properties:{title}}});
 if(requests.length)await request(token,'/sheets/v4/spreadsheets/'+encodeURIComponent(before.id)+':batchUpdate','POST',{requests});
 const after=await inspect(token,before.id);
 const finalNames=(after.sheet.sheets||[]).map(s=>s.properties?.title);
 const missing=TABS.filter(t=>!finalNames.includes(t));
 if(missing.length)throw Error('Faltan pestañas tras actualizar: '+missing.join(', '));
 return {id:before.id,name:before.drive.name,changed:requests.length,tabs:finalNames};
}
const BOOK_TITLE='Control Fiscal - Datos fiscales';
const APP_KEY='controlFiscalVersion';
const APP_VERSION='78';
async function discover(token){
 // drive.file only lists files this OAuth application can access; never claim global account visibility.
 const query="mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false and (name = '"+BOOK_TITLE+"' or appProperties has { key = '"+APP_KEY+"' and value = '"+APP_VERSION+"' })";
 let next=null,files=[];
 do{
  const params=new URLSearchParams({q:query,fields:'nextPageToken,files(id,name,mimeType,appProperties)',pageSize:'100'});
  if(next)params.set('pageToken',next);
  const result=await request(token,'/drive/v3/files?'+params.toString());
  files.push(...(result.files||[]));next=result.nextPageToken||null;
  if(files.length>100)throw Error('Demasiados libros candidatos: selección manual necesaria');
 }while(next);
 const unique=[...new Map(files.map(f=>[f.id,f])).values()];
 if(unique.length>1)throw Error('Se encontraron '+unique.length+' libros candidatos. No se creará otro; pega el enlace del correcto para seleccionarlo.');
 return unique[0]||null;
}
async function createPersonalBook(token){
 // Creation through Drive makes it app-created under drive.file. No retries on partial success.
 const metadata={name:BOOK_TITLE,mimeType:'application/vnd.google-apps.spreadsheet',appProperties:{[APP_KEY]:APP_VERSION}};
 const file=await request(token,'/drive/v3/files?fields=id,name,mimeType','POST',metadata);
 if(!file.id)throw Error('Drive no devolvió el ID del nuevo libro; no repitas la creación automáticamente');
 return file;
}
async function automaticBook(token,{allowCreate=false}={}){
 let file=await discover(token);let created=false;
 if(!file){
  if(!allowCreate)return {found:false,created:false};
  file=await createPersonalBook(token);created=true;
 }
 try{
  // An existing spreadsheet may still be propagating to Sheets immediately after creation.
  const repaired=await repair(token,file.id);
  return {found:true,created,id:repaired.id,name:repaired.name,tabs:repaired.tabs,changed:repaired.changed};
 }catch(error){
  throw Error((created?'El libro se ha creado, pero no se pudo configurar. NO vuelvas a crear otro. ':'El libro existe, pero no se pudo configurar. ')+
   'ID: '+file.id+'. '+error.message);
 }
}
const TEST_MARKER='CFV78_TEST_RW_V1';
async function findTestRows(token,id){
 const result=await request(token,'/sheets/v4/spreadsheets/'+encodeURIComponent(id)+'/values/'+encodeURIComponent('Configuracion!A:C'));
 const rows=Array.isArray(result.values)?result.values:[];
 return rows.map((row,index)=>({row,index:index+1})).filter(item=>item.row[0]===TEST_MARKER);
}
async function verifyTest(token,rawId){
 const book=await inspect(token,rawId);
 const names=(book.sheet.sheets||[]).map(s=>s.properties?.title);
 if(!names.includes('Configuracion'))throw Error('Falta la pestaña Configuracion');
 const matches=await findTestRows(token,book.id);
 if(matches.length>1)throw Error('Se encontraron '+matches.length+' registros de prueba; no se escribirá nada más');
 if(matches.length===0)return {id:book.id,found:false,count:0};
 const values=matches[0].row;
 if(values[2]!=='LECTURA_OK')throw Error('Registro de prueba incompleto en fila '+matches[0].index);
 return {id:book.id,found:true,count:1,row:matches[0].index,marker:values[0],value:values[1]};
}
async function writeAndVerifyTest(token,rawId){
 const before=await verifyTest(token,rawId);
 if(before.found)return {...before,created:false};
 const value='Prueba V78 '+new Date().toISOString();
 await request(token,'/sheets/v4/spreadsheets/'+encodeURIComponent(before.id)+'/values/'+encodeURIComponent('Configuracion!A:C')+':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS','POST',{
  values:[[TEST_MARKER,value,'LECTURA_OK']]
 });
 const after=await verifyTest(token,before.id);
 if(!after.found||after.value!==value)throw Error('La escritura se envió, pero la lectura no coincide. No repitas la escritura; usa Verificar lectura.');
 return {...after,created:true};
}
global.ControlFiscalDriveV78=Object.freeze({inspect,repair,parseId,verifyTest,writeAndVerifyTest,discover,automaticBook});
})(window);
