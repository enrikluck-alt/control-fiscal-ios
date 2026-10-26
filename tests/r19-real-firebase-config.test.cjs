'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const context={window:{}};
vm.runInNewContext(read('www/cf-firebase-config.js'),context);
const config=context.window.CFFirebaseConfig;
const oauth=JSON.parse(read('oauth-config.json'));
const token=()=>`eyJhbGciOiJub25lIn0.${Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+600})).toString('base64url')}.sig`;

test('R19 Firebase configurado con el mismo proyecto que el OAuth iOS existente',()=>{
  assert.equal(config.projectId,'control-fiscal-511118');
  assert.equal(config.authDomain,config.projectId+'.firebaseapp.com');
  assert.equal(config.messagingSenderId,'429272495544');
  assert.equal(config.appId.startsWith('1:429272495544:web:'),true);
  assert.match(config.apiKey,/^AIza[\w-]{20,}$/);
  assert.equal(oauth.iosClientId.startsWith(config.messagingSenderId+'-'),true);
  assert.equal(Object.isFrozen(config),true);
});

test('R19 no añade Firebase Analytics ni credenciales privadas',()=>{
  const contents=read('www/cf-firebase-config.js')+read('www/index.html');
  assert.doesNotMatch(contents,/getAnalytics\s*\(/);
  assert.doesNotMatch(read('www/cf-firebase-config.js'),/private_key|client_secret|refresh_token|BEGIN PRIVATE KEY/);
  assert.match(read('www/index.html'),/data-cf-ui-build="UI76-20261026-R19"/);
});

test('R19 sugerencia usa este proyecto, Google ID token para Firebase y uid del cliente',async()=>{
  const requests=[];
  const win={CFFirebaseConfig:config,crypto:{getRandomValues:buffer=>buffer.fill(37)},
    CFGoogleAccount:{active:()=>({id:'solo-este-libro',email:'tester@example.com'}),getSupportIdToken:async()=>token()},
    fetch:async (url,options)=>{
      requests.push({url,options});
      if(url.includes('signInWithIdp'))return {ok:true,status:200,json:async()=>({email:'tester@example.com',localId:'uid-firebase',idToken:'TOKEN_FIREBASE',expiresIn:'3600'})};
      return {ok:true,status:200,json:async()=>({writeResults:[{updateTime:'2026-10-26T12:00:00Z'}]})};
    }
  };
  const js={window:win,atob:v=>Buffer.from(v,'base64url').toString(),URLSearchParams,AbortController,Uint8Array,setTimeout,clearTimeout};
  vm.runInNewContext(read('www/cf-firebase-auth.js'),js);
  vm.runInNewContext(read('www/cf-feedback.js'),js);
  assert.equal(win.CFFirebaseAuth.configured(),true);
  const result=await win.CFFeedback.send({kind:'Sugerencia',message:'Me gustaría un nuevo informe automático.'});
  assert.match(result.id,/^cf_/);
  assert.equal(requests.length,2);
  assert.match(requests[0].url,/identitytoolkit\.googleapis\.com\/v1\/accounts:signInWithIdp/);
  assert.equal(JSON.parse(requests[0].options.body).requestUri,'http://localhost');
  assert.ok(requests[1].url.includes(config.projectId));
  assert.equal(requests[1].options.headers.Authorization,'Bearer TOKEN_FIREBASE');
  const commit=JSON.parse(requests[1].options.body);
  assert.equal(commit.writes[0].update.fields.uid.stringValue,'uid-firebase');
  assert.equal(commit.writes[0].update.fields.tipo.stringValue,'Sugerencia');
  assert.equal(commit.writes[0].update.fields.estado.stringValue,'pendiente');
  assert.equal(commit.writes[0].currentDocument.exists,false);
  assert.equal(commit.writes[0].updateTransforms[0].setToServerValue,'REQUEST_TIME');
  assert.doesNotMatch(JSON.stringify(commit),/spreadsheet|factura|drive|inventario/i);
});

test('R19 requiere publicación de reglas compatibles con tipos de la app',()=>{
  const r=read('firestore.rules');
  for(const type of ['Sugerencia','Error','Consulta'])assert.ok(r.includes("'"+type+"'"));
  assert.ok(r.includes('request.resource.data.uid == request.auth.uid'));
  assert.ok(r.includes('request.resource.data.fecha == request.time'));
  assert.match(r,/allow get, list, update, delete: if false/);
});

test('R19 compilación verifica el config y etiqueta su propio artefacto',()=>{
  const w=read('.github/workflows/build-ios.yml');
  assert.match(w,/Comprobar configuración pública Firebase/);
  assert.match(w,/projectId:.*control-fiscal-511118/);
  assert.match(w,/ControlFiscal-V76-Google-R19-Firebase-Integrado-IPA/);
  assert.match(w,/ControlFiscal_V76_Google_R19_Firebase_Config_Real\.ipa/);
});
