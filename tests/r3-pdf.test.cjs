'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('www/cf-invoice-share.js','utf8');
function fake(){
 const instances=[];
 class Pdf{
  constructor(){this.words=[];this.logo=false;instances.push(this)}
  setFillColor(){} rect(){} setTextColor(){} setFontSize(){} setFont(){}
  splitTextToSize(str){return [String(str)]}
  text(t){this.words.push(String(t))}
  addPage(){}getNumberOfPages(){return 1}setPage(){}
  addImage(){this.logo=true}
  output(kind){if(kind==='datauristring')return 'data:application/pdf;base64,JVBERi0xLjQ=';if(kind==='arraybuffer')return new ArrayBuffer(3);throw Error('Unexpected '+kind)}
 }
 const root={CFjsPDF:Pdf,localStorage:{getItem:()=>null},fetch:async()=>({ok:true,arrayBuffer:async()=>new Uint8Array([137,80,78,71]).buffer}),btoa:globalThis.btoa,navigator:{},console};
 root.window=root;vm.runInNewContext(source,{window:root,console,Blob,File:class {},TextEncoder,Uint8Array,ArrayBuffer});
 return {root,instances};
}
const invoice={numero:'CF-000001',fecha:'2026-10-22T10:00:00.000Z',emitida:true,payload:{
 emisor:JSON.stringify({name:'Chispas Sound',taxId:'12345678Z',address:'Calle A 1',postalCode:'16001',city:'Cuenca',province:'Cuenca',email:'emisor@example.com'}),
 cliente:JSON.stringify({nombre:'Empresa de prueba',cif:'B11111111',direccion:'Calle B',cp:'02001',ciudad:'Albacete',provincia:'Albacete'}),
 lineas:JSON.stringify([{concepto:'Servicio de sonido',cantidad:2,precio:150}]),base:300,ivaPorcentaje:21,iva:63,total:363,descuento:0}};
test('R3: PDF definitivo contiene emisor, cliente, líneas, número, IVA y logo',async()=>{
 const {root,instances}=fake();const result=await root.CFInvoiceShare.generate(invoice);
 assert.match(result.filename,/FACTURA_CF-000001\.pdf$/);
 assert.match(result.base64,/^JVBERi0/);
 const text=instances[0].words.join(' | ');
 for(const expected of ['FACTURA','CF-000001','Chispas Sound','Empresa de prueba','Servicio de sonido','IVA (21 %)','TOTAL'])assert.ok(text.includes(expected),'PDF sin '+expected);
 assert.equal(instances[0].logo,true);
});
test('R3: el borrador PDF no lleva etiqueta de factura fiscal emitida',async()=>{
 const {root,instances}=fake();const result=await root.CFInvoiceShare.generate({...invoice,numero:'BOR-2026-TEST',emitida:false});
 assert.match(result.filename,/BORRADOR/);
 assert.ok(instances[0].words.some(x=>x.includes('BORRADOR - NO EMITIDA')));
});
