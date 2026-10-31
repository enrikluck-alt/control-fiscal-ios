const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');
const imp=()=>import('../admin/importar-compras-core.mjs');
test('CSV español de Excel: columnas, separador punto y coma y comas decimales',async()=>{
 const {parseCsv,euroAmount}=await imp();const rows=parseCsv('\ufefffecha;proveedor;concepto;total;iva;archivo\r\n27/10/2026;Empresa de prueba;"Producto; instalación";1.234,56;21;factura_1.pdf\r\n2026-10-28;Otra Empresa;Transporte;45,50;10;');
 assert.equal(rows.length,2);assert.equal(rows[0].fecha,'2026-10-27');assert.equal(rows[0].concepto,'Producto; instalación');assert.equal(euroAmount(rows[0].total),1234.56);assert.equal(rows[1].fecha,'2026-10-28');
});
test('CSV: no se admiten comillas abiertas ni importaciones sin fechas ni totales',async()=>{
 const {parseCsv}=await imp();assert.throws(()=>parseCsv('fecha;concepto\n"mal'),/comillas/);assert.throws(()=>parseCsv('proveedor;concepto\na;b'),/columna/);
});
test('Fecha real, conversiones decimales e IVA comprobado',async()=>{
 const {normalizeDate,euroAmount,taxParts}=await imp();
 assert.equal(normalizeDate('31/02/2026'),'');assert.equal(normalizeDate('29/02/2024'),'2024-02-29');
 assert.equal(normalizeDate('2026-02-29'),'');assert.equal(euroAmount('1.234,56 €'),1234.56);assert.equal(euroAmount('1,234.56'),1234.56);
 assert.deepEqual(taxParts('121,00','21'),{total:121,base:100,iva:21,ivaPorcentaje:21});
 assert.throws(()=>taxParts('','21'),/importe/);assert.throws(()=>taxParts('10','130'),/IVA/);
});
test('No se aceptan archivos no admitidos o demasiado grandes',async()=>{
 const {sniffFile}=await imp();assert.equal(sniffFile({name:'factura.pdf',size:1024,type:'application/pdf'}),'application/pdf');
 assert.throws(()=>sniffFile({name:'factura.pdf',size:6*1024*1024,type:'application/pdf'}),/5 MB/);
 assert.equal(sniffFile({name:'malware.exe',size:100,type:'application/octet-stream'}),null);
});
test('Filas de importador R28 son compatibles con CF_Registros_v2 del iPhone',async()=>{
 const {MARK,LEDGER,ledgerRecord,ledgerRow,existingPurchases}=await imp();
 const script=fs.readFileSync(path.join(root,'www/cf-google-data.js'),'utf8');
 assert(script.includes("const MARK='CFV76_GOOGLE_2'"));assert(script.includes("LEDGER='CF_Registros_v2'"));
 assert.equal(MARK,'CFV76_GOOGLE_2');assert.equal(LEDGER,'CF_Registros_v2');
 const r=ledgerRecord({requestId:'IMPORT-PC-ejemplo',fecha:'2026-10-27',tercero:'Empresa',concepto:'Material',total:'121,00',ivaPorcentaje:'21',facturaUrl:'https://drive.google.com/file/d/ABCDEABCDEABCDE/view',importacionPcHash:'aabb'},()=> 'uuid123');
 const row=ledgerRow(r,'2026-10-27T12:00:00.000Z');const e=JSON.parse(row[2]);
 assert.equal(e.tab,'Compras');assert.equal(e.key,row[1]);assert.equal(e.deleted,false);
 assert.equal(e.data.tipo,'Compra');assert.equal(e.data.total,121);assert.equal(e.data.base,100);assert.equal(e.data.iva,21);assert.equal(e.data.facturaUrl,'https://drive.google.com/file/d/ABCDEABCDEABCDE/view');
 assert(existingPurchases([row]).requests.has('IMPORT-PC-ejemplo'));
 assert(existingPurchases([row]).hashes.has('aabb'));
});
test('Interfaz de navegador: subida directa a Drive y registro append-only en Sheets, sin Firestore',()=>{
 const html=fs.readFileSync(path.join(root,'admin/importar-compras.html'),'utf8');
 const js=fs.readFileSync(path.join(root,'admin/importar-compras.js'),'utf8');
 const conf=JSON.parse(fs.readFileSync(path.join(root,'firebase.json'),'utf8'));
 assert.equal(conf.hosting.public,'admin');assert(html.includes('importar-compras.js'));assert(html.includes('multiple'));assert(html.includes('CSV'));
 assert(js.includes("signInWithPopup(auth,provider)"));assert(js.includes("provider.addScope('https://www.googleapis.com/auth/spreadsheets')"));
 assert(js.includes('uploadType=multipart'));assert(js.includes('valueInputOption=RAW&insertDataOption=INSERT_ROWS'));
 assert(!/firestore\.googleapis\.com|addDoc\(/.test(js));
});
