'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const project=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(project,'www/index.html'),'utf8');
const workflow=fs.readFileSync(path.join(project,'.github/workflows/build-ios.yml'),'utf8');
function notificationHarness(){
 const mem=new Map(),calls={schedules:[],cancels:[],permissionRequests:0};
 const plugin={
  checkPermissions:async()=>({display:'granted'}),
  requestPermissions:async()=>{calls.permissionRequests++;return {display:'granted'};},
  cancel:async x=>{calls.cancels.push(x)},
  schedule:async x=>{calls.schedules.push(x)}
 };
 const root={CFLocalNotifications:plugin,CFGoogleAccount:{active:()=>({email:'prueba@example.org'})}};
 const ctx=vm.createContext({window:root,localStorage:{getItem:key=>mem.has(key)?mem.get(key):null,setItem:(key,val)=>mem.set(key,String(val))},
  SETTINGS_KEYS:{notificationTime:'cf_notification_time'},records:[],agendaEvents:[],Date,console,
  $:()=>null,cfTapFeedback:()=>{},cfSuccessFeedback:async()=>{},cfScheduleEventReminders:async()=>{},setTimeout,
  showToastMessage:()=>{}});
 const start=html.indexOf('const CF_NOTICE_ENABLED_KEY=');
 const end=html.indexOf('function updatePendingDocuments(){',start);
 assert(start>0&&end>start);
 vm.runInContext(html.slice(start,end),ctx);
 return {ctx,mem,calls,plugin};
}
test('R12: aviso diario se activa, respeta hora, abarca compras y facturas y lleva sonido',async()=>{
 const {ctx,mem,calls}=notificationHarness();
 mem.set('cf_daily_notice_enabled_r12','1');mem.set('cf_notification_sound_r12','cf_pulso.wav');mem.set('cf_notification_time','08:45');
 ctx.records=[{tipo:'Compra',facturaUrl:''},{tipo:'Facturado',facturaUrl:'',pdfUrl:'',archivoUrl:''}];
 await vm.runInContext('schedulePendingNotificationFromCurrentState()',ctx);
 assert.equal(calls.schedules.length,1);
 const n=calls.schedules[0].notifications[0];
 assert.equal(n.sound,'cf_pulso.wav');assert.equal(n.schedule.on.hour,8);assert.equal(n.schedule.on.minute,45);
 assert.match(n.body,/compra/);assert.match(n.body,/factura/);
});
test('R12: aviso diario desactivado se cancela y no programa avisos nuevos',async()=>{
 const {ctx,mem,calls}=notificationHarness();
 ctx.records=[{tipo:'Compra',facturaUrl:''}];
 mem.set('cf_daily_notice_enabled_r12','0');
 await vm.runInContext('schedulePendingNotificationFromCurrentState()',ctx);
 assert.equal(calls.schedules.length,0);
 assert.equal(calls.cancels.length,1);assert.equal(calls.cancels[0].notifications[0].id,60001);
});
test('R12: aviso a los ocho segundos y permiso de iOS implementados',()=>{
 assert.match(html,/id="cfDailyReminderEnabled"/);
 assert.match(html,/id="cfNotificationTime"|id="notificationTime"/);
 assert.match(html,/async function cfSendTestNotification\(\)/);
 assert.match(html,/Date\.now\(\)\+10000/);
 assert.match(html,/async function cfEnsureNoticePermission\(\)/);
 assert.match(html,/await cfEnsureNoticePermission\(\);await cfScheduleEventReminders\(\)/);
 assert.match(html,/sound:cfNoticePayloadSound\(\)/);
});
test('R12: se incluyen tres WAV válidos en web y main app bundle del workflow',()=>{
 for(const name of ['cf_claro.wav','cf_pulso.wav','cf_calma.wav']){
  const content=fs.readFileSync(path.join(project,'www/sounds',name));
  assert.equal(content.toString('ascii',0,4),'RIFF');assert.equal(content.toString('ascii',8,12),'WAVE');
  assert(content.length>6000&&content.length<110000);
  assert(workflow.includes('www/sounds/'+name));
  assert(workflow.includes("'Payload/ControlFiscal.app/'+f"));
 }
 assert.match(html,/id="cfNotificationSound"/);
 assert.match(workflow,/UI76-20261028-R25/);
});
test('R12: nav claro y categorias en cuadrícula, fotos en tarjetas',()=>{
 assert.match(html,/body\.lightTheme #settingsPage \.cfSettingsNavigator \.cfSettingsNavBtn/);
 assert.match(html,/\.cfInventoryTypeButtons \{display:grid!important/);
 assert.match(html,/cfInventoryListImage/);
 assert.match(html,/cfLoadPrivateInventoryPhoto\(img,img\.dataset\.cfPrivatePhoto/);
 assert.match(html,/function cfGenericPhotoQuery/);
});
test('R15: sugerencias se remiten a Google Cloud y no se exponen direcciones de correo',()=>{
 assert.match(html,/CFFeedback\.send/);
 assert.match(html,/cfTapFeedback\(\);/);
 assert.doesNotMatch(html,/mailto:/);
 assert.match(html,/Google Cloud no ha confirmado el envío/);
});
