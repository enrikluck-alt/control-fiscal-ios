'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const dataSource=fs.readFileSync('www/cf-google-data.js','utf8');
function fakeData(){
 const sheets={},session={email:'a@example.com',id:'LONG_SPREADSHEET_A_123456789',token:'A_TOKEN_123456789012345678901'};
 const getSheet=(s,tab)=>{const byBook=sheets[s.id]??={};return byBook[tab]??=[];};
 const root={CFGoogleAccount:{active:()=>session,http:async (url,method='GET',body)=>{
  const notation=decodeURIComponent(url.split('/values/')[1]?.split('?')[0]||'');
  const match=notation.match(/^'([^']+)'!(.+)$/);assert.ok(match,notation);
  const rows=getSheet(session,match[1]);
  if(method==='GET')return {values:rows.map(r=>[...r])};
  if(url.includes(':append')){
   rows.push(...body.values);let row=rows.length;
   return {updates:{updatedRange:`'${match[1]}'!A${row}:C${row}`}};
  }
  if(method==='PUT'){
   const row=Number(match[2].match(/A(\d+)/)[1])-1;rows[row]=[...body.values[0]];return {updatedRows:1};
  }
  throw Error('Unsupported '+method);
 }}};
 root.window=root;vm.runInNewContext(dataSource,{window:root,console,URLSearchParams,Date});
 return {root,session,getSheet,sheets};
}
test('R3: emisión crea números correlativos separados del historial y registra PDF',async()=>{
 const {root,session,getSheet}=fakeData();
 const payload={accion:'emitirFactura',requestId:'REQUEST-EMISSION-ONE-12345678',tercero:'Cliente Ejemplo',base:100,iva:21,total:121,ivaPorcentaje:21,
  emisor:JSON.stringify({name:'Chispas Sound',taxId:'B12345',address:'Calle A 1',postalCode:'16001',city:'Cuenca',province:'Cuenca'}),
  cliente:JSON.stringify({nombre:'Cliente Test',cif:'X111',direccion:'Calle B',cp:'02001',ciudad:'Albacete',provincia:'Albacete'}),
  lineas:JSON.stringify([{concepto:'Alquiler sonido',cantidad:1,precio:100}])};
 const a=await root.CFGoogleData.action(payload);assert.equal(a.numeroFactura,'CF-000001');assert.equal(a.facturaEmitida,true);
 const b=await root.CFGoogleData.action({...payload,requestId:'REQUEST-EMISSION-TWO-12345678'});assert.equal(b.numeroFactura,'CF-000002');
 const retry=await root.CFGoogleData.action(payload);assert.equal(retry.numeroFactura,a.numeroFactura);
 assert.equal(getSheet(session,'CF_Facturas_Emitidas').length,2);
 assert.equal(getSheet(session,'Facturación').length,0);
 const invoice=(await root.CFGoogleData.action({accion:'listarFacturasEmitidas'})).facturas;
 assert.equal(invoice.length,2);assert.equal(invoice[0].cliente.nombre,'Cliente Test');
 await root.CFGoogleData.action({accion:'registrarDocumentoFactura',numeroFactura:'CF-000001',url:'https://drive.google.com/file/d/TEST/view'});
 const reread=(await root.CFGoogleData.action({accion:'listarFacturasEmitidas'})).facturas;
 assert.match(reread[0].facturaUrl,/drive.google.com/);
 await assert.rejects(()=>root.CFGoogleData.action({accion:'registrarDocumentoFactura',numeroFactura:'CF-999999',url:'https://drive.google.com/file/d/TEST/view'}),/No se encontró/);
});
test('R3: dos emisores de cuentas diferentes tienen almacenamiento separado',async()=>{
 const {root,session,getSheet}=fakeData();
 await root.CFGoogleData.action({accion:'guardarTipoInventario',tipo:'Microfonía'});
 assert.deepEqual(Array.from((await root.CFGoogleData.action({accion:'listarTiposInventario'})).tipos),['Microfonía']);
 const aId=session.id;session.email='b@example.com';session.id='LONG_SPREADSHEET_B_123456789';session.token='B_TOKEN_123456789012345678901';
 assert.equal((await root.CFGoogleData.action({accion:'listarTiposInventario'})).tipos.length,0);
 await root.CFGoogleData.action({accion:'guardarTipoInventario',tipo:'Truss'});
 assert.equal(getSheet({id:aId},'Configuracion').length,1);
});
test('R3: Calendar utiliza ID estable y no duplica un evento ante HTTP 409',async()=>{
 const calls=[];let created=false;
 const account={token:'TOKEN_A',id:'SPREADSHEET_A12345',email:'a@example.com'};
 const root={CFGoogleAccount:{active:()=>account},crypto:webcrypto,TextEncoder,
  fetch:async(url,opts)=>{
   const body=JSON.parse(opts.body),id=body.id||url.split('/').pop();calls.push({url,method:opts.method,body});
   if(opts.method==='POST'&&created)return {ok:false,status:409,json:async()=>({error:{message:'Already exists'}})};
   if(opts.method==='POST')created=true;
   return {ok:true,status:200,json:async()=>({id})};
  }
 };root.window=root;
 vm.runInNewContext(fs.readFileSync('www/cf-google-extras.js','utf8'),{window:root,console,Date,Intl,TextEncoder,Uint8Array});
 const e={id:'EV-123',fecha:'2026-10-22',evento:'Montaje',horaInicio:'21:00',horaFin:'02:00',ubicacion:'Albacete'};
 const a=await root.CFGoogleExtras.upsertCalendar(e),b=await root.CFGoogleExtras.upsertCalendar(e);
 assert.equal(a.id,b.id);assert.equal(calls[0].method,'POST');assert.equal(calls[2].method,'PUT');
 assert.equal(calls[0].body.end.dateTime.split('T')[0],'2026-10-23');
});
test('R3: Gmail solo confirma cuando Google devuelve ID y el MIME adjunta PDF',async()=>{
 let mime='';const account={token:'TOKEN',id:'BOOK_A',email:'a@example.com'};
 const root={CFGoogleAccount:{active:()=>account},TextEncoder,btoa:globalThis.btoa,fetch:async(url,opts)=>{
  assert.match(url,/gmail\/v1\/users\/me\/messages\/send/);
  const raw=JSON.parse(opts.body).raw;mime=Buffer.from(raw.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8');
  return {ok:true,status:200,json:async()=>({id:'CONFIRMED_GMAIL_ID'})};
 }};root.window=root;
 vm.runInNewContext(fs.readFileSync('www/cf-google-extras.js','utf8'),{window:root,console,Date,Intl,TextEncoder,Uint8Array});
 const r=await root.CFGoogleExtras.sendInvoice({recipient:'cliente@example.es',number:'CF-000001',issuer:'Chispas Sound',pdfBase64:'JVBERi0xLjQ='});
 assert.equal(r.id,'CONFIRMED_GMAIL_ID');assert.match(mime,/To: cliente@example.es/);assert.match(mime,/Content-Type: application\/pdf/);assert.match(mime,/JVBERi0xLjQ=/);
});
test('R3: CP con varios municipios requiere elección, y ciudad puede tener varios CP',()=>{
 const root={};root.window=root;
 vm.runInNewContext(fs.readFileSync('www/cf-postal.js','utf8'),{window:root,console});
 const db={postcodes:{'02001':['02003'],'02124':['02006','02011'],'02125':['02011']},municipalities:{'02003':{nombre:'Albacete',codigos_postales:['02001']},'02006':{nombre:'Balazote',codigos_postales:['02124']},'02011':{nombre:'Bonete',codigos_postales:['02124','02125']}}};
 assert.equal(root.CFPostal.fromPostal(db,'02001')[0].city,'Albacete');
 assert.equal(root.CFPostal.fromPostal(db,'02124').length,2);
 assert.equal(root.CFPostal.fromCity(db,'Bonete','Albacete').length,2);
});
test('R3: diseño V76 y navegación conservados, borrador persiste y herramientas Google están enlazadas',()=>{
 const html=fs.readFileSync('www/index.html','utf8');
 for(const mark of ['captureInvoiceDraft','restoreInvoiceDraft','invoiceEmailCopy','resetInvoiceForm','CFGoogleExtras.upsertCalendar','enablePendingNotifications','cf-google-extras.js','cf-postal.js','EMITIR FACTURA Y GENERAR PDF']) assert.ok(html.includes(mark),mark);
 assert.match(html,/schedule:\{on:\{hour,minute\},repeats:true\}/);
 const workflow=fs.readFileSync('.github/workflows/build-ios.yml','utf8');
 for(const f of ['cf-google-extras.js','cf-postal.js','UI76-20261023-R17'])assert.ok(workflow.includes(f));
});
