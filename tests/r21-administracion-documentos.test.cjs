'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('www/index.html','utf8');
const features=fs.readFileSync('www/cf-r21-features.js','utf8');
const data=fs.readFileSync('www/cf-google-data.js','utf8');
function sheetHarness(){
 const store=new Map();let account={id:'BOOK_A',email:'a@example.com',token:'TOKEN_A'};
 const tab=n=>{const k=account.id+':'+n;if(!store.has(k))store.set(k,[]);return store.get(k);};
 const root={crypto:{randomUUID:()=>Math.random().toString(36).slice(2)},CFGoogleAccount:{active:()=>({...account}),http:async(url,method='GET',body)=>{
  const range=decodeURIComponent(url.split('/values/')[1]?.split('?')[0]||'');const m=range.match(/^'([^']+)'!/);assert.ok(m,'Range is not valid: '+range);const rows=tab(m[1]);
  if(method==='GET')return{values:rows.map(x=>x.slice())};
  if(url.includes(':append')){rows.push(...body.values);return{updates:{updatedRows:1}};}
  throw Error('Unexpected request '+url);
 }}};root.window=root;
 vm.runInNewContext(data,{window:root,URLSearchParams,console});
 return {action:root.CFGoogleData.action,tab,changeId:id=>account.id=id};
}
test('R21: guardar ingreso pendiente no hace referencia a una variable no definida',()=>{
 const source=html.match(/function recalcPendingIncome\(\)\{[\s\S]*?\n\}/)?.[0];assert.ok(source);
 const els=new Map();
 const ids=['pendingMaterial','pendingCharged','pendingPaymentState','pendingMaterialValue','pendingChargedValue','pendingBenefitValue'];
 for(const id of ids)els.set(id,{value:'',textContent:'',parentElement:{classList:{toggle(){}}}});
 els.get('pendingMaterial').value='60';els.get('pendingCharged').value='500';els.get('pendingPaymentState').value='pendiente';
 const $=id=>els.get(id);
 const euro=x=>String(Number(x));
 const ctx={$,euro};vm.runInNewContext(source+';globalThis.evalCalc=recalcPendingIncome;',ctx);
 let value=ctx.evalCalc();assert.equal(value.charged,500);assert.equal(value.actuallyCollected,0);assert.equal(value.benefit,-60);
 els.get('pendingPaymentState').value='pagada';value=ctx.evalCalc();assert.equal(value.actuallyCollected,500);assert.equal(value.benefit,440);
});
test('R21: proyecto permite múltiples facturas de distintos proveedores en Drive personal',async()=>{
 const {action,tab,changeId}=sheetHarness();
 const add=(proyecto,proveedor,importe)=>action({accion:'guardarFacturaMaterialProyecto',factura:JSON.stringify({proyecto,proveedor,fecha:'2026-10-27',importe,documentoUrl:'https://drive.google.com/file/d/FILE123/view'})});
 const first=await add('Proyecto Sonido','Distribuidor A',120);const second=await add('Proyecto Sonido','Distribuidor B',80);
 assert.ok(first.id&&second.id&&first.id!==second.id);
 const list=await action({accion:'listarFacturasMaterialProyecto'});
 assert.equal(list.facturas.length,2);
 assert.deepEqual(Array.from(list.facturas.map(x=>x.proveedor)).sort(),['Distribuidor A','Distribuidor B']);
 assert.equal(tab('CF_Registros_v2').length,2);
 changeId('BOOK_B');assert.equal((await action({accion:'listarFacturasMaterialProyecto'})).facturas.length,0,'los archivos no pasan a otra cuenta');
});
test('R21: no acepta apuntes falsos de material sin factura privada Drive',async()=>{
 const {action}=sheetHarness();
 await assert.rejects(()=>action({accion:'guardarFacturaMaterialProyecto',factura:JSON.stringify({proyecto:'X',proveedor:'Y',fecha:'2026-10-27',importe:100,documentoUrl:'https://hostile.example.com/doc'})}),/Drive/);
});
test('R21: administrador utiliza token Firebase y nunca la clave del libro Sheets para Firestore',()=>{
 assert.match(features,/CFFirebaseAuth\.ensureSignedIn\(\)/);
 assert.match(features,/Authorization:'Bearer '\+auth\.idToken/);
 assert.match(features,/Firestore HTTP/);
 assert.match(features,/allow/); // script text of permissions, not an embedded owner UID
 assert.doesNotMatch(features,/REEMPLAZAR_UID_ADMIN/);
 assert.doesNotMatch(features,/firebase.*admin\.sdk|serviceAccountKey|private_key/i);
});
test('R21: selección granular, consentimiento, spotlight y acceso interno',()=>{
 for(const id of ['cfR21AdminPage','cfR21AdminEntry','cfR21ExportItems','cfR21DocTypes','cfR21MaterialPage','cfTourSpotlight','pendingInvoiceFile','pendingProject'])assert.ok(html.includes(id),'Falta '+id);
 for(const token of ['compras','emitidas','independientes','material'])assert.match(html,new RegExp('value="'+token+'"'));
 assert.match(html,/CFR21Export\.send\(\)/);
 assert.match(html,/cfSettingsShow\(index\)/);
 assert.match(features,/isAdmin|permiso de administrador/);
 assert.match(features,/box-shadow|spotlight/);
});
