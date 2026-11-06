'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=f=>fs.readFileSync(f,'utf8');
function app(elements={}){
 const root={document:{getElementById:id=>elements[id]||null,querySelector:()=>null},addEventListener(){},CFR32IncomeEditingId:()=>'',getInvoiceConfig:()=>({name:'Empresa de prueba',taxId:'A00000000'})};
 const shares=[];root.CFInvoiceShare={share:async doc=>{shares.push(doc);return true;}};
 vm.runInNewContext(read('www/cf-r31-budget.js'),{window:root,Intl,Date,Number,console});
 return {root,b:root.CFR31Budget,shares};
}
function calcInputs(){
 const row={querySelector:sel=>({'.cfR31Name':{value:'Artículo genérico'},'.cfR31Qty':{value:'2'},'.cfR31Cost':{value:'12'},'.cfR31Sale':{value:'30'}})[sel]||null};
 const materials={querySelectorAll:()=>[row]};
 const str=v=>({value:String(v)});
 return {cfR31IncomeMaterials:materials,cfR31IncomeLabor:str(50),cfR32IncomeVAT:str(21),pendingPerson:str('Cliente de prueba'),pendingDate:str('2026-11-06'),pendingProject:str('Proyecto de prueba'),pendingService:str('Servicio'),pendingEmail:str('cliente@example.com'),pendingPhone:str('+34111111111'),pendingPaidPart:str('20'),pendingIncomeMsg:{className:'',textContent:''}};
}
function sheetBackend(){
 const rows=new Map(),account={id:'BOOK_R32',email:'a@example.com',token:'TOKEN'};
 const root={crypto:{randomUUID:()=>String(Date.now())},CFGoogleAccount:{active:()=>({...account}),http:async(url,method='GET',data)=>{
  const range=decodeURIComponent(url.split('/values/')[1]?.split('?')[0]||''),match=range.match(/^'([^']+)'!/);assert.ok(match);
  const key=account.id+':'+match[1];if(!rows.has(key))rows.set(key,[]);const list=rows.get(key);
  if(method==='GET')return {values:list.map(x=>x.slice())};
  if(url.includes(':append')){list.push(...data.values);return {updates:{updatedRows:1}};}
  throw Error('Unexpected Sheets call '+method);
 }}};
 vm.runInNewContext(read('www/cf-google-data.js'),{window:root,URLSearchParams,console});
 return root.CFGoogleData.action;
}
test('R32 ingreso solo tiene líneas detalladas, mano de obra e IVA, sin importes globales editables',()=>{
 const h=read('www/index.html');const start=h.indexOf('function openPendingIncomeForm(recordId='),end=h.indexOf('\nfunction recalcPendingIncome',start),fn=h.slice(start,end);
 assert.ok(start>0&&end>start);
 assert.match(fn,/cfR31IncomeMaterials/);assert.match(fn,/cfR31IncomeLabor/);assert.match(fn,/cfR32IncomeVAT/);
 assert.match(fn,/CFR31Budget\.shareIncomeQuote\(\)/);assert.match(fn,/CFR31Budget\.openFromIncome\(\)/);
 assert.doesNotMatch(fn,/id="pendingMaterial"|id="pendingCharged"/);
 assert.match(h,/desgloseVersion:2/);
});
test('R32 precio venta 60 € + mano de obra 50 €, IVA 21% = 133,10 €; coste interno 24 €',()=>{
 const {b}=app(calcInputs());const result=b.incomeTotals();
 assert.equal(result.realCost,24);assert.equal(result.saleMaterials,60);assert.equal(result.labor,50);assert.equal(result.base,110);
 assert.equal(result.iva,23.1);assert.equal(result.total,133.1);assert.equal(result.invalid,false);
});
test('R32 presupuesto PDF del ingreso es local, con los materiales y mano de obra; no incluye costes reales',async()=>{
 const {b,shares,root}=app(calcInputs());await b.shareIncomeQuote();
 assert.equal(shares.length,1);const document=shares[0];assert.equal(document.presupuesto,true);assert.equal(document.numero,'SIN GUARDAR');
 assert.equal(document.payload.base,110);assert.equal(document.payload.iva,23.1);assert.equal(document.payload.total,133.1);
 assert.equal(document.payload.lineas.length,2);assert.equal(document.payload.lineas[0].precio,30);assert.equal(document.payload.lineas[1].concepto,'Mano de obra');
 assert.doesNotMatch(JSON.stringify(document),/costeReal|PENDIENTE DE DESGLOSAR/);
 assert.match(root.document.getElementById('pendingIncomeMsg').textContent,/sin subir|sin guardar|No se ha guardado/i);
});
test('R32 backend rechaza total manipulado y acepta el total derivado con IVA y cobro excedente',async()=>{
 const action=sheetBackend();
 const base={id:'IP32',fecha:'2026-11-06',persona:'Cliente',servicio:'Servicio',materialesDetalle:[{nombre:'Artículo',cantidad:2,costeReal:12,precioCliente:30}],manoObra:50,ivaPorcentaje:21,desgloseVersion:2,material:24,importePrevisto:133.1,cobrado:150};
 await assert.rejects(()=>action({accion:'guardarIngresoPendiente',ingreso:JSON.stringify({...base,importePrevisto:100})}),/desglose/);
 const out=await action({accion:'guardarIngresoPendiente',ingreso:JSON.stringify(base)});assert.equal(out.ok,true);
 const saved=(await action({accion:'listarIngresosPendientes'})).ingresos[0];assert.equal(saved.importePrevisto,133.1);assert.equal(saved.cobrado,150);assert.equal(saved.excedente,16.9);
 assert.equal(saved.material,24);assert.equal(saved.ivaPorcentaje,21);
});
test('R32 ingresos anteriores sin materiales siguen disponibles sin desgloses inventados',async()=>{
 const action=sheetBackend();await action({accion:'guardarIngresoPendiente',ingreso:JSON.stringify({id:'LEGACY',fecha:'2026-11-06',persona:'Cliente',servicio:'Antiguo',importePrevisto:150,material:50,cobrado:20})});
 const old=(await action({accion:'listarIngresosPendientes'})).ingresos[0];assert.equal(old.importePrevisto,150);assert.equal(old.material,50);
});
