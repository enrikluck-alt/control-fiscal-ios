const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const id='1XI0vJjHtDXBpiah_Xss24_rOcuInUFeNIf0n6NYPJwQ';
const calls=[];
const window={CapacitorHttpNative:{request:async req=>{
 calls.push(req);
 if(req.url.startsWith('https://www.googleapis.com/drive/v3/files/'))return {status:200,data:{id,name:'Control Fiscal - Datos fiscales',mimeType:'application/vnd.google-apps.spreadsheet'}};
 if(req.url.startsWith('https://sheets.googleapis.com/v4/spreadsheets/')){
 if(req.method==='POST')return {status:200,data:{replies:[]}};
 return {status:200,data:{spreadsheetId:id,sheets:[{properties:{sheetId:0,title:'Hoja 1'}}]}};
 }
 return {status:404,data:{error:{message:'wrong endpoint'}}};
}}};
vm.runInNewContext(fs.readFileSync('www/drive-v78.js','utf8'),{window});
(async()=>{
 const api=window.ControlFiscalDriveV78;
 const result=await api.inspect('valid-token-12345678901234567890',id);
 assert.equal(result.id,id);
 assert.ok(calls.some(c=>c.url.startsWith('https://sheets.googleapis.com/v4/spreadsheets/')));
 assert.ok(calls.some(c=>c.url.startsWith('https://www.googleapis.com/drive/v3/files/')));
 assert.ok(!calls.some(c=>c.url.includes('www.googleapis.com/sheets/v4')));
 console.log('OK: endpoints Drive y Sheets correctos; inspect no crea documentos');
})().catch(e=>{console.error(e);process.exitCode=1});
