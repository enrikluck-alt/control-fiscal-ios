'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm');
const auth=fs.readFileSync('www/cf-google-auth.js','utf8');
const html=fs.readFileSync('www/index.html','utf8');
const workflow=fs.readFileSync('.github/workflows/build-ios.yml','utf8');
test('R6: selección Google no rechaza el correo escrito y fuerza selector nativo',async()=>{
 const classes=()=>({add(){},remove(){},toggle(){}});
 const nodes=new Map();const el=id=>{
   if(!nodes.has(id))nodes.set(id,{value:'',checked:true,disabled:false,hidden:false,textContent:'',classList:classes(),setAttribute(){}});
   return nodes.get(id);
 };
 el('accountEmailHint').value='escrita@example.com';
 const id='R6_TEST_GOOGLE_SHEET_123456789012345';
 const store=new Map([['cf_google_book_elegida@example.com',id]]);
 const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
 let loginOpts,hapticOpts;
 const root={localStorage:storage,ControlFiscalSocialLogin:{initialize:async()=>{},login:async opts=>{loginOpts=opts;return {result:{accessToken:'TOKEN_VALID_12345678901234567890123'}};},logout:async()=>{}},CFHaptics:{impact:async opts=>{hapticOpts=opts;}},
  fetch:async url=>{const info=url.includes('userinfo')?{email:'elegida@example.com',email_verified:true}:url.includes('drive/v3/files/')?{id,ownedByMe:true,trashed:false}:url.includes('fields=spreadsheetId,sheets')?{spreadsheetId:id,sheets:['Configuracion','Compras','Facturas','Inventario','Clientes','Agenda','Ingresos','CF_Registros_v2','CF_Facturas_Emitidas','CF_Facturas_Documentos'].map(title=>({properties:{title}}))}:{spreadsheetId:id};return {ok:true,status:200,text:async()=>JSON.stringify(info)};},
  goHome(){},startLocalSecurityForAccount:async()=>{},clearUserLocalCaches(){},updateAccountSettings(){},lockSecurity(){},confirm:()=>true,URLSearchParams};
 root.window=root;
 vm.runInNewContext(auth,{window:root,document:{getElementById:el},URLSearchParams,navigator:{},console});
 await root.CFGoogleAccount.connect();
 assert.equal(root.CFGoogleAccount.active()?.email,'elegida@example.com');
 assert.equal(el('accountEmailHint').value,'elegida@example.com');
 assert.equal(loginOpts.options.forcePrompt,true);
 await root.CFGoogleAccount.logout();
 assert.equal(hapticOpts.style,'LIGHT');
});
test('R6: Ajustes agrupa solo diseño, sitúa Cuenta al final y cierra con botón rojo',()=>{
 const design=html.indexOf('id="cfDesignPanel"');const account=html.indexOf('id="accountSettingsGroup"');
 assert.ok(design>0&&account>design);
 const designContent=html.slice(design,html.indexOf('<div class="settingsGroup" id="cfDirectorySettingsGroup">',design));
 for(const t of ['🎨 FONDO','IMAGEN DEL MENÚ PRINCIPAL','COLOR DE COMPRAS','COLOR DE FACTURACIÓN','IDIOMA, ORIENTACIÓN Y RENDIMIENTO','RESTABLECER'])assert.ok(designContent.includes(t),t);
 assert.equal(designContent.includes('👤 CUENTA'),false);
 assert.ok(account>html.indexOf('ℹ️ INFORMACIÓN Y HERRAMIENTAS',design));
 assert.match(html,/id="cfLogoutDangerButton" class="cfLogoutDanger"/);
 assert.match(html,/\.cfLogoutDanger\{[^}]*background:#b91c1c!important/);
 assert.match(html,/function toggleDesignSettings\(forceOpen\)/);
 assert.match(html,/style:'LIGHT'/);
 assert.doesNotMatch(html,/style:'Light'/);
});
test('R6: logo oficial por defecto y dentro de IPA sin alterar imagen personalizada',()=>{
 assert.ok(fs.existsSync('www/control-fiscal-logo.jpg'));
 assert.match(html,/const src=saved \|\| "control-fiscal-logo.jpg"/);
 assert.match(html,/localStorage\.getItem\(SETTINGS_KEYS\.homeBrandImage\)/);
 assert.match(workflow,/control-fiscal-logo.jpg/);
 for(const f of ['UI76-20261023-R15','ControlFiscal-V76-Google-R15-Cloud-Feedback-IPA','ControlFiscal_V76_Google_R15_Idiomas_Visor_Avisos.ipa'])assert.ok(workflow.includes(f),f);
});
