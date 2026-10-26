'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'www/index.html'),'utf8');
const native=fs.readFileSync(path.join(root,'www/cf-r14-native.js'),'utf8');
const i18n=fs.readFileSync(path.join(root,'www/cf-i18n.js'),'utf8');
const workflow=fs.readFileSync(path.join(root,'.github/workflows/build-ios.yml'),'utf8');

test('R14: plugins y orientación entran realmente en el bundle iOS y son opcionales por usuario',()=>{
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 assert.match(pkg.dependencies['@capacitor/screen-orientation'],/^8\./);
 assert.match(fs.readFileSync(path.join(root,'google-login-entry.js'),'utf8'),/window.CFScreenOrientation = ScreenOrientation/);
 assert.match(workflow,/UISupportedInterfaceOrientations/);
 assert.match(workflow,/CFBundleLocalizations/);
 assert.match(workflow,/ScreenOrientation/);
 assert.match(html,/id="cfOrientationChoice"/);
 assert.match(html,/id="cfLanguageChoice"/);
 assert.match(native,/plugin\.unlock\(\)/);
 assert.match(native,/plugin\.lock\(\{orientation:'portrait'\}\)/);
});

test('R14: selector del idioma respeta el sistema y almacena la preferencia local, sin enviar datos fiscales a traductores',()=>{
 assert.match(i18n,/navigator\.languages/);
 assert.match(i18n,/root\.localStorage\.setItem\(STORE/);
 assert.doesNotMatch(i18n,/fetch\(|XMLHttpRequest|google\.translate/);
 for(const locale of ['en','fr','de','it','pt'])assert.match(i18n,new RegExp(' '+locale+':\\{'));
 assert.match(html,/cf-i18n\.js/);
});

test('R14: notificaciones nativas informan de permisos denegados en lugar de quedar esperando',async()=>{
 const raw={checkPermissions:async()=>({display:'denied'}),requestPermissions:async()=>({display:'denied'})};
 const global={CFLocalNotifications:raw,localStorage:{getItem:()=>null,setItem:()=>{}},Capacitor:{Plugins:{}}};
 const ctx={window:global,console,Promise,setTimeout,clearTimeout,WeakMap,Date,
  document:{readyState:'loading',addEventListener:()=>{},getElementById:()=>null}};
 vm.runInNewContext(native,ctx);
 await assert.rejects(global.cfEnsureNoticePermission(),/iOS no ha concedido las notificaciones/);
 const plugin=await global.nativeLocalNotifications();
 assert.equal((await plugin.checkPermissions()).display,'denied');
});

test('R14: plugin de notificaciones recupera la respuesta de solicitud cuando falla comprobación',async()=>{
 const nativePlugin={checkPermissions:async()=>{throw Error('falló checkPermissions');},requestPermissions:async()=>({display:'granted'})};
 const global={CFLocalNotifications:nativePlugin,localStorage:{setItem:()=>{},getItem:()=>null}};
 vm.runInNewContext(native,{window:global,console,Promise,setTimeout,clearTimeout,WeakMap,Date,document:{readyState:'loading',addEventListener:()=>{},getElementById:()=>null}});
 assert.equal(await global.cfEnsureNoticePermission(),await global.nativeLocalNotifications());
});

test('R14: visor dentro de la app tiene zoom reset e impresión mediante compartir PDF, sin abrir navegador para imprimir',()=>{
 for(const pattern of [/id="cfViewerViewport"/,/id="cfDocumentImage"/,/function cfDocumentZoom\(delta\)/,/function cfDocumentResetZoom\(\)/,/function cfDocumentPrint\(\)/,/CFShare/,/dialogTitle:'Selecciona Imprimir'/,/onclick="cfDocumentZoom\(-0\.25\)"/,/onclick="cfDocumentZoom\(0\.25\)"/])assert.match(html,pattern);
 assert.match(html,/#cfDocumentViewer \.cfDocumentImage\{object-fit:contain/);
});

test('R14: sugerencias no revelan al usuario el destinatario en la confirmación',()=>{
 assert.match(html,/Enviando sugerencia a los desarrolladores/);
 assert.match(html,/¿Enviar '\+kind\.toLowerCase\(\)\+' a los desarrolladores/);
 assert.match(html,/CFFeedback\.send/);
 assert.match(workflow,/ControlFiscal-V76-Google-R19-Firebase-Integrado-IPA/);
});
