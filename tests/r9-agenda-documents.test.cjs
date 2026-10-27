'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('www/index.html','utf8');
const extra=fs.readFileSync('www/cf-google-extras.js','utf8');
function calendarModule(){
 const root={window:null,CFGoogleAccount:{active:()=>({email:'test@example.com',id:'BOOK',token:'TOKEN'})}};root.window=root;
 vm.runInNewContext(extra,{window:root,console,Intl,Date,Uint8Array,TextEncoder,btoa:s=>Buffer.from(s,'binary').toString('base64')});
 return root.CFGoogleExtras;
}
test('R9: Calendar respeta avisos de cada evento y ninguno cuando el usuario no quiere',()=>{
 const body=calendarModule().calendarBody;
 const event={fecha:'2027-06-10',horaInicio:'18:00',horaFin:'20:00',evento:'Prueba de agenda'};
 assert.equal(body({...event,reminderMinutes:1440}).reminders.overrides[0].minutes,1440);
 assert.equal(body({...event,reminderMinutes:15}).reminders.overrides[0].minutes,15);
 assert.equal(body({...event,reminderMinutes:0}).reminders.overrides[0].minutes,0);
 assert.equal(body({...event,reminderMinutes:'none'}).reminders.overrides.length,0);
});
test('R9: opciones visibles de notificaciones y calendario no bloqueante',()=>{
 for(const n of ['agendaReminder','agendaSyncGoogle','cfCalendarPermissionError','cfScheduleEventReminders','reminderMinutes','Evento guardado en Control Fiscal'])assert.ok(html.includes(n),n);
 for(const m of ['value="none"','value="0"','value="15"','value="30"','value="60"','value="1440"','value="2880"'])assert.ok(html.includes(m),m);
 assert.match(html,/void cfUpdateEventIntegrations\(obj,calendarChecked\)/);
 assert.match(html,/if\(before==='none'\)continue/);
});
test('R9: visor local usa Bearer Google Drive y no incrusta enlaces de terceros',()=>{
 for(const str of ['cfDocumentViewer','openCFDocumentViewer','closeCFDocumentViewer','cfDocumentDriveId','?alt=media',"Authorization:'Bearer '",'URL.createObjectURL','cfDocumentOriginalLink'])assert.ok(html.includes(str),str);
 assert.match(html,/if\(!id\|\|!account\)/);
 assert.match(html,/new Blob|response\.blob\(\)/);
 assert.match(html,/closeCFDocumentViewer\(\)/);
 assert.doesNotMatch(html,/<a href="\$\{esc\(r\.facturaUrl\)\}" target="_blank"/);
});
test('R9: facturas emitidas son solo consulta, borradores se siguen pudiendo editar',()=>{
 assert.match(html,/\$\("modalTotal"\)\.disabled=|\['modalTercero','modalConcepto','modalTotal','modalIva'\]/);
 assert.match(html,/Factura emitida. Puedes retirarla de las listas de trabajo/);
 assert.match(html,/if\(editingRecord\.emitida\)/);
});
test('R9: busca fotos en Google a petición del usuario sin importación automática',()=>{
 assert.match(html,/cfOpenGoogleImageSearch/);
 assert.match(html,/https:\/\/www\.google\.com\/search\?tbm=isch&q=/);
 assert.match(html,/Por licencias y seguridad/);
});
test('R9: sin alteraciones nativas de fondo de pantalla',()=>{
 assert.doesNotMatch(html,/UIApplication\.shared\.setWallpaper|wallpaper\.setWallpaper/);
 assert.match(html,/UI76-20261027-R22/);
 const auth=fs.readFileSync('www/cf-google-auth.js','utf8');
 assert.match(auth,/root\.closeCFDocumentViewer/);
});
