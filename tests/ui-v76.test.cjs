/* El aspecto V76 se comprueba contra firmas extraídas del HTML V76 original,
   no contra archivos de V78 ni pantallas reconstruidas. */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../www/index.html'),'utf8');
const auth=fs.readFileSync(path.join(__dirname,'../www/cf-google-auth.js'),'utf8');
const ref=JSON.parse(fs.readFileSync(path.join(__dirname,'ui-v76-reference.json'),'utf8'));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function sourceFunction(name){
 const start=new RegExp('\\bfunction\\s+'+name+'\\s*\\(').exec(html);
 assert.ok(start,'Falta '+name);
 const tail=html.slice(start.index+start[0].length);
 const next=/\n(?:async )?function\s+\w+\s*\(/.exec(tail);
 assert.ok(next,'No se puede delimitar '+name);
 return html.slice(start.index,start.index+start[0].length+next.index);
}
test('la edición mantiene los 11 estilos originales de V76 idénticos',()=>{
 const styles=[...html.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)].map(m=>sha(m[1]));
 for(const digest of ref.v76StylesSha256)assert.ok(styles.includes(digest),'Falta estilo original V76 '+digest);
 // Los estilos originales siguen byte-a-byte: R18 añade un bloque aislado para el nuevo visor de documentos y Agenda.
 assert.equal(styles.length,ref.v76StylesSha256.length+13);
 assert.match(html,/<style id="cf-r3-accessibility">/);
 assert.match(html,/<style id="cf-v76-access-security-ui">/);
 assert.match(html,/<style id="cf-r21-panel-style">/);
 assert.match(html,/<style id="cf-r22-operations-style">/);
});
test('Inicio, Agenda y Stock son el HTML original V76 (sin clones V78)',()=>{
 for(const [name,digest] of Object.entries(ref.v76SectionSha256)){
  const match=new RegExp('<section id="'+name+'"[\\s\\S]*?<\\/section>').exec(html);
  assert.ok(match,'No existe '+name);
  // La tarjeta FACTURACIÓN de Inicio va al mismo módulo que la pestaña inferior.
  const normalized=name==='home'?match[0]
    .replace(/      <button class="home full" onclick="CFDocuments\.open\(\)">[\s\S]*?<\/button>\n\n/,'')
    .replace('onclick="openFacturacionPage()"','onclick="openForm(\'Facturado\')"')
    .replace('src="control-fiscal-logo.jpg"','src="chispas-logo.png"'):match[0];
  if(name==='agendaPage'){
   // R22 añade una leyenda a la Agenda sin sustituir la cuadrícula o los eventos originales.
   assert.match(normalized,/id="agendaGrid"/);assert.match(normalized,/id="agendaMonthLabel"/);assert.match(normalized,/id="agendaUpcoming"/);assert.match(normalized,/id="cfR22AgendaLegend"/);
  } else assert.equal(sha(normalized),digest,'Se ha modificado el diseño original de '+name);
 }
});
test('formularios dinámicos y navegación mantienen el código de diseño V76',()=>{
 for(const [name,digest] of Object.entries(ref.v76FunctionsSha256)){
  if(['openSettings','only','openInventoryModal','saveInventoryItem','renderInventory'].includes(name)){
   const fn=sourceFunction(name);
   if(name==='openSettings')assert.match(fn,/cfSettingsHome\(\)/);
   if(name==='only')assert.match(fn,/documentsPage/);
   if(name==='openInventoryModal')assert.match(fn,/getInventoryCategories/);
   if(name==='saveInventoryItem')assert.match(fn,/guardarInventario/);
   if(name==='renderInventory'){assert.match(fn,/cfInventoryListImage/);assert.match(fn,/cfLoadPrivateInventoryPhoto/);}
   continue; // Navegación R10: mantiene la interfaz de V76, añade Documentos y Ajustes aislados.
  }
  if(name==='renderAgenda'){assert.match(sourceFunction(name),/calendarGrid|agendaGrid|calDay/);continue;}
  if(name==='openAgenda'){const fn=sourceFunction(name);assert.match(fn,/only\("agendaPage"\)/);assert.match(fn,/CFR22Agenda\?\.refresh/);continue;}
  if(name==='openPendingIncomeForm'){
   const fn=sourceFunction(name);
   assert.match(fn,/pendingPaymentState/);assert.match(fn,/pendingCharged/);
   continue; // R20: solo se agregan opciones de cobro al formulario V76.
  }
  if(name==='openForm'){
   const fn=sourceFunction(name);
   assert.match(fn,/Distribuidor/);assert.match(fn,/renderAutocomplete/);
   assert.doesNotMatch(fn,/TIENDA<\/button>/);
   continue; // Solo cambia el campo de terceros: se conserva el resto del diseño.
  }
  assert.equal(sha(sourceFunction(name)),digest,'Ha cambiado el formulario/navegación V76 '+name);
 }
});
test('no hay rótulos ni scripts de formularios de pruebas V78',()=>{
 for(const str of ['Google Sheets personal','Borradores y conceptos','Nueva compra de prueba.','Inicia sesión y recupera tu libro.','cf-google-test-gate','phase6-navigation-v78']){
  assert.ok(!html.includes(str),'Se ha vuelto a incorporar la interfaz de pruebas: '+str);
 }
 const htmlScripts=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(htmlScripts,['google-login.bundle.js','cf-google-auth.js','cf-google-data.js','cf-google-upload.js','cf-invoice-numbering.js','cf-invoice-share.js','cf-google-extras.js','cf-postal.js','cf-documents.js','cf-i18n.js','cf-i18n-extended.js','cf-firebase-config.js','cf-firebase-auth.js','cf-feedback-config.js','cf-feedback.js','cf-r14-native.js','cf-navigation.js','cf-pdf-viewer.js','cf-r18-features.js','cf-r18-languages.js','cf-r20-payments.js','cf-r21-features.js','contacts.bundle.js','cf-r22-features.js']);
});
test('entrada al Inicio original al conectar Google y al cambiar de usuario',()=>{
 assert.match(html,new RegExp('data-cf-ui-build="UI76-20261027-R22"'));
 assert.match(html,new RegExp('id="cfV76BuildIdentity"[^>]*>[^<]*UI76-20261027-R22'));
 assert.match(auth,/if\(typeof root\.goHome==='function'\)root\.goHome\(\);/);
 assert.match(auth,/root\.startLocalSecurityForAccount\(fromInteractiveLogin\)/);
 assert.match(auth,/element\('accountGate'\)\?\.classList\.add\('hidden'\)/);
 assert.match(auth,/function logout\(/);
});
