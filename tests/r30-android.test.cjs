'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('R30: la version Android utiliza el mismo paquete fiscal y Capacitor 8',()=>{
 const pkg=JSON.parse(read('package.json'));
 const cap=JSON.parse(read('capacitor.config.json'));
 assert.equal(pkg.dependencies['@capacitor/android'],'8.5.2');
 assert.equal(pkg.dependencies['@capacitor/core'],'8.5.2');
 assert.equal(cap.appId,'com.chispassound.controlfiscal');
 assert.equal(cap.webDir,'www');
});
test('R30: inicio de sesión distingue iOS y Android y exige ID OAuth WEB',()=>{
 const auth=read('www/cf-google-auth.js');
 assert.match(auth,/platform === 'android'/);
 assert.match(auth,/root\.CFAndroidGoogleConfig\?\.webClientId/);
 assert.match(auth,/webClientId,mode:'online'/);
 assert.match(auth,/iOSClientId:CLIENT_ID,mode:'online'/);
 assert.ok(read('www/index.html').includes('<script src="cf-android-config.js"></script>'));
 const cfg=read('www/cf-android-config.js');
 assert.doesNotMatch(cfg,/private_key|client_secret|BEGIN PRIVATE KEY/i);
});
test('R30: pipeline genera APK y SHA1 y NO modifica el workflow de iOS',()=>{
 const y=read('.github/workflows/build-android.yml');
 assert.match(y,/npx cap add android/);
 assert.match(y,/npm run patch:android/);
 assert.match(y,/assembleDebug/);
 assert.match(y,/ANDROID_SHA1_PRUEBAS/);
 assert.match(read('.github/workflows/build-ios.yml'),/Build unsigned iOS IPA/);
});
test('R30: Android configura permisos y Google nativo sin acceso completo a contactos',()=>{
 const patch=read('tools/patch-android.cjs');
 assert.match(patch,/POST_NOTIFICATIONS/);
 assert.match(patch,/MainActivity\.java/);
 assert.match(patch,/ModifiedMainActivityForSocialLoginPlugin/);
 assert.doesNotMatch(patch,/android\.permission\.READ_CONTACTS/);
});
