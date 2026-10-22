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
 // La única regla adicional está limitada a [hidden] del acceso Google.
 assert.equal(styles.length,ref.v76StylesSha256.length+2);
 assert.match(html,/<style id="cf-v76-access-security-ui">/);
});
test('Inicio, Agenda y Stock son el HTML original V76 (sin clones V78)',()=>{
 for(const [name,digest] of Object.entries(ref.v76SectionSha256)){
  const match=new RegExp('<section id="'+name+'"[\\s\\S]*?<\\/section>').exec(html);
  assert.ok(match,'No existe '+name);
  // La tarjeta FACTURACIÓN de Inicio va al mismo módulo que la pestaña inferior.
  const normalized=name==='home'?match[0].replace('onclick="openFacturacionPage()"','onclick="openForm(\'Facturado\')"'):match[0];
  assert.equal(sha(normalized),digest,'Se ha modificado el diseño original de '+name);
 }
});
test('formularios dinámicos y navegación mantienen el código de diseño V76',()=>{
 for(const [name,digest] of Object.entries(ref.v76FunctionsSha256)){
  assert.equal(sha(sourceFunction(name)),digest,'Ha cambiado el formulario/navegación V76 '+name);
 }
});
test('no hay rótulos ni scripts de formularios de pruebas V78',()=>{
 for(const str of ['Google Sheets personal','Borradores y conceptos','Nueva compra de prueba.','Inicia sesión y recupera tu libro.','cf-google-test-gate','phase6-navigation-v78']){
  assert.ok(!html.includes(str),'Se ha vuelto a incorporar la interfaz de pruebas: '+str);
 }
 const htmlScripts=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(htmlScripts,['google-login.bundle.js','cf-google-auth.js','cf-google-data.js','cf-google-upload.js','cf-invoice-share.js']);
});
test('entrada al Inicio original al conectar Google y al cambiar de usuario',()=>{
 assert.match(html,new RegExp('data-cf-ui-build="'+ref.buildTag+'"'));
 assert.match(html,new RegExp('id="cfV76BuildIdentity"[^>]*>[^<]*'+ref.buildTag));
 assert.match(auth,/if\(typeof root\.goHome==='function'\)root\.goHome\(\);/);
 assert.match(auth,/root\.startLocalSecurityForAccount\(\)/);
 assert.match(auth,/element\('accountGate'\)\?\.classList\.add\('hidden'\)/);
 assert.match(auth,/function logout\(/);
});
