'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('www/index.html','utf8');
const auth=fs.readFileSync('www/cf-google-auth.js','utf8');
const entry=fs.readFileSync('google-login-entry.js','utf8');
const work=fs.readFileSync('.github/workflows/build-ios.yml','utf8');
const shareSource=fs.readFileSync('www/cf-invoice-share.js','utf8');
test('ambas rutas de facturación abren el mismo módulo V76',()=>{
 const home=html.match(/<section id="home"[\s\S]*?<\/section>/)[0];
 assert.match(home, /class="home p" onclick="openFacturacionPage\(\)"/);
 assert.match(html, /id="ns" onclick="openFacturacionPage\(\)"/);
 assert.match(html, /function openFacturacionPage\(\)\s*\{[\s\S]*?openForm\("Facturado"\)/);
 assert.match(html, /onclick="openInvoiceForm\(\)"/);
 assert.match(html, /onclick="openPendingIncomeForm\(\)"/);
});
test('Ajustes sin enlace de edición directa a Sheets y con hora sin columna comprimida',()=>{
 assert.ok(!html.includes('accountSpreadsheetLink'));
 assert.match(html, /class="settingsRow notificationSettingsRow"/);
 assert.match(html,/\.notificationSettingsRow\{display:grid;grid-template-columns:minmax\(0,1fr\)/);
});
test('Google: crear cuenta, elegir cuenta, correo opcional y recordar sesión',()=>{
 for(const id of ['accountModeCreate','accountModeLogin','accountGoogleBtn','accountEmailHint','accountKeepSession','accountSignupBtn'])
   assert.ok(html.includes(`id="${id}"`),'Falta '+id);
 assert.match(auth,/https:\/\/accounts\.google\.com\/signup/);
 assert.match(auth,/CFBrowser\.open/);
 assert.match(auth,/PERSIST='cf_google_keep_session_v76'/);
 assert.match(auth,/plugin\.refresh\(\{provider:'google'\}\)/);
 assert.doesNotMatch(auth,/hint&&email!==hint/);
 assert.match(auth,/element\('accountEmailHint'\)\)element\('accountEmailHint'\)\.value=email/);
 assert.match(auth,/element\('accountKeepSession'\)\?\.checked/);
});
test('Face ID vuelve a bloquearse al salir de la aplicación y es requerido al regresar',()=>{
 assert.match(html, /function cfHandleAppState\(isActive\)/);
 assert.match(html, /if\(!isActive\)\{[\s\S]*?lockSecurity\(\)/);
 assert.match(html,/cfResumeSecurityPending&&!cfResumeSecurityRunning/);
 assert.match(html,/CFApp\.addListener\('appStateChange'/);
 assert.match(html,/await unlockWithBiometric\(\)/);
 assert.match(entry,/BiometricAuth.*@aparajita\/capacitor-biometric-auth/);
});
test('PDF compartible: solo borrador guardado en libro/cuenta actual, no factura emitida',()=>{
 assert.match(html,/lastSavedInvoiceForShare=\{/);
 assert.match(html,/s\.id!==lastSavedInvoiceForShare\.book/);
 assert.match(html,/shareSavedInvoiceDraft/);
 assert.match(shareSource,/BORRADOR - NO EMITIDA/);
 assert.match(shareSource,/CFShare\.share/);
 assert.match(shareSource,/CFFilesystem\.writeFile/);
 assert.match(entry,/import \{ jsPDF \} from 'jspdf'/);
});
test('el PDF se comparte con bytes y el destinatario se elige manualmente',async()=>{
 let calls=[],writes=[],deleted=[];
 class PDF{
  constructor(){this.pages=1;}
  setFillColor(){}rect(){}setTextColor(){}setFontSize(){}setFont(){}
  text(t){calls.push(String(t));} splitTextToSize(t){return [t];}
  addPage(){this.pages++;} getNumberOfPages(){return this.pages;}setPage(){}
  output(mode){return mode==='datauristring'?'data:application/pdf;base64,JVBERi0xLjQ=':new ArrayBuffer(8);}
 }
 const context={
  CFjsPDF:PDF,
  CFFilesystem:{writeFile:async args=>{writes.push(args)},getUri:async()=>({uri:'file:///cache/draft.pdf'}),deleteFile:async args=>{deleted.push(args)}},
  CFDirectory:{Cache:'CACHE'},
  CFShare:{share:async args=>{calls.push(args)}},
 };
 context.window=context;
 vm.runInNewContext(shareSource,{window:context,Intl,Date,Number,String,Blob,File:class{},setTimeout});
 const saved={numero:'BOR-12345',payload:{
  cliente:JSON.stringify({nombre:'Cliente Ejemplo',cif:'B001'}),
  emisor:JSON.stringify({name:'Emisor',taxId:'B002'}),
  lineas:JSON.stringify([{concepto:'Servicio',cantidad:2,precio:100}]),base:200,iva:42,total:242,ivaPorcentaje:21}};
 const result=await context.CFInvoiceShare.share(saved);
 assert.equal(writes.length,1);
 assert.equal(writes[0].data,'JVBERi0xLjQ=');
 assert.equal(writes[0].directory,'CACHE');
 assert.equal(deleted.length,1);
 assert.ok(calls.some(x=>x.files?.[0]==='file:///cache/draft.pdf'));
 assert.ok(calls.some(x=>String(x).includes('BORRADOR - NO EMITIDA')));
 assert.ok(result.filename.endsWith('.pdf'));
});
test('workflow empaqueta el PDF, protege la UI V76 y genera IPA distinguible',()=>{
 assert.match(work,/cf-invoice-share\.js/);
 assert.match(work,/UI76-20261022-R6/);
 assert.match(work,/ControlFiscal-V76-Google-Diseno-Cuenta-R6-IPA/);
});

test('sesión recordada restaura Google solo con checkbox marcado; reentrada abre Face ID',async()=>{
 const nodes=new Map();
 const node=id=>{if(!nodes.has(id)){
  const names=new Set();nodes.set(id,{hidden:false,disabled:false,value:'',textContent:'',checked:id==='accountKeepSession',
   classList:{add:x=>names.add(x),remove:x=>names.delete(x),toggle:(x,on)=>on?names.add(x):names.delete(x),contains:x=>names.has(x)},
   setAttribute:(k)=>{if(k==='hidden')nodes.get(id).hidden=true;}});
 }return nodes.get(id);};
 let attempts=0,biometrics=0;
 const id='TEST_GOOGLE_SHEET_ABCDEFGHIJKL_123456789';
 const storage=new Map([['cf_google_keep_session_v76','1'],['cf_google_book_keep@example.com',id]]);
 const root={
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},
  ControlFiscalSocialLogin:{initialize:async()=>{},refresh:async()=>{attempts++;return {result:{accessToken:'GOOGLE_TOKEN_123456789_ABCDEFGHIJKLMNOPQRSTUVWXYZ'}};}},
  fetch:async url=>{
   let data;
   if(url.includes('userinfo'))data={email:'keep@example.com',email_verified:true};
   else if(url.includes('drive/v3/files/'))data={id,ownedByMe:true,trashed:false};
   else if(url.includes('fields=spreadsheetId,sheets'))data={spreadsheetId:id,sheets:['Configuracion','Compras','Facturas','Inventario','Clientes','Agenda','Ingresos','CF_Registros_v2'].map(title=>({properties:{title}}))};
   else data={spreadsheetId:id};
   return {ok:true,status:200,text:async()=>JSON.stringify(data)};
  },
  clearUserLocalCaches:()=>{},goHome:()=>{},updateAccountSettings:()=>{},
  startLocalSecurityForAccount:async()=>{biometrics++;},lockSecurity:()=>{},
 };
 root.window=root;
 vm.runInNewContext(auth,{window:root,document:{getElementById:node},navigator:{},URLSearchParams,console,setTimeout:fn=>fn()});
 await root.CFGoogleAccount.start();
 assert.equal(attempts,1);
 assert.equal(biometrics,1);
 assert.equal(root.CFGoogleAccount.active().email,'keep@example.com');
 assert.ok(node('accountGate').classList.contains('hidden'));
});
