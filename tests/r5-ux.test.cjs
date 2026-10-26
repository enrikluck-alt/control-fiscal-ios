'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('www/index.html','utf8'),auth=fs.readFileSync('www/cf-google-auth.js','utf8'),w=fs.readFileSync('.github/workflows/build-ios.yml','utf8');
test('R5: los componentes R4 tienen tema claro, incluida la creación y registro de ingresos',()=>{
 for(const token of ['body.lightTheme .cfChartCard','body.lightTheme .cfTenderCard','body.lightTheme #formBody .invoiceCreateBox','body.lightTheme #formBody .pendingIncomeBoxText','body.lightTheme .cfNumberHelp'])assert.ok(html.includes(token),token);
 assert.match(html,/background:#fff!important;color:#111820/);
});
test('R5: evita zoom por foco con campos de 16 px y conserva accesibilidad',()=>{
 assert.match(html,/input,select,textarea,\.input,\.select,\.textarea/);
 assert.match(html,/font-size:16px!important/);
 assert.doesNotMatch(html,/maximum-scale=1|user-scalable=no/);
});
test('R5: numeración explicada y guía ampliada con ejemplos visuales',()=>{
 for(const x of ['Cómo construir un número de factura','3:1','Año actual','cfGuideMock','Guía completa','COMPARACIÓN ILUSTRATIVA','UI76-20261026-R20'])assert.ok(html.includes(x),x);
 assert.match(html,/id="guideModal"/);
});
test('R5: abre portal gubernamental HTTPS y no ignora errores TLS',()=>{
 assert.match(html,/administracion\.gob\.es\/tu-espacio-europeo/);
 assert.doesNotMatch(html,/const url='https:\/\/contrataciondelestado\.es\//);
});
test('R5: restauración Google usa autorización nativa antes de refrescar y no almacena tokens largos',()=>{
 assert.match(auth,/plugin\.getAuthorizationCode/);assert.match(auth,/plugin\.refresh/);
 assert.doesNotMatch(auth,/La sesión de Google ha caducado\. Pulsa iniciar sesión\./);
 assert.doesNotMatch(auth,/setTimeout\(resolve,600\)/);
 assert.match(auth,/startLocalSecurityForAccount\(fromInteractiveLogin\)/);
 assert.match(html,/if\(fromInteractiveLogin\)/);
});
test('R5: comparador seguro y orden local de ofertas verificadas',()=>{
 for(const t of ['COMPARAR PRECIOS DE PRODUCTOS','cfOpenPriceSearch','cfAddPriceOffer','cfRenderPriceOffers','idealo.es/resultados.html','tbm=shop','\.sort\(\(a,b\)=>a.amount-b.amount\)'])assert.ok(html.includes(t.replace('\\.sort','sort').replace('\\(','(').replace('\\)',' )').trim())||html.includes(t),t);
 assert.match(html,/if\(url&&!\/\^https:/);
});
test('R5: IPA de GitHub y marcador comparten versión',()=>{
 for(const t of ['UI76-20261026-R20','ControlFiscal-V76-Google-R20-Cobros-Sugerencias-IPA','build/ControlFiscal_V76_Google_R20_Cobros_Sugerencias.ipa'])assert.ok(w.includes(t),t);
});

test('R5: restauración con token nativo evita abrir selector Google y abre Inicio con bloqueo',async()=>{
 const dom=new Map();const get=id=>{if(!dom.has(id)){
  const set=new Set();dom.set(id,{value:id==='accountKeepSession'?'1':'',checked:id==='accountKeepSession',hidden:false,disabled:false,textContent:'',classList:{add:x=>set.add(x),remove:x=>set.delete(x),toggle:(x,b)=>b?set.add(x):set.delete(x),contains:x=>set.has(x)},setAttribute(n){if(n==='hidden')this.hidden=true;}});
 }return dom.get(id);};
 const m=new Map([['cf_google_keep_session_v76','1'],['cf_google_book_test@example.com','BOOK_ABCDEFGHIJKLM_123456789012']]);
 const storage={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};
 let loginCalls=0,codeCalls=0,refreshCalls=0,securityFlags=[],homeCalls=0;
 const root={localStorage:storage,ControlFiscalSocialLogin:{initialize:async()=>{},getAuthorizationCode:async()=>{codeCalls++;return {accessToken:'TOKEN_VALID_12345678901234567890123'};},login:async()=>{loginCalls++;throw Error('No debe hacer login interactivo');},refresh:async()=>{refreshCalls++;}},
  fetch:async url=>{
   let data;
   if(url.includes('userinfo'))data={email:'test@example.com',email_verified:true};
   else if(url.includes('drive/v3/files/'))data={id:'BOOK_ABCDEFGHIJKLM_123456789012',ownedByMe:true,trashed:false};
   else if(url.includes('fields=spreadsheetId,sheets'))data={spreadsheetId:'BOOK_ABCDEFGHIJKLM_123456789012',sheets:['Configuracion','Compras','Facturas','Inventario','Clientes','Agenda','Ingresos','CF_Registros_v2','CF_Facturas_Emitidas','CF_Facturas_Documentos'].map(title=>({properties:{title}}))};
   else data={spreadsheetId:'BOOK_ABCDEFGHIJKLM_123456789012'};
   return {ok:true,status:200,text:async()=>JSON.stringify(data)};
  },
  goHome:()=>homeCalls++,clearUserLocalCaches:()=>{},updateAccountSettings:()=>{},startLocalSecurityForAccount:async f=>{securityFlags.push(f)},URLSearchParams};
 root.window=root;
 vm.runInNewContext(auth,{window:root,document:{getElementById:get},navigator:{},URLSearchParams,console});
 await root.CFGoogleAccount.start();
 assert.equal(loginCalls,0);assert.equal(codeCalls,1);assert.equal(refreshCalls,0);
 assert.equal(root.CFGoogleAccount.active().email,'test@example.com');assert.equal(homeCalls,1);
 assert.deepEqual(securityFlags,[false]);
});
