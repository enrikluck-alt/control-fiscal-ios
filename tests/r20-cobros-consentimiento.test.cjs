'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const rootDir=process.cwd();
const src=file=>fs.readFileSync(file,'utf8');
const html=src('www/index.html'),rules=src('firestore.rules');
const futureJwt=()=>`eyJhbGciOiJub25lIn0.${Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.sig`;
function feedbackHarness(){
 const requests=[];
 const root={CFFirebaseConfig:{apiKey:'test_123456789012345',projectId:'control-fiscal-511118'},crypto:{getRandomValues:bytes=>bytes.fill(41)},Capacitor:{getPlatform:()=> 'ios'},
  CFGoogleAccount:{active:()=>({id:'owner-book',email:'user@example.com'}),getSupportIdToken:async()=>futureJwt()},
  fetch:async (url,options)=>{
   requests.push({url,options});
   if(url.includes('signInWithIdp'))return {ok:true,json:async()=>({email:'user@example.com',localId:'uid123',idToken:'firebase-token',expiresIn:'3600',displayName:'Nombre Cuenta'})};
   return {ok:true,json:async()=>({writeResults:[{}]})};
  }
 };
 const ctx={window:root,atob:x=>Buffer.from(x,'base64url').toString(),URLSearchParams,AbortController,Uint8Array,setTimeout,clearTimeout};
 vm.runInNewContext(src('www/cf-firebase-auth.js'),ctx);
 vm.runInNewContext(src('www/cf-feedback.js'),ctx);
 return {root,requests};
}
test('R20 sugerencia sin permiso no adjunta dirección del usuario ni datos fiscales',async()=>{
 const {root,requests}=feedbackHarness();
 await root.CFFeedback.send({kind:'Sugerencia',message:'Por favor mejora la vista de resumen.',allowReply:false,appVersion:'R20'});
 const doc=JSON.parse(requests[1].options.body).writes[0].update.fields;
 assert.equal(doc.permiteRespuesta.booleanValue,false);
 assert.equal(doc.nombre.stringValue,'Nombre Cuenta');
 assert.ok(!('correoRespuesta' in doc));
 assert.equal(doc.uid.stringValue,'uid123');
 assert.doesNotMatch(JSON.stringify(doc),/gmail.send|inventario|facturas|accessToken/i);
});
test('R20 usuario acepta respuestas y solo entonces se guarda el correo verificado',async()=>{
 const {root,requests}=feedbackHarness();
 await root.CFFeedback.send({kind:'Consulta',message:'Quiero consultar cómo funciona el registro de eventos.',allowReply:true});
 const doc=JSON.parse(requests[1].options.body).writes[0].update.fields;
 assert.equal(doc.permiteRespuesta.booleanValue,true);
 assert.equal(doc.correoRespuesta.stringValue,'user@example.com');
 assert.equal(doc.tipo.stringValue,'Consulta');
});
test('R20 reglas solo permiten ver o cambiar estado al UID de administrador y mantienen legado',()=>{
 assert.match(rules,/request\.auth\.uid == 'REEMPLAZAR_UID_ADMIN'/);
 assert.match(rules,/allow get, list: if isAdmin\(\)/);
 assert.match(rules,/allow update: if isAdmin\(\)/);
 assert.match(rules,/affectedKeys\(\)\.hasOnly\(\['estado','revisadoEn'\]\)/);
 assert.match(rules,/Compatibilidad R19/);
 assert.match(rules,/request\.auth\.token\.email_verified == true/);
 assert.match(rules,/request\.resource\.data\.correoRespuesta == request\.auth\.token\.email/);
 assert.match(rules,/match \/\{document=\*\*\} \{allow read, write: if false;/);
 assert.doesNotMatch(rules,/allow read: if true/);
});
function googleHarness(){
 const store=new Map();let acc={id:'BOOK_12345678901234567890123',email:'a@example.com',token:'ACCESSTOKEN'};
 function tab(name){const key=acc.id+':'+name;if(!store.has(key))store.set(key,[]);return store.get(key);}
 const root={crypto:{randomUUID:()=> 'uuid-test'},CFGoogleAccount:{active:()=>({...acc}),http:async (url,method='GET',body)=>{
  const range=decodeURIComponent(url.split('/values/')[1]?.split('?')[0]||'');
  const match=range.match(/^'([^']+)'!([A-Z].*)/);
  assert.ok(match,'Unexpected range '+url);
  const rows=tab(match[1]);
  if(method==='GET')return {values:rows.map(r=>r.slice())};
  if(url.includes(':append')){rows.push(...body.values);return {updates:{updatedRange:"'"+match[1]+"'!A"+rows.length+':C'+rows.length}};}
  throw Error('Unexpected HTTP operation '+method+' '+url);
 }}};
 root.window=root;
 vm.runInNewContext(src('www/cf-google-data.js'),{window:root,URLSearchParams,console});
 return {action:root.CFGoogleData.action,tab,setBook:id=>{acc={...acc,id}},store};
}
test('R20 factura sencilla mantiene su registro fiscal y estado de cobro auditable por separado',async()=>{
 const {action,tab}=googleHarness();
 await action({accion:'guardarRegistro',tipo:'Facturado',requestId:'FAC-TEST-2001',tercero:'Cliente Uno',concepto:'Servicio',base:100,iva:21,total:121,estadoCobro:'pendiente'});
 let data=await action({accion:'syncRecords'});
 assert.equal(data.facturacion.length,1);assert.equal(data.facturacion[0].estadoCobro,'pendiente');
 await action({accion:'cambiarEstadoCobro',clase:'factura',clave:'factura:FAC-TEST-2001',estadoCobro:'pagada',correo:'cliente@example.com',telefono:'+34600123456'});
 data=await action({accion:'syncRecords'});
 assert.equal(data.facturacion[0].estadoCobro,'pagada');
 assert.equal(data.facturacion[0].correoCobro,'cliente@example.com');
 assert.equal(tab('CF_EstadosCobro').length,1);
 assert.equal(tab('CF_Registros_v2').length,1,'cambiar un cobro no reescribe la factura');
});
test('R20 ingreso independiente solo contabiliza cobrado al pasar a pagado',async()=>{
 const {action}=googleHarness();
 await action({accion:'guardarIngresoPendiente',ingreso:JSON.stringify({id:'IP-123',persona:'Cliente Dos',servicio:'Sonido',importePrevisto:500,material:100,cobrado:0,estadoCobro:'pendiente'})});
 let r=(await action({accion:'listarIngresosPendientes'})).ingresos[0];
 assert.equal(r.importePrevisto,500);assert.equal(r.cobrado,0);assert.equal(r.beneficio,-100);assert.equal(r.estadoCobro,'pendiente');
 await action({accion:'cambiarEstadoCobro',clase:'ingreso',clave:'ingreso:IP-123',estadoCobro:'pagada',correo:'',telefono:''});
 r=(await action({accion:'listarIngresosPendientes'})).ingresos[0];
 assert.equal(r.cobrado,500);assert.equal(r.beneficio,400);assert.equal(r.estadoCobro,'pagada');
 await action({accion:'cambiarEstadoCobro',clase:'ingreso',clave:'ingreso:IP-123',estadoCobro:'pendiente',correo:'',telefono:''});
 r=(await action({accion:'listarIngresosPendientes'})).ingresos[0];
 assert.equal(r.cobrado,0);assert.equal(r.estadoCobro,'pendiente');
});
test('R20 estado y contacto no se trasladan al libro de otra cuenta',async()=>{
 const {action,setBook}=googleHarness();
 await action({accion:'guardarRegistro',tipo:'Facturado',requestId:'FAC-A',tercero:'Cliente A',concepto:'Audio',total:99});
 setBook('BOOK_OTRO_12345678901234567890123');
 await assert.rejects(()=>action({accion:'cambiarEstadoCobro',clase:'factura',clave:'factura:FAC-A',estadoCobro:'pagada'}),/no existe en tu cuenta/);
 const records=await action({accion:'syncRecords'});
 assert.equal(records.facturacion.length,0);
});
test('R20 IU incluye autorización de respuesta, etiqueta naranja, recordatorios con revisión, tutorial',()=>{
 const paymentJS=src('www/cf-r20-payments.js');
 for(const token of ['cfSupportReplyConsent','cfR20PaymentModal','cfR20ManagePayment','cfR20Bubble','cfR20PaymentEmail','pendingPaymentState','cfR20PaymentSaveBtn','Facturación · cobros pendientes','Ajustes · sugerencias y consentimiento'])assert.ok(html.includes(token),token);
 for(const token of ['https://wa.me/','mailto:', 'confirm(', 'AppLauncher','cambiarEstadoCobro'])assert.ok(paymentJS.includes(token),token);
 assert.ok(!paymentJS.includes('gmail.send'));
 assert.match(src('www/cf-google-auth.js'),/'CF_EstadosCobro'/);
 assert.match(src('admin/app.js'),/signInWithPopup/);
 assert.match(src('admin/app.js'),/No autorizado para respuestas por email/);
});

