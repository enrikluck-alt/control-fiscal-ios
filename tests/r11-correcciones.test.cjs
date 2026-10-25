'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('www/index.html','utf8'),wf=fs.readFileSync('.github/workflows/build-ios.yml','utf8');
function create(){
 const sheets={},account={id:'BOOK_R11_PERSONAL_ABCDEFGHIJKLMNOPQRSTUVWXYZ',email:'test@example.org',token:'TOK_R11'};
 const root={crypto:{randomUUID:()=>Math.random().toString(36).slice(2)},CFGoogleAccount:{active:()=>account,http:async(url,method='GET',body)=>{
  const m=decodeURIComponent(url.split('/values/')[1]?.split('?')[0]||'').match(/^'([^']+)'!(.+)$/);
  assert.ok(m,'Expected Google Sheets request '+url);const rows=(sheets[m[1]]??=[]);
  if(method==='GET')return {values:rows.map(x=>[...x])};
  if(url.includes(':append')){rows.push(...body.values);return{updates:{updatedRange:`'${m[1]}'!A${rows.length}:C${rows.length}`}};}
  if(method==='PUT'){rows[Number(m[2].match(/A(\d+)/)?.[1])-1]=[...body.values[0]];return {ok:true};}
  throw Error('Unknown method '+method);
 }}};root.window=root;
 const ctx={window:root,Date,Intl,console,URLSearchParams};
 vm.runInNewContext(fs.readFileSync('www/cf-invoice-numbering.js','utf8'),ctx);
 vm.runInNewContext(fs.readFileSync('www/cf-google-data.js','utf8'),ctx);
 return {root,sheets};
}
const body={accion:'emitirFactura',tercero:'Empresa Test',base:100,iva:21,ivaPorcentaje:21,total:121,
 emisor:JSON.stringify({name:'Emisor',taxId:'00000000T',address:'Ejemplo',postalCode:'16250',city:'Castillejo',province:'Cuenca'}),
 cliente:JSON.stringify({nombre:'Castillejo de Iniesta',cif:'P0000000G',direccion:'Ejemplo',cp:'16250',ciudad:'Castillejo',provincia:'Cuenca'}),
 lineas:JSON.stringify([{concepto:'Servicio',cantidad:1,precio:100}])};
const numberSchema={segments:[{type:'fixed',value:'F'},{type:'year'},{type:'fixed',value:'-'},{type:'sequence',width:3,start:1}]};
async function configure(root){await root.CFGoogleData.action({accion:'guardarConfiguracion',configuracion:JSON.stringify({cf_invoice_numbering_v1:JSON.stringify(numberSchema)})});}
test('R11: interpreta la serie F2026-xxx; rechaza series distintas y fechas incompatibles',()=>{
 const root={};root.window=root;vm.runInNewContext(fs.readFileSync('www/cf-invoice-numbering.js','utf8'),{window:root,Date,Intl});
 assert.equal(root.CFInvoiceNumbering.parseIndex(numberSchema,'F2026-015','2026-10-23T10:00:00Z'),15);
 assert.equal(root.CFInvoiceNumbering.parseIndex(numberSchema,'CF2026-015','2026-10-23T10:00:00Z'),null);
 assert.equal(root.CFInvoiceNumbering.parseIndex(numberSchema,'F2025-015','2026-10-23T10:00:00Z'),null);
});
test('R11: manual 025 y siguiente 026 sin renumerar la primera',async()=>{
 const {root,sheets}=create();await configure(root);
 const first=await root.CFGoogleData.action({...body,requestId:'R11-REQUEST-0000001',numeroSolicitado:'F2026-025'});
 assert.equal(first.numeroFactura,'F2026-025');
 const second=await root.CFGoogleData.action({...body,requestId:'R11-REQUEST-0000002'});
 assert.equal(second.numeroFactura,'F2026-026');
 assert.deepEqual(Array.from((await root.CFGoogleData.action({accion:'listarFacturasEmitidas'})).facturas.map(x=>x.numeroFactura)),['F2026-025','F2026-026']);
 assert.equal(sheets.CF_Facturas_Emitidas.length,2);
});
test('R11: un número duplicado indica el cliente, no agrega otra emisión',async()=>{
 const {root,sheets}=create();await configure(root);
 await root.CFGoogleData.action({...body,requestId:'R11-REQUEST-0000003',numeroSolicitado:'F2026-025'});
 await assert.rejects(()=>root.CFGoogleData.action({...body,requestId:'R11-REQUEST-0000004',numeroSolicitado:'F2026-025'}),/ya existe y está asignado a otra factura: Empresa Test/);
 assert.equal(sheets.CF_Facturas_Emitidas.length,1);
});
test('R11: evita que se salte hacia atrás en numeración manual',async()=>{
 const {root,sheets}=create();await configure(root);
 await root.CFGoogleData.action({...body,requestId:'R11-REQUEST-0000005',numeroSolicitado:'F2026-025'});
 await assert.rejects(()=>root.CFGoogleData.action({...body,requestId:'R11-REQUEST-0000006',numeroSolicitado:'F2026-024'}),/retrocede/);
 assert.equal(sheets.CF_Facturas_Emitidas.length,1);
});
test('R15: Ajustes claro, Cloud para sugerencias y selector inline de tipo',()=>{
 assert.match(html,/body\.lightTheme #settingsPage \.cfSettingsNavBtn/);
 assert.match(html,/CFFeedback\.send/);assert.match(html,/Google Cloud no ha confirmado el envío/);assert.doesNotMatch(html,/mailto:/);
 assert.match(html,/id="cfInventoryNewTypeInline"/);assert.match(html,/id="cfInventoryNewTypeName"/);
 assert.doesNotMatch(html,/<button class="guideBtn" type="button" onclick="document.getElementById\('invItemCategory'\)/);
 assert.match(html,/cfFindInventoryPhotos/);assert.match(html,/commons\.wikimedia\.org\/w\/api\.php/);
 assert.match(html,/Mostrar facturas emitidas retiradas del listado/);
 assert.match(html,/id="invoiceManualNumber"/);
 assert.match(wf,/UI76-20261025-R18/);
});
