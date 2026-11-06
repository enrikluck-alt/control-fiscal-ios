'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=file=>fs.readFileSync(file,'utf8');
const backend=()=>{
 const storage=new Map();let acc={id:'SHEET_FOR_A',email:'a@example.com',token:'tokenA'};
 const rows=tab=>{const key=acc.id+':'+tab;if(!storage.has(key))storage.set(key,[]);return storage.get(key);};
 const root={crypto:{randomUUID:()=>Math.random().toString(36).slice(2)},CFGoogleAccount:{active:()=>({...acc}),http:async(url,method='GET',body)=>{
  const decoded=decodeURIComponent(url.split('/values/')[1]?.split('?')[0]||''),m=decoded.match(/^'([^']+)'!/);assert.ok(m);
  if(method==='GET')return {values:rows(m[1]).map(x=>x.slice())};
  if(url.includes(':append')){rows(m[1]).push(...body.values);return {updates:{updatedRows:1}};}
  throw Error('Unexpected HTTP '+method);
 }}};vm.runInNewContext(read('www/cf-google-data.js'),{window:root,URLSearchParams,console});
 return {action:root.CFGoogleData.action,rows,change:id=>acc={...acc,id}};
};
function budgetClient(){const document={querySelector:()=>null,getElementById:()=>null};const root={document,addEventListener:()=>{},getInvoiceConfig:()=>({name:'Empresa',taxId:'1234'})};
 vm.runInNewContext(read('www/cf-r31-budget.js'),{window:root,Intl,Date,Number,console});return root.CFR31Budget;}
