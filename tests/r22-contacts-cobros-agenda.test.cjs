'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=file=>fs.readFileSync(file,'utf8');
const html=source('www/index.html');
function modelHarness(){
 const store=new Map();let book={id:'BOOK_R22_A',email:'userA@example.com',token:'GOOGLE_TOKEN_A'};
 const tab=name=>{const id=book.id+':'+name;if(!store.has(id))store.set(id,[]);return store.get(id);};
 const root={crypto:{randomUUID:()=>Math.random().toString(36).slice(2)},CFGoogleAccount:{active:()=>({...book}),http:async(url,method='GET',body)=>{
   const range=decodeURIComponent(url.split('/values/')[1]?.split('?')[0]||'');const m=range.match(/^'([^']+)'!/);
   assert.ok(m,'Intervalo Sheets no válido: '+range);
   const rows=tab(m[1]);if(method==='GET')return {values:rows.map(r=>r.slice())};
   if(url.includes(':append')){rows.push(...body.values);return {updates:{updatedRows:body.values.length}};}
   throw Error('Operación HTTP inesperada: '+method+' '+url);
 }}};root.window=root;
 vm.runInNewContext(source('www/cf-google-data.js'),{window:root,URLSearchParams,console});
 return {action:root.CFGoogleData.action,tab,changeBook:id=>book={...book,id}};
}
function uiHarness(){
 let book={email:'userA@example.com',id:'BOOK_R22_A',token:'TOK'};
 const elements=new Map();const document={getElementById:id=>elements.get(id)||null,addEventListener(){},querySelectorAll:()=>[]};
 const root={document,navigator:{language:'es-ES',languages:['es-ES']},CFGoogleAccount:{active:()=>({...book})},
  CFR20Data:{records:()=>[],incomes:()=>[]},CFR21Materials:{items:()=>[],load:async()=>{}},loadPendingIncome:async()=>{}};
 root.window=root;
 vm.runInNewContext(source('www/cf-r22-features.js'),{window:root,Intl,Number,Date,console});
 return {root,elements,changeBook:id=>book={...book,id}};
}
test('R22: prefijo automático de país, conservación del internacional y validación',()=>{
 const {root}=uiHarness();const fn=root.CFR22.normalized;
 assert.equal(root.CFR22.detectedCountry(),'ES');
 assert.equal(fn('600 123 456','ES'),'+34600123456');
 assert.equal(fn('+33 6 12 34 56 78','ES'),'+33612345678');
 assert.equal(fn('0034 699-555-444','FR'),'+34699555444');
 assert.equal(fn('07123 456789','GB'),'+447123456789');
 assert.equal(fn('612345678','IT'),'+39612345678');
 assert.equal(fn('1234','ES'),'');
 assert.equal(fn('600 123 456',''),'');
});
test('R22: ingreso parcial guarda pago real, calcula pendiente y admite actualización sin perder identificación',async()=>{
 const {action}=modelHarness();
 await action({accion:'guardarIngresoPendiente',ingreso:JSON.stringify({id:'IP-R22-A',fecha:'2026-09-21',persona:'Cliente',servicio:'Montaje',material:160,importePrevisto:700,cobrado:50,estadoCobro:'parcial',proyecto:'Montaje 2026'})});
 let row=(await action({accion:'listarIngresosPendientes'})).ingresos[0];
 assert.equal(row.fecha,'2026-09-21');assert.equal(row.importePrevisto,700);assert.equal(row.cobrado,50);assert.equal(row.estadoCobro,'parcial');assert.equal(row.beneficio,-110);
 const changed=await action({accion:'editarIngresoIndependiente',id:'IP-R22-A',ingreso:JSON.stringify({fecha:'2026-10-01',persona:'Cliente',servicio:'Montaje y transporte',material:180,importePrevisto:850,cobrado:200,estadoCobro:'parcial',proyecto:'Montaje 2026'})});
 assert.equal(changed.id,'IP-R22-A');
 row=(await action({accion:'listarIngresosPendientes'})).ingresos[0];
 assert.equal(row.fecha,'2026-10-01');assert.equal(row.servicio,'Montaje y transporte');assert.equal(row.material,180);assert.equal(row.importePrevisto,850);assert.equal(row.cobrado,200);assert.equal(row.beneficio,20);assert.equal(row.estadoCobro,'parcial');
});
test('R22: estado parcial de factura mantiene documento fiscal, registra 50 y deja 150 pendientes',async()=>{
 const {action,tab}=modelHarness();
 await action({accion:'guardarRegistro',tipo:'Facturado',requestId:'FACT-R22-001',fecha:'2026-05-01',tercero:'Cliente B',concepto:'Sonido',base:200,total:200,estadoCobro:'pendiente'});
 const v=await action({accion:'cambiarEstadoCobro',clase:'factura',clave:'factura:FACT-R22-001',estadoCobro:'parcial',cobradoParcial:50});
 assert.equal(v.cobrado,50);assert.equal(v.pendiente,150);
 const list=(await action({accion:'syncRecords'})).facturacion;
 assert.equal(list[0].fecha,'2026-05-01');assert.equal(list[0].cobrado,50);assert.equal(list[0].estadoCobro,'parcial');
 assert.equal(tab('CF_Registros_v2').length,1,'El apunte fiscal original no se duplica');
});
test('R22: modifica importe y justificante de factura de material sin crear una factura nueva',async()=>{
 const {action}=modelHarness();
 const one=await action({accion:'guardarFacturaMaterialProyecto',factura:JSON.stringify({proyecto:'Escenario',proveedor:'Proveedor X',fecha:'2026-10-03',importe:95,documentoUrl:'https://drive.google.com/file/d/1/view'})});
 const changed=await action({accion:'editarFacturaMaterialProyecto',id:one.id,factura:JSON.stringify({proyecto:'Escenario',proveedor:'Proveedor X',fecha:'2026-10-04',importe:115,documentoUrl:'https://drive.google.com/file/d/1/view'})});
 assert.equal(changed.id,one.id);
 const rows=(await action({accion:'listarFacturasMaterialProyecto'})).facturas;
 assert.equal(rows.length,1);assert.equal(rows[0].fecha,'2026-10-04');assert.equal(rows[0].importe,115);
});
test('R22: Agenda separa compras, facturas e ingresos y marca cobros pendientes',async()=>{
 const {root,changeBook}=uiHarness();
 const records=[{fecha:'2026-10-09',tipo:'Compra',tercero:'Proveedor',concepto:'Luces',total:60,id:'buy1'},
  {fecha:'2026-10-11',tipo:'Facturación',tercero:'Cliente',concepto:'Servicio',total:400,estadoCobro:'parcial',id:'sale1'}];
 const incomes=[{id:'IP1',fecha:'2026-10-10',persona:'Cliente',servicio:'DJ',importePrevisto:300,estadoCobro:'pendiente'}];
 const materials=[{id:'MAT1',fecha:'2026-10-09',proveedor:'Proveedor2',proyecto:'Escenario',importe:20}];
 root.CFR20Data={records:()=>records,incomes:()=>incomes};root.CFR21Materials={items:()=>materials,load:async()=>{}};
 await root.CFR22Agenda.refresh();
 const rows=root.CFR22Agenda.collect();assert.equal(rows.length,4);
 assert.equal(rows.filter(x=>x.kind==='compras').length,2);
 assert.equal(rows.filter(x=>x.pendiente).length,2);
 assert.equal(rows.find(x=>x.id==='IP1').fecha,'2026-10-10');
 changeBook('BOOK_R22_B');assert.equal(root.CFR22Agenda.collect().length,0,'No se muestran operaciones del otro libro');
});
test('R22: GitHub conserva módulos R21/R22 y empaqueta los contactos nativos',()=>{
 const workflow=source('.github/workflows/build-ios.yml');const packageJson=JSON.parse(source('package.json'));
 for(const needed of ['cf-r21-features.js','cf-r22-features.js','contacts.bundle.js'])assert.ok(workflow.includes(needed),needed);
 assert.match(workflow,/npm run build:contacts/);assert.match(workflow,/NSContactsUsageDescription/);
 assert.equal(packageJson.dependencies['@capacitor/contacts'],'8.0.0');
 assert.match(html,/CFR21Admin\.open\(\)/);assert.match(html,/CFR21Admin\.check\(\)/);
 assert.match(html,/cfR22AgendaLegend/);assert.match(html,/CFR21Materials\.openForProject/);
});
