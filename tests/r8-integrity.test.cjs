'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('www/index.html','utf8');
function setup(){
 const rows=new Map(),account={email:'qa@example.com',id:'BOOK_12345678901234567890123456',token:'TOKEN_FOR_TESTING'},root={};
 root.window=root;root.crypto={randomUUID:()=>Math.random().toString(36).slice(2)};
 function dataRows(name){const key=account.id+':'+name;if(!rows.has(key))rows.set(key,[]);return rows.get(key);}
 root.CFGoogleAccount={active:()=>({...account}),http:async(url,method='GET',body)=>{
  const value=decodeURIComponent(url.split('/values/')[1]?.split('?')[0]||'');
  const hit=value.match(/^'([^']+)'!([A-Z].*)$/);assert.ok(hit,'No Sheets range '+url);
  const row=dataRows(hit[1]);if(method==='GET')return {values:row.map(r=>[...r])};
  if(url.includes(':append')){row.push(...body.values);return {updates:{updatedRows:1}};}
  if(method==='PUT'){const idx=Number(hit[2].match(/^A(\d+)/)[1])-1;row[idx]=[...body.values[0]];return {ok:true};}
  throw new Error('Unexpected '+method+' '+url);
 }};
 vm.runInNewContext(fs.readFileSync('www/cf-google-data.js','utf8'),{window:root,console,URLSearchParams});
 return {action:root.CFGoogleData.action,account,rows,dataRows};
}
test('R8: registrar la misma compra tras reintentar no duplica filas',async()=>{
 const {action,dataRows}=setup();
 const payload={accion:'guardarRegistro',tipo:'Compra',requestId:'R8-UNIQUE-PURCHASE',tercero:'Distribuidor',concepto:'Material genérico',base:100,iva:21,ivaPorcentaje:21,total:121};
 const first=await action(payload),second=await action(payload);
 assert.equal(first.ok,true);assert.equal(second.repetida,true);assert.equal(first.id,second.id);
 const list=await action({accion:'syncRecords'});
 assert.equal(list.compras.filter(r=>r.requestId==='R8-UNIQUE-PURCHASE').length,1);
 assert.equal(dataRows('CF_Registros_v2').filter(r=>r[0]==='CFV76_GOOGLE_2').length,1);
});
test('R8: eliminar por clave estable y eliminar de nuevo devuelve éxito sin afectar otras filas',async()=>{
 const {action,dataRows}=setup();
 for(const id of ['A','B'])await action({accion:'guardarRegistro',tipo:'Compra',requestId:id,tercero:'Dist',concepto:'Artículo '+id,total:121,base:100,iva:21,ivaPorcentaje:21});
 let result=await action({accion:'syncRecords'});const b=result.compras.find(r=>r.requestId==='B');assert.ok(b?._key);
 await action({accion:'eliminar',tipo:'Compra',tab:b._tab,fila:999,key:b._key});
 const repeat=await action({accion:'eliminar',tipo:'Compra',tab:b._tab,fila:999,key:b._key});
 assert.equal(repeat.alreadyDeleted,true);
 result=await action({accion:'syncRecords'});
 assert.equal(result.compras.length,1);assert.equal(result.compras[0].requestId,'A');
 assert.equal(dataRows('Compras').length,0,'No se editan hojas históricas');
});
test('R8: todas las cuentas mantienen los registros separados con el mismo ID de petición',async()=>{
 const {action,account}=setup();
 const p={accion:'guardarRegistro',tipo:'Compra',requestId:'GLOBAL-TEST',tercero:'Distribuidor',concepto:'Objeto',base:1,total:1.21,iva:0.21,ivaPorcentaje:21};
 await action(p);account.id='BOOK_DIFFERENT_123456789012345678901';
 const other=await action(p);assert.ok(other.id);
 assert.equal((await action({accion:'syncRecords'})).compras.length,1);
 account.id='BOOK_12345678901234567890123456';
 assert.equal((await action({accion:'syncRecords'})).compras.length,1);
});
test('R8: Calendar crea avisos antes de eventos y los mensajes de soporte no adjuntan registros',async()=>{
 const requests=[],account={id:'BOOK_FOR_MAIL_12345678901234567890',email:'qa@example.com',token:'TOKEN_VALID'};
 const root={CFGoogleAccount:{active:()=>({...account}),http:async(url,method,data)=>{requests.push({url,method,data});return{id:'MESSAGE_ID'}}},crypto:global.crypto,btoa:s=>Buffer.from(s,'binary').toString('base64')};root.window=root;
 vm.runInNewContext(fs.readFileSync('www/cf-google-extras.js','utf8'),{window:root,console,TextEncoder,Uint8Array,Date,Intl});
 const cal=root.CFGoogleExtras.calendarBody({fecha:'2026-12-11',horaInicio:'18:00',horaFin:'19:00',evento:'Prueba',ubicacion:'Albacete'});
 assert.equal(cal.reminders.useDefault,false);assert.deepEqual(Array.from(cal.reminders.overrides.map(x=>x.minutes)),[60]);
 assert.equal(cal.location,'Albacete');
 const delivered=await root.CFGoogleExtras.sendSupport({recipient:'soporte@example.com',kind:'Error',message:'El botón del menú no funciona.',appVersion:'R8'});
 assert.equal(delivered.id,'MESSAGE_ID');assert.ok(requests[0].url.includes('gmail.googleapis.com'));
 assert.ok(!JSON.stringify(requests).includes('cf_records'));
 await assert.rejects(()=>root.CFGoogleExtras.sendSupport({recipient:'soporte@example.com',kind:'Error',message:'corto'}),/12 a 3000/);
});
test('R8: UI contiene tutorial, avisos, contactos, feedback y no muestra mensajes técnicos de guardado',()=>{
 const check=['cfTutorialOverlay','startCFTutorial','cfSupportModal','cfSuccessFeedback','cfScheduleEventReminders','cfFindInventoryPhotos','cfInventoryTypeButtons','requestId:(cfRecordRequestId','key:removed._key','cfMaybeStartFirstTutorial'];
 for(const text of check)assert.ok(html.includes(text),'Falta '+text);
 assert.doesNotMatch(html,/<p>El registro se ha guardado en Google Sheets<\/p>/);
 assert.ok(html.includes('UI76-20261027-R24'));
});
