'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function env(){
 const all=new Map(),account={id:'BOOK_R10_PERSONAL_12345678901234567890',email:'a@example.com',token:'TOK_R10'};
 const rows=name=>{const key=account.id+':'+name;if(!all.has(key))all.set(key,[]);return all.get(key)};
 const root={window:null,crypto:{randomUUID:()=>Math.random().toString(36).slice(2)},CFGoogleAccount:{active:()=>({...account}),http:async(url,method='GET',body)=>{
  const hit=decodeURIComponent(url.split('/values/')[1]?.split('?')[0]||'').match(/^'([^']+)'!(.+)$/);
  assert.ok(hit,'Valor Sheets desconocido '+url);const a=rows(hit[1]);
  if(method==='GET')return {values:a.map(r=>[...r])};
  if(url.includes(':append')){a.push(...body.values);return {updates:{updatedRange:`'${hit[1]}'!A${a.length}:C${a.length}`}};}
  if(method==='PUT'){const idx=Number(hit[2].match(/^A(\d+)/)?.[1])-1;a[idx]=[...body.values[0]];return{ok:true}};
  throw Error('Petición Sheets inesperada '+url);
 }}};
 root.window=root;
 vm.runInNewContext(fs.readFileSync('www/cf-google-data.js','utf8'),{window:root,console,URLSearchParams});
 return {api:root.CFGoogleData,rows,account};
}
test('R10: carpetas y subcarpetas, archivos PDF, borrado reversible de metadatos sin borrar Drive',async()=>{
 const {api,rows}=env();
 await api.action({accion:'guardarDocumento',documento:{id:'folder-root',tipo:'carpeta',nombre:'Certificados',parentId:null}});
 await api.action({accion:'guardarDocumento',documento:{id:'folder-child',tipo:'carpeta',nombre:'Certificados de altavoces',parentId:'folder-root'}});
 await api.action({accion:'guardarDocumento',documento:{id:'file-1',tipo:'archivo',nombre:'Certificado.pdf',mime:'application/pdf',parentId:'folder-child',url:'https://drive.google.com/file/d/ABCDEFGHIJKLMN1234567890/view'}});
 let result=await api.action({accion:'listarDocumentos'});
 assert.equal(result.documentos.length,3);
 assert.equal(result.documentos.find(x=>x.id==='file-1').parentId,'folder-child');
 await assert.rejects(()=>api.action({accion:'eliminarDocumento',id:'folder-child'}),/contiene/);
 await api.action({accion:'eliminarDocumento',id:'file-1'});
 assert.equal((await api.action({accion:'listarDocumentos'})).documentos.length,2);
 assert.equal(rows('CF_Registros_v2').some(x=>x[0]==='CFV76_GOOGLE_2'),true);
 await api.action({accion:'eliminarDocumento',id:'folder-child'});
 assert.equal((await api.action({accion:'listarDocumentos'})).documentos.length,1);
});
test('R10: no permite añadir archivo sin PDF de Drive ni referencias a carpetas inexistentes',async()=>{
 const {api}=env();
 await assert.rejects(()=>api.action({accion:'guardarDocumento',documento:{id:'BAD',tipo:'archivo',nombre:'test.pdf',url:'https://evil.com/test.pdf'}}),/Adjunta/);
 await assert.rejects(()=>api.action({accion:'guardarDocumento',documento:{id:'BAD2',tipo:'carpeta',nombre:'Subcarpeta',parentId:'NOEXISTE'}}),/no existe/);
});
test('R10: archivos y carpetas están separados entre dos cuentas',async()=>{
 const {api,account}=env();
 await api.action({accion:'guardarDocumento',documento:{id:'folder-a',tipo:'carpeta',nombre:'Cuenta A'}});
 account.id='BOOK_R10_OTHER_12345678901234567890';account.email='b@example.com';
 assert.equal((await api.action({accion:'listarDocumentos'})).documentos.length,0);
});
test('R10: factura emitida se archiva/restaura sin tocar registros fiscales ni la suma de facturación',async()=>{
 const {api,rows}=env();
 rows('CF_Facturas_Emitidas').push(['CF_FACTURA_EMITIDA_1','R10-ISS-123456789',JSON.stringify({fecha:'2026-10-23',tercero:'Cliente de prueba',concepto:'Producto',base:100,iva:21,total:121,tipo:'Facturación',requestId:'R10-ISS-123456789'})]);
 const original=JSON.stringify(rows('CF_Facturas_Emitidas'));
 let list=await api.action({accion:'syncRecords'});assert.equal(list.facturacion.length,1);assert.equal(list.facturacion[0].archivada,false);
 const archive=await api.action({accion:'ocultarFacturaEmitida',requestId:'R10-ISS-123456789'});assert.equal(archive.archivada,true);
 list=await api.action({accion:'syncRecords'});assert.equal(list.facturacion.length,1);assert.equal(list.facturacion[0].archivada,true);assert.equal(list.facturacion[0].total,121);
 assert.equal(JSON.stringify(rows('CF_Facturas_Emitidas')),original,'Las facturas emitidas no se borran del libro');
 assert.equal((await api.action({accion:'ocultarFacturaEmitida',requestId:'R10-ISS-123456789'})).repetido,true);
 await api.action({accion:'restaurarFacturaEmitida',requestId:'R10-ISS-123456789'});
 list=await api.action({accion:'syncRecords'});assert.equal(list.facturacion[0].archivada,false);
});
test('R10: interfaz carga Documentos, Ajustes independientes, fotos abiertas y resguardo del tutorial',()=>{
 const h=fs.readFileSync('www/index.html','utf8'),wf=fs.readFileSync('.github/workflows/build-ios.yml','utf8');
 for(const val of ['id="documentsPage"','cfSettingsNavigator','cfSettingsShow','cfArchiveInvoiceBtn','cfShowArchivedIssued','cfInventoryCustomImageUrl','cfUseCustomImageUrl','cfFindInventoryPhotos','CFDocuments.open()','UI76-20261027-R22'])assert.ok(h.includes(val),val);
 assert.match(wf,/cf-documents\.js/);
 assert.match(wf,/ControlFiscal-V76-Google-R22-Cobros-Agenda-Contactos-IPA/);
 assert.doesNotMatch(h,/cf-google-test-gate|Google Sheets personal/);
});