test('R31 coste 50, venta 100, mano de obra 50 => total 150 con IVA 21% y sin revelar coste',()=>{
 const b=budgetClient(),lines=[{nombre:'Material X',cantidad:1,costeReal:50,precioCliente:100}];
 const x=b.calc(lines,50,21);assert.equal(x.realCost,50);assert.equal(x.base,150);assert.equal(x.iva,31.5);assert.equal(x.total,181.5);
 const message=b.reminderText({record:{materialesDetalle:lines,manoObra:50},name:'Cliente',reference:'Servicio',amount:150,paid:0,remaining:150});
 assert.match(message,/Material X/);assert.match(message,/100,00/);assert.match(message,/Mano de obra: 50,00/);
 assert.match(message,/Mano de obra: 50,00/);assert.match(message,/Total acordado: 150,00/);assert.doesNotMatch(message,/Coste real|costeReal|Coste interno/);
 const payload=b.invoiceLikePayload({client:{nombre:'Cliente'},issuer:{name:'Emisor'},materials:lines,labor:50,vatPct:21});
 assert.equal(payload.lineas.length,2);assert.equal(payload.total,181.5);assert.doesNotMatch(JSON.stringify(payload),/costeReal|50\s*€.*material/);
});
test('R31 ingresos guardan pago por encima del importe acordado, excedente y deuda 0',async()=>{
 const {action}=backend();await action({accion:'guardarIngresoPendiente',ingreso:JSON.stringify({id:'IP31',fecha:'2026-11-06',persona:'Empresa',servicio:'Servicio',material:50,importePrevisto:150,cobrado:160,estadoCobro:'pagada',materialesDetalle:[{nombre:'Material X',cantidad:1,costeReal:50,precioCliente:100}],manoObra:50})});
 let r=(await action({accion:'listarIngresosPendientes'})).ingresos[0];assert.equal(r.cobrado,160);assert.equal(r.excedente,10);assert.equal(r.beneficio,110);assert.equal(r.estadoCobro,'pagada');
 await action({accion:'editarIngresoIndependiente',id:'IP31',ingreso:JSON.stringify({...r,importePrevisto:150,material:50,cobrado:320})});
 r=(await action({accion:'listarIngresosPendientes'})).ingresos[0];assert.equal(r.cobrado,320);assert.equal(r.excedente,170);
 const state=await action({accion:'cambiarEstadoCobro',clase:'ingreso',clave:'ingreso:IP31',estadoCobro:'pagada',cobradoParcial:320});
 assert.equal(state.pendiente,0);assert.equal(state.excedente,170);assert.equal(state.cobrado,320);
});
test('R31 presupuesto no se guarda hasta pedir guardarPresupuesto; acceso aislado por libro',async()=>{
 const {action,rows,change}=backend();
 const quote={fecha:'2026-11-06',referencia:'Obra de prueba',cliente:{nombre:'Cliente de prueba'},emisor:{name:'Empresa'},materiales:[{nombre:'Artículo',cantidad:2,costeReal:50,precioCliente:100}],manoObra:50,ivaPorcentaje:21};
 assert.equal(rows('CF_Registros_v2').length,0,'Antes de guardar no hay escritura');
 const result=await action({accion:'guardarPresupuesto',presupuesto:JSON.stringify(quote)});
 assert.ok(result.id);assert.equal(result.presupuesto.base,250);assert.equal(result.presupuesto.iva,52.5);assert.equal(result.presupuesto.total,302.5);
 assert.equal(rows('CF_Registros_v2').length,1);
 let list=(await action({accion:'listarPresupuestos'})).presupuestos;assert.equal(list.length,1);assert.equal(list[0].materiales[0].costeReal,50);
 await action({accion:'vincularPDFPresupuesto',id:result.id,url:'https://drive.google.com/file/d/abc123/view'});
 list=(await action({accion:'listarPresupuestos'})).presupuestos;assert.equal(list[0].documentoUrl,'https://drive.google.com/file/d/abc123/view');
 change('SHEET_FOR_B');assert.equal((await action({accion:'listarPresupuestos'})).presupuestos.length,0);
 await assert.rejects(()=>action({accion:'vincularPDFPresupuesto',id:result.id,url:'https://drive.google.com/file/d/abc123/view'}),/no existe/);
});
test('R31 el PDF comercial no se identifica como factura emitida ni revela costes',()=>{
 const shown=[];
 class FakePDF{setDrawColor(){}setLineWidth(){}line(){}rect(){}setFillColor(){}setTextColor(){}setFont(){}setFontSize(){}text(x){shown.push(String(x));}getTextWidth(s){return String(s).length*1.8;}splitTextToSize(s){return [s];}addPage(){} }
 const root={CFjsPDF:FakePDF,console};vm.runInNewContext(read('www/cf-invoice-share.js'),{window:root,Intl,Date,Number});
 root.CFInvoiceShare.pdfDocument({presupuesto:true,numero:'SIN GUARDAR',fecha:'2026-11-06',payload:{emisor:{name:'Empresa'},cliente:{nombre:'Cliente'},lineas:[{concepto:'Artículo',cantidad:1,precio:100},{concepto:'Mano de obra',cantidad:1,precio:50}],base:150,ivaPorcentaje:21,iva:31.5,total:181.5}});
 const content=shown.join(' ');assert.match(content,/PRESUPUESTO/);assert.match(content,/NO ES UNA FACTURA FISCAL/);assert.match(content,/TOTAL PRESUPUESTO/);assert.doesNotMatch(content,/TOTAL FACTURA|Coste real/);
});
test('R31 integración iOS y Android empaqueta el generador y prepara SDK correcto',()=>{
 const html=read('www/index.html'),ios=read('.github/workflows/build-ios.yml'),android=read('.github/workflows/build-android.yml');
 assert.match(html,/cf-r31-budget.js/);assert.match(html,/cf-r31-budget.css/);
 assert.match(ios,/cf-r31-budget.js/);assert.match(ios,/cf-r31-budget.css/);
 assert.match(android,/android-actions\/setup-android@v4/);
 assert.match(read('www/cf-google-data.js'),/guardarPresupuesto/);
 assert.match(read('www/index.html'),/cfR31IncomeMaterials/);
});