test('R20 Gmail API solo envía recordatorio explícito a dirección válida y confirma ID',async()=>{
 const calls=[];
 const root={CFGoogleAccount:{active:()=>({id:'BOOK123456789012345678901',email:'sender@example.com',token:'GOOGLETOKEN'}),http:async (url,method,data)=>{calls.push({url,method,data});return {id:'mail-123'};}},btoa:text=>Buffer.from(text,'binary').toString('base64')};root.window=root;
 vm.runInNewContext(src('www/cf-google-extras.js'),{window:root,TextEncoder,Uint8Array,Date,Intl,URLSearchParams,console});
 await assert.rejects(()=>root.CFGoogleExtras.sendPaymentReminder({recipient:'not-an-email',customer:'A',amount:20,reference:'F-101'}),/Correo destinatario/);
 assert.equal(calls.length,0);
 const result=await root.CFGoogleExtras.sendPaymentReminder({recipient:'buyer@example.com',customer:'Comprador',amount:121,reference:'Factura-120'});
 assert.equal(result.id,'mail-123');
 assert.equal(calls.length,1);
 assert.match(calls[0].url,/gmail\.googleapis\.com\/gmail\/v1\/users\/me\/messages\/send/);
 assert.ok(calls[0].data.raw);
 assert.ok(!JSON.stringify(calls[0].data).includes('facturaUrl'));
});
