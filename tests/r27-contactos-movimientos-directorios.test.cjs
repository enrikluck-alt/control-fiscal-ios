'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('www/index.html','utf8');
const r27=fs.readFileSync('www/cf-r27-contacts-bridge.js','utf8');
const r26=fs.readFileSync('www/cf-r26-features.js','utf8');
const api=fs.readFileSync('www/cf-google-data.js','utf8');
const workflow=fs.readFileSync('.github/workflows/build-ios.yml','utf8');

test('R27 puente nativo elige un único número sin leer agenda completa',async()=>{
 let args,called=0;
 const root={Capacitor:{getPlatform:()=> 'ios',Plugins:{CapacitorContacts:{pickContacts:async options=>{called++;args=options;return {contacts:[{displayName:'Ejemplo',phoneNumbers:[{value:'+34600000000'}],emailAddresses:[{value:'no-se-debe-extraer@example.com'}]}]};}}}}};
 vm.runInNewContext(r27,{window:root});
 const result=await root.CFNativeContactPicker.pickContact();
 assert.equal(result.phoneNumbers[0].value,'+34600000000');
 assert.equal(result.displayName,'Ejemplo');
 assert.equal(result.emails.length,0,'El selector de teléfono no debe solicitar el correo');
 assert.equal(called,1);
 assert.equal(args.property,'phoneNumber');
});
test('R27 puente nativo da error explícito si la IPA carece del plugin',async()=>{
 const root={Capacitor:{getPlatform:()=> 'ios',Plugins:{}}};
 vm.runInNewContext(r27,{window:root});
 await assert.rejects(root.CFNativeContactPicker.pickContact(),/no está registrado/);
});
test('R27 no repite el selector al cancelar la elección',async()=>{
 let fallbackCount=0;
 const root={CFNativeContactPicker:{pickContact:async()=>{throw Error('User canceled');}},Capacitor:{getPlatform:()=> 'ios',Plugins:{CapacitorContacts:{pickContacts:async()=>{fallbackCount++;return {contacts:[]};}}}}};
 vm.runInNewContext(r27,{window:root});
 await assert.rejects(root.CFNativeContactPicker.pickContact(),/User canceled/);
 assert.equal(fallbackCount,0);
});
function movementEnv(){
 const elements={};
 for(const id of ['cfR26TypeCompra','cfR26TypeFactura','cfR26TypeIngreso','cfR26ReminderCard','cfR26RemindInvoicesWrap','cfR26RemindIncomesWrap','cfR26ReminderFrequency','cfR26ReminderIntervalRow','cfR26ReminderMonthDayWrap'])elements[id]={hidden:false,checked:false,value:''};
 const root={document:{getElementById:id=>elements[id]||null},CFGoogleAccount:{active:()=>({id:'book-A'})}};
 vm.runInNewContext(r26,{window:root,Date,Intl,Number});
 return {ui:root.CFR26,els:elements};
}
test('R27 recordatorios solo visibles si hay facturas o ingresos seleccionados',()=>{
 const {ui,els}=movementEnv();els.cfR26TypeCompra.checked=true;
 ui.updateReminderControls();assert.equal(els.cfR26ReminderCard.hidden,true);
 els.cfR26TypeFactura.checked=true;ui.updateReminderControls();
 assert.equal(els.cfR26ReminderCard.hidden,false);
 assert.equal(els.cfR26RemindInvoicesWrap.hidden,false);
 assert.equal(els.cfR26RemindIncomesWrap.hidden,true);
 els.cfR26TypeFactura.checked=false;els.cfR26TypeIngreso.checked=true;ui.updateReminderControls();
 assert.equal(els.cfR26ReminderCard.hidden,false);
 assert.equal(els.cfR26RemindInvoicesWrap.hidden,true);
 assert.equal(els.cfR26RemindIncomesWrap.hidden,false);
});
test('R27 cada X días permite personalizar y solo muestra el input cuando procede',()=>{
 const {ui,els}=movementEnv();
 els.cfR26ReminderFrequency.value='interval';ui.reminderFrequencyChanged();
 assert.equal(els.cfR26ReminderIntervalRow.hidden,false);
 assert.equal(els.cfR26ReminderMonthDayWrap.hidden,true);
 els.cfR26ReminderFrequency.value='monthly';ui.reminderFrequencyChanged();
 assert.equal(els.cfR26ReminderIntervalRow.hidden,true);
 assert.equal(els.cfR26ReminderMonthDayWrap.hidden,false);
 els.cfR26ReminderFrequency.value='weekly';ui.reminderFrequencyChanged();
 assert.equal(els.cfR26ReminderIntervalRow.hidden,true);
 assert.equal(els.cfR26ReminderMonthDayWrap.hidden,true);
});
test('R27 mantiene por separado tres casillas visibles para movimientos',()=>{
 const block=html.slice(html.indexOf('id="cfR26MovementsPage"'),html.indexOf('id="cfR26MovementItems"'));
 assert.match(block,/cfR27CategoryChecks/);
 for(const id of ['cfR26TypeCompra','cfR26TypeFactura','cfR26TypeIngreso'])assert.match(block,new RegExp(`type="checkbox" id="${id}"`));
 assert.match(html,/appearance:checkbox!important/);
 assert.match(html,/#cfR26MovementsPage \.cfR27CategoryChecks/);
});
test('R27 borrar contacto exige confirmación y nunca borra registros históricos',()=>{
 assert.match(html,/async function deleteContactDirectory\(/);
 assert.match(html,/window\.confirm\(/);
 assert.match(html,/id="cfDirectoryDeleteBtn"/);
 const block=html.slice(html.indexOf('async function deleteContactDirectory()'),html.indexOf('function renderInvoiceCl',html.indexOf('async function deleteContactDirectory()')));
 assert.match(block,/accion:'eliminarCliente'/);
 assert.match(block,/accion:'eliminarTercero'/);
 assert.doesNotMatch(block,/accion:'eliminar'/);
 assert.match(api,/case 'eliminarCliente':\{/);
 assert.match(api,/await revision\(s,'Clientes',old\._key,\{\},true\)/);
});
test('R27 pipeline obliga a empaquetar puente JS y plugin nativo en iOS',()=>{
 assert.match(workflow,/cf-r27-contacts-bridge\.js/);
 assert.match(workflow,/contacts\.bundle\.js/);
 assert.match(workflow,/UI76-20261028-R27/);
});
function sheetsEnv(){
 const sheets={};
 const session={id:'book-r27-unique-123456789',token:'valid-r27-test-token',email:'owner@example.com'};
 const root={CFGoogleAccount:{active:()=>session,http:async(url,method='GET',payload)=>{
  const encoded=url.split('/values/')[1]?.split('?')[0]||'';
  const m=decodeURIComponent(encoded).match(/^'([^']+)'!(.+)$/);
  if(!m)throw Error('Invalid Sheets range '+url);
  const tab=m[1],rows=sheets[tab]??=[];sheets[tab]=rows;
  if(method==='GET')return {values:rows.map(r=>[...r])};
  if(url.includes(':append')){rows.push(...payload.values.map(r=>[...r]));return {updates:{updatedRange:`'${tab}'!A${rows.length}:C${rows.length}`}};}
  if(method==='PUT'){const row=Number(m[2].match(/^A(\d+)/)?.[1]);if(!row)throw Error('Bad put');rows[row-1]=payload.values[0];return {};}
  throw Error('Unsupported HTTP');
 }}};
 vm.runInNewContext(api,{window:root,console,URLSearchParams,Date,Number});
 return {sheets,action:root.CFGoogleData.action};
}
test('R27 elimina cliente del directorio conservando compras y facturas históricas',async()=>{
 const {sheets,action}=sheetsEnv();
 sheets.Clientes=[['Nombre / Empresa','CIF','Dirección','CP','Ciudad','Provincia','Teléfono','Email','Activo'],['Empresa Ejemplo','B12345678','C/ Uno','28000','Madrid','Madrid','600000000','c@example.com','TRUE']];
 sheets.Compras=[['Fecha','Tercero','Concepto','Base','IVA','IVA €','Total'],['2026-09-01','Empresa Ejemplo','Material',100,21,21,121]];
 sheets['Facturación']=[['Fecha','Tercero','Concepto','Base','IVA','IVA €','Total'],['2026-09-02','Empresa Ejemplo','Servicio',200,21,42,242]];
 const before={client:JSON.stringify(sheets.Clientes),buy:JSON.stringify(sheets.Compras),invoice:JSON.stringify(sheets.Facturación)};
 const current=(await action({accion:'listarClientes'})).clientes[0];
 assert.ok(current._key);
 const result=await action({accion:'eliminarCliente',key:current._key,cif:current.cif});
 assert.equal(result.clientes.length,0);
 assert.equal((await action({accion:'listarClientes'})).clientes.length,0);
 assert.equal(JSON.stringify(sheets.Clientes),before.client,'La fila antigua no se destruye');
 assert.equal(JSON.stringify(sheets.Compras),before.buy,'Las compras deben quedar intactas');
 assert.equal(JSON.stringify(sheets.Facturación),before.invoice,'Las facturas deben quedar intactas');
 assert.equal(sheets.CF_Registros_v2.at(-1)[0],'CFV76_GOOGLE_2');
});
test('R27 oculta distribuidor legado, sin borrar nombre de operaciones ni tabla antigua',async()=>{
 const {sheets,action}=sheetsEnv();
 sheets.Listas=[['Categoría','Nombre'],['Proveedor','Empresa de material']];
 sheets.Compras=[['Fecha','Tercero','Concepto','Base','IVA','IVA €','Total'],['2026-09-01','Empresa de material','Material',100,21,21,121]];
 const before=JSON.stringify(sheets.Compras);
 assert.ok((await action({accion:'listarTerceros'})).proveedores.includes('Empresa de material'));
 await action({accion:'eliminarTercero',categoria:'Distribuidor',nombre:'Empresa de material'});
 const newList=await action({accion:'listarTerceros'});
 assert.ok(!newList.proveedores.includes('Empresa de material'));
 assert.equal(JSON.stringify(sheets.Compras),before);
 assert.equal(sheets.Listas[1][1],'Empresa de material');
});
