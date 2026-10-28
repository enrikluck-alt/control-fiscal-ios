'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const h=fs.readFileSync('www/index.html','utf8'),src=fs.readFileSync('www/cf-r26-features.js','utf8'),pdf=fs.readFileSync('www/cf-pdf-viewer.js','utf8'),wf=fs.readFileSync('.github/workflows/build-ios.yml','utf8');
test('R26: menu principal y nuevo listado de las tres clases',()=>{
 for(const id of ['cfR26MovementsPage','cfR26TypeCompra','cfR26TypeFactura','cfR26TypeIngreso','cfR26Period','cfR26From','cfR26To','cfR26Year','cfR26Month','cfR26MovementItems'])assert.ok(h.includes(`id="${id}"`),id);
 assert.match(h,/TODOS LOS MOVIMIENTOS/);assert.match(h,/CFR26\.openMovements\(\)/);
 assert.match(src,/root\.CFR20Data\?\.records/);assert.match(src,/root\.CFR20Data\?\.incomes/);
 assert.match(src,/if\(!root\.CFGoogleAccount\?\.active\(\)\?\.id\)return \[\]/);
});
test('R26: filtros calculan correctamente periodo y limites inclusivos',()=>{
 const win={document:{getElementById:()=>null},CFGoogleAccount:{active:()=>({id:'SheetA'})}};
 vm.runInNewContext(src,{window:win,Date,Intl,Number});
 const f=win.CFR26.isWithin;
 assert.equal(f({fecha:'2026-10-28'},{mode:'custom',from:'2026-10-01',to:'2026-10-28'}),true);
 assert.equal(f({fecha:'2026-10-29'},{mode:'custom',from:'2026-10-01',to:'2026-10-28'}),false);
 assert.equal(f({fecha:'2025-10-28'},{mode:'year',year:'2025'}),true);
 assert.equal(f({fecha:'2026-07-01'},{mode:'month',year:'2026',month:'7'}),true);
 assert.equal(win.CFR26.day('2026-10-28T18:30:00Z'),'2026-10-28');
});
test('R26: contactos usan selector telefónico nativo y errores junto al botón',()=>{
 const c=fs.readFileSync('contacts-entry.js','utf8'),r22=fs.readFileSync('www/cf-r22-features.js','utf8');
 assert.match(c,/CapacitorContacts\.pickContact\(\{ property: ContactProperty\.PhoneNumber \}\)/);
 assert.match(c,/getPlatform\(\) === 'web'/);
 for(const id of ['cfR26IncomeContactStatus','cfR26PaymentContactStatus'])assert.ok(h.includes(id));
 assert.match(r22,/const inline=\$\(kind===/);
});
test('R26: modal se abre arriba y el boton de PDF solo si existe el enlace',()=>{
 assert.match(h,/#recordModal\{align-items:flex-start!important/);
 assert.match(h,/#cfR25ViewAttachment\[hidden\]/);
 assert.match(h,/const valid=\/\^https:/);
 assert.match(h,/incomeView\.hidden=!valid/);
});
test('R26: el cargando se mantiene hasta que PDF.js pinta primera página',()=>{
 assert.match(h,/id="cfR26ViewerLoading"/);
 assert.match(h,/Cargando documento desde Drive/);
 assert.match(h,/Dibujando primera página del PDF/);
 assert.match(pdf,/await render\(pane\.firstElementChild,token\)/);
 assert.match(h,/finally\{if\(loader\)loader\.hidden=true;\}/);
});
test('R26: leyenda azul de eventos y acceso al archivo completo',()=>{
 assert.match(h,/Azul = eventos/);assert.match(h,/\.cfR22Dot\.isEvent\{background:#4c9de9\}/);
});
test('R26: recordatorios solamente guardan preferencias, no envían mensajes',()=>{
 assert.match(h,/Cada X días/);assert.match(h,/Un día del mes/);assert.match(h,/Facturas pendientes/);assert.match(h,/Ingresos independientes pendientes/);
 assert.match(h,/Guardar preferencias \(sin activar envíos\)/);
 assert.doesNotMatch(src,/sendPaymentReminder|sendEmail|wa\.me/);
 assert.match(src,/NO hay envíos automáticos activos/);
});
test('R26: pipeline incluye el modulo de movimientos y la IPA actualizada',()=>{
 assert.match(wf,/cf-r26-features\.js/);assert.match(wf,/UI76-20261028-R26/);assert.match(wf,/ControlFiscal_R26_Movimientos_Visor_Contactos\.ipa/);
});
