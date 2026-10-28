'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const h=fs.readFileSync('www/index.html','utf8'), d=fs.readFileSync('www/cf-google-data.js','utf8'),p=fs.readFileSync('www/cf-invoice-share.js','utf8');
test('R25: Compras y Facturación ofrecen acceso visible a listados completos',()=>{
  assert.match(h,/openRecordsFiltered\('\$\{c\?"Compra":"facturas"\}'\)/);
  assert.match(h,/openRecordsFiltered\('facturas'\)/);
  assert.match(h,/recordFilter==="facturas"\s*\?\s*r\.tipo==="Compra"/);
  assert.match(h,/openPendingIncomeListAll\(\)/);
});
test('R25: editar compras y facturas permite adjuntar documentos, sin reescribir facturas emitidas',()=>{
  for(const item of ['cfR25RecordFile','cfR25ViewAttachment','cfR25IssuedAttachmentBtn','cfR25UploadRecordFile','registrarDocumentoFactura'])assert.ok(h.includes(item),item);
  assert.match(h,/if\(editingRecord\.emitida\)throw Error/);
  assert.match(d,/if\(p\.facturaUrl&&!/);
  assert.match(d,/case 'registrarDocumentoFactura'/);
});
test('R25: Resumen separa ingresos independientes y material sin mezclar IVA',()=>{
  for(const id of ['cfR25IndependentCollected','cfR25IndependentExpenses','cfR25IndependentDue'])assert.match(h,new RegExp(id));
  assert.match(h,/vals\[n\]\.otherExpense\+=Number\(r\.material\)/);
  assert.match(h,/vals\[n\]\.otherCollected\+=Number\(r\.cobrado\)/);
});
test('R25: PDF usa identidad fiscal y plantilla A4 del documento aportado',()=>{
  for(const t of ['EMISOR','Cliente','Producto','cantidad','TOTAL FACTURA','TOTAL A PAGAR','Presupuesto / referencia:'])assert.ok(p.includes(t),t);
  assert.match(h,/id="invReference"/);
  assert.match(d,/referencia:String\(p\.referencia/);
  assert.match(p,/loadInvoiceLogo\(\)/);
});
test('R25: selector iOS muestra mensajes de error y puede usar selector telefónico',()=>{
  const src=fs.readFileSync('www/cf-r22-features.js','utf8'),native=fs.readFileSync('contacts-entry.js','utf8');
  assert.match(src,/Abriendo los contactos del teléfono/);
  assert.match(src,/No se pudo abrir Contactos/);
  assert.match(native,/ContactProperty\.PhoneNumber/);
  assert.match(native,/displayName/);
});
test('R25: carga de adjuntos privados comprueba sesión, tipo y tamaño de archivo',async()=>{
  const source=fs.readFileSync('www/cf-r25-features.js','utf8');
  const session={id:'BOOK',email:'user@example.com',token:'TOKEN'};
  const root={document:{getElementById:()=>null},CFGoogleAccount:{active:()=>session},
    CFR21Files:{fileToBase64:async()=> 'QUJD'},
    CFGoogleUploads:{upload:async()=> 'https://drive.google.com/file/d/ABCDEFGHIJKLMNO123456789/view'},
    console};
  vm.runInNewContext(source,{window:root,console,Error});
  assert.equal(await root.cfR25UploadRecordFile({name:'factura.pdf',type:'application/pdf',size:300}),'https://drive.google.com/file/d/ABCDEFGHIJKLMNO123456789/view');
  await assert.rejects(root.cfR25UploadRecordFile({name:'malware.exe',type:'application/octet-stream',size:10}),/PDF, JPG o PNG/);
});
