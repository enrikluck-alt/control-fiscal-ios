'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'www/index.html'),'utf8');
const extras=fs.readFileSync(path.join(root,'www/cf-google-extras.js'),'utf8');

test('R13: Gmail envía sugerencias y documentos solo después de confirmar el ID Gmail',async()=>{
  const calls=[],active={id:'sheet-A',email:'remitente@gmail.com',token:'access-valid'};
  const ctx=vm.createContext({
    window:{btoa:binary=>Buffer.from(binary,'binary').toString('base64'),CFGoogleAccount:{active:()=>active,http:async(url,method,body)=>{
      calls.push({url,method,body});return {id:'gmail-message-confirmed'};
    }}},TextEncoder,btoa:binary=>Buffer.from(binary,'binary').toString('base64'),Date,console
  });
  vm.runInContext(extras,ctx);
  const send=ctx.window.CFGoogleExtras;
  const support=await send.sendSupport({recipient:'electrochispas@outlook.es',kind:'Error',message:'No puedo programar notificaciones de Agenda',appVersion:'R13'});
  assert.equal(support.id,'gmail-message-confirmed');
  const rawSupport=Buffer.from(calls[0].body.raw,'base64url').toString('utf8');
  assert.match(rawSupport,/To: electrochispas@outlook.es/);
  assert.doesNotMatch(rawSupport,/datos fiscales|CF_Registros_v2/);
  const pdf=Buffer.from('%PDF-1.4 test').toString('base64');
  const answer=await send.sendDocuments({recipient:'gestor@example.com',from:'2026-01',to:'2026-10',attachments:[{name:'recibo.pdf',mime:'application/pdf',base64:pdf}]});
  assert.equal(answer.documentos,1);assert.equal(answer.id,'gmail-message-confirmed');
  const rawDocs=Buffer.from(calls[1].body.raw,'base64url').toString('utf8');
  assert.match(rawDocs,/To: gestor@example.com/);
  assert.match(rawDocs,/Content-Disposition: attachment; filename="recibo.pdf"/);
  assert.match(rawDocs,/JVBERi0xLjQgdGVzdA==/);
  await assert.rejects(send.sendDocuments({recipient:'gestor@example.com',attachments:[]}),/No hay documentos/);
});

test('R13: el evento confirma la escritura sin esperar a Calendar ni avisos',async()=>{
 const mock={agendaEventName:'Fiesta',agendaEventDate:'2026-10-27',agendaEventStart:'18:00',agendaEventEnd:'22:00',agendaEventClient:'',agendaEventLocation:'Plaza Mayor, Cuenca',agendaEventBring:'',agendaEventComments:'',agendaReminder:'none',agendaSyncGoogle:{checked:false},agendaMsg:{className:'',textContent:''},agendaSaveBtn:{disabled:false,textContent:''}};
 const ui=id=>['agendaSyncGoogle','agendaMsg','agendaSaveBtn'].includes(id)?mock[id]:{value:mock[id]||''};
 let actions=0,rendered=0,feedback=0;
 const ctx=vm.createContext({agendaEditingId:null,agendaEvents:[],cfEventSavePending:false,$:ui,
  callAction:async data=>{actions++;assert.equal(data.accion,'guardarEvento');return {ok:true};},
  cfEnsureNoticePermission:async()=>{},cfScheduleEventReminders:async()=>{},
  cfSuccessFeedback:async()=>{feedback++;},renderAgenda:()=>{rendered++;},
  localStorage:{setItem:()=>{}},setTimeout:()=>1,console,Date,Promise,Math,
  cfCalendarPermissionError:e=>String(e),window:{CFGoogleExtras:{upsertCalendar:async()=>new Promise(()=>{})}}
 });
 const start=html.indexOf('let cfEventSavePending=false');const end=html.indexOf('async function deleteAgendaEvent(){',start);
 assert(start>0&&end>start);
 vm.runInContext(html.slice(start,end),ctx);
 await vm.runInContext('saveAgendaEvent()',ctx);
 assert.equal(actions,1);assert.equal(rendered,1);assert.equal(feedback,1);
 assert.equal(ctx.agendaEvents.length,1);assert.equal(ctx.agendaEvents[0].ubicacion,'Plaza Mayor, Cuenca');
 assert.match(mock.agendaMsg.textContent,/guardado en Control Fiscal/);
 assert.equal(mock.agendaSaveBtn.disabled,false);
 assert.equal(ctx.agendaEditingId,ctx.agendaEvents[0].id);
 // Una segunda edición con Calendar marcado debe confirmar Sheets sin esperar
 // a que upsertCalendar responda; el mock deja esa petición pendiente para siempre.
 mock.agendaSyncGoogle.checked=true;
 await vm.runInContext('saveAgendaEvent()',ctx);
 assert.equal(actions,2);
 assert.equal(ctx.agendaEvents.length,1);
 assert.match(mock.agendaMsg.textContent,/guardado en Control Fiscal/);
});

test('R13: el aviso de prueba informa en Audio y Notificaciones y confirma programación',async()=>{
 const calls=[];const statuses={notificationStatus:{textContent:''},cfNotificationSoundStatus:{textContent:''}};
 const plugin={checkPermissions:async()=>({display:'granted'}),cancel:async()=>{},schedule:async options=>{calls.push(options);return {notifications:[{id:60009}]};},getPending:async()=>({notifications:[{id:60009}]})};
 const ctx=vm.createContext({window:{CFLocalNotifications:plugin},localStorage:{getItem:()=>null},console,Date,Promise,
  $:id=>statuses[id]||null,cfSuccessFeedback:async()=>{},SETTINGS_KEYS:{notificationTime:'notificationTime'},
  cfTapFeedback:()=>{},records:[],agendaEvents:[],setTimeout:()=>0,showToastMessage:()=>{}});
 const start=html.indexOf('const CF_NOTICE_ENABLED_KEY=');const end=html.indexOf('function updatePendingDocuments(){',start);
 vm.runInContext(html.slice(start,end),ctx);
 await vm.runInContext('cfSendTestNotification()',ctx);
 assert.equal(calls.length,1);assert.equal(calls[0].notifications[0].id,60009);assert.equal(calls[0].notifications[0].foreground,true);
 assert.match(statuses.notificationStatus.textContent,/iOS ha aceptado/);
 assert.equal(statuses.notificationStatus.textContent,statuses.cfNotificationSoundStatus.textContent);
});

test('R13: aviso de evento ofrece ruta en Mapas y modal respeta la zona segura',()=>{
 assert.match(html,/localNotificationActionPerformed/);
 assert.match(html,/maps\.apple\.com\/\?daddr=/);
 assert.match(html,/extra:\{kind:'agenda',eventId:String\(event\.id\|\|''\),location:loc\.slice/);
 assert.match(html,/#agendaEventModal\{align-items:flex-start!important/);
 assert.match(html,/env\(safe-area-inset-top/);
 assert.match(html,/id="agendaSaveBtn"/);
});

test('R13: documentación ya no invoca el envío desactivado de la capa de datos',()=>{
 const send=html.slice(html.indexOf('async function sendInvoicesByEmail(){'),html.indexOf('function openPublicTenders(){'));
 assert.match(send,/CFGoogleExtras\.sendDocuments/);
 assert.doesNotMatch(send,/accion:\s*["']enviarFacturas/);
 assert.match(send,/cfDocumentDriveId/);
 assert.match(send,/Gmail ha confirmado/);
});
