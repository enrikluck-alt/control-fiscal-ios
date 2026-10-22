'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function options(){const r={};r.window=r;vm.runInNewContext(fs.readFileSync('www/cf-invoice-numbering.js','utf8'),{window:r,Date,Intl,console});return r.CFInvoiceNumbering;}
function env(){const sheets={},account={id:'BOOK_FOR_TEST_123456789123',email:'sample@example.com',token:'TOKEN_1234567890123456789'};let numbering;
 const root={CFGoogleAccount:{active:()=>account,http:async(url,method='GET',body)=>{
  const path=decodeURIComponent(url.split('/values/')[1]?.split('?')[0]||'');const match=path.match(/^'([^']+)'!(.+)$/);
  assert.ok(match,'unknown path '+url);const name=match[1],rows=(sheets[name]??=[]);
  if(method==='GET')return {values:rows.map(r=>[...r])};
  if(url.includes(':append')){rows.push(...body.values);const n=rows.length;return {updates:{updatedRange:`'${name}'!A${n}:C${n}`}};}
  if(method==='PUT'){rows[Number(match[2].match(/A(\d+)/)[1])-1]=[...body.values[0]];return {updatedRows:1};}
  throw Error('unsupported '+method);
 }}};
 root.window=root;
 const context={window:root,Date,Intl,console,URLSearchParams};
 vm.runInNewContext(fs.readFileSync('www/cf-invoice-numbering.js','utf8'),context);
 vm.runInNewContext(fs.readFileSync('www/cf-google-data.js','utf8'),context);
 return {root,rows:sheets};
}
const doc={accion:'emitirFactura',tercero:'Compañía Test',base:100,iva:21,ivaPorcentaje:21,total:121,
 emisor:JSON.stringify({name:'Empresa Test',taxId:'B00000001',address:'Calle Falsa 1',postalCode:'02001',city:'Albacete',province:'Albacete'}),
 cliente:JSON.stringify({nombre:'Cliente Test',cif:'B00000002',direccion:'Calle Ejemplo 2',cp:'16250',ciudad:'Castillejo de Iniesta',provincia:'Cuenca'}),
 lineas:JSON.stringify([{concepto:'Equipo de sonido',cantidad:1,precio:100}])};
test('R4: formato configurable F2026-001 y F-2026-001, años automáticos e incrementos',()=>{
 const o=options();assert.equal(o.format(o.DEFAULT,1,'2026-10-22T12:00:00Z'),'F2026-001');
 assert.equal(o.format({...o.DEFAULT,segments:[{type:'fixed',value:'F-'},{type:'year'}, {type:'fixed',value:'-'},{type:'sequence',width:3,start:10}]},2,'2026-10-22T12:00:00Z'),'F-2026-011');
 assert.equal(o.format(o.DEFAULT,3,'2026-12-31T23:20:00Z'),'F2027-003','El año de la empresa es Europe/Madrid');
 assert.throws(()=>o.normalize({segments:[{type:'fixed',value:'F'}]}),/incremental/);
});
test('R4: números antiguos se conservan al cambiar el diseño de la serie',async()=>{
 const {root,rows}=env(),action=root.CFGoogleData.action;
 const a=await action({...doc,requestId:'REQUEST-10000000000000001'});assert.equal(a.numeroFactura,'CF-000001');
 await action({accion:'guardarConfiguracion',configuracion:JSON.stringify({cf_invoice_numbering_v1:JSON.stringify(root.CFInvoiceNumbering.DEFAULT)})});
 const b=await action({...doc,requestId:'REQUEST-10000000000000002'});assert.equal(b.numeroFactura,'F2026-002');
 const newSchema={segments:[{type:'fixed',value:'FV-'},{type:'year'},{type:'fixed',value:'-'},{type:'sequence',width:4,start:1}]};
 await action({accion:'guardarConfiguracion',configuracion:JSON.stringify({cf_invoice_numbering_v1:JSON.stringify(newSchema)})});
 const c=await action({...doc,requestId:'REQUEST-10000000000000003'});assert.equal(c.numeroFactura,'FV-2026-0003');
 const result=(await action({accion:'listarFacturasEmitidas'})).facturas.map(x=>x.numeroFactura);
 assert.deepEqual(Array.from(result),['CF-000001','F2026-002','FV-2026-0003']);
 assert.equal(rows.CF_Facturas_Emitidas.length,3);
 await action({accion:'registrarDocumentoFactura',numeroFactura:'F2026-002',url:'https://drive.google.com/file/d/TEST/view'});
 assert.equal((await action({accion:'listarFacturasEmitidas'})).facturas[1].facturaUrl,'https://drive.google.com/file/d/TEST/view');
});
test('R4: impide emisión con número que ya aparece en facturas antiguas',async()=>{
 const {root,rows}=env(),action=root.CFGoogleData.action;
 rows['Facturación']=[['Fecha','Empresa','Concepto','Base','IVA','IVA','Total','Factura','Número'],['2026-10-20','Cliente Antiguo','Servicio',100,21,21,121,'','F2026-001']];
 await action({accion:'guardarConfiguracion',configuracion:JSON.stringify({cf_invoice_numbering_v1:JSON.stringify(root.CFInvoiceNumbering.DEFAULT)})});
 await assert.rejects(()=>action({...doc,requestId:'REQUEST-10000000000000004'}),/ya existe/);
 assert.equal((rows.CF_Facturas_Emitidas||[]).length,0);
});
test('R4: el workflow conserva el módulo nuevo, el gráfico no requiere API externa, y usa diseño adaptable',()=>{
 const html=fs.readFileSync('www/index.html','utf8'),w=fs.readFileSync('.github/workflows/build-ios.yml','utf8');
 for(const word of ['cfSummaryChart','renderSummaryChart','cfInvoiceNumberModal','cfGraphicsMode','cfInvoiceLogoInput','@media(min-width:700px)','@media(max-width:390px)','ABRIR PORTAL OFICIAL DE LICITACIONES'])assert.ok(html.includes(word),word);
 assert.match(w,/cf-invoice-numbering.js/);assert.match(w,/UI76-20261022-R6/);
 assert.doesNotMatch(html,/data-cf-ui-build="UI76-20261022-R3"/);
});
