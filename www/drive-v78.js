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
global.ControlFiscalDriveV78=Object.freeze({inspect,repair,parseId});
})(window);
