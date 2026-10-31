'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=f=>fs.readFileSync(f,'utf8');
const html=read('www/index.html');
const authSource=read('www/cf-firebase-auth.js');
const feedbackSource=read('www/cf-feedback.js');
const navSource=read('www/cf-navigation.js');
const rules=read('firestore.rules');
const jwt=()=>`eyJhbGciOiJub25lIn0.${Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+900,email:'user@test.invalid'})).toString('base64url')}.signature`;
function setupFirebase({key='test_123456789012345',project='control-fiscal-test',idToken=jwt(),email='user@test.invalid',failCommit=false}={}){
 const requests=[];let calls=0;
 const root={
  CFFirebaseConfig:{apiKey:key,projectId:project},
  CFGoogleAccount:{active:()=>({id:'book-owned',email}),getSupportIdToken:async()=>idToken},
  navigator:{language:'es-ES'},Capacitor:{getPlatform:()=> 'ios'},
  crypto:{getRandomValues:ar=>{ar.fill(17);return ar}},
  fetch:async(url,opt)=>{
   requests.push({url,opt});calls++;
   if(url.includes('accounts:signInWithIdp'))return {ok:true,status:200,json:async()=>({email:'user@test.invalid',localId:'firebase-uid',idToken:'FIREBASE_SIGNED_ID_TOKEN',expiresIn:'3600'})};
   if(failCommit)return {ok:false,status:403,json:async()=>({error:{message:'Permission denied'}})};
   return {ok:true,status:200,json:async()=>({writeResults:[{updateTime:new Date().toISOString()}]})};
  }
 };
 const context={window:root,atob:v=>Buffer.from(v,'base64').toString('utf8'),URLSearchParams,AbortController,Uint8Array,setTimeout,clearTimeout};
 vm.runInNewContext(authSource,context);vm.runInNewContext(feedbackSource,context);
 return {root,requests,get calls(){return calls}};
}
test('R17: Google identity becomes Firebase Auth UID; fiscal access token is never exchanged',async()=>{
 const {root,requests}=setupFirebase();
 const user=await root.CFFirebaseAuth.ensureSignedIn();
 assert.equal(user.uid,'firebase-uid');assert.equal(user.idToken,'FIREBASE_SIGNED_ID_TOKEN');
 assert.match(requests[0].url,/accounts:signInWithIdp\?key=test_123456789012345/);
 const sent=JSON.parse(requests[0].opt.body);
 assert.ok(sent.postBody.includes('providerId=google.com'));
 assert.ok(sent.postBody.includes('id_token='));
 assert.doesNotMatch(requests[0].opt.body,/drive\.googleapis|spreadsheet|GOOGLE_ACCESS_TOKEN/);
 const again=await root.CFFirebaseAuth.ensureSignedIn();assert.equal(again.uid,'firebase-uid');assert.equal(requests.length,1);
});
test('R17: suggestion is created using Firebase ID token, server timestamp and create-only document',async()=>{
 const {root,requests}=setupFirebase();
 const result=await root.CFFeedback.send({kind:'Sugerencia',message:'Me gustaría mejorar la pantalla de Agenda.'});
 assert.ok(result.id.startsWith('cf_'));
 assert.equal(requests.length,2);
 const save=requests[1],obj=JSON.parse(save.opt.body);
 assert.match(save.url,/firestore\.googleapis\.com\/v1\/projects\/control-fiscal-test\/databases\/\(default\)\/documents:commit/);
 assert.equal(save.opt.headers.Authorization,'Bearer FIREBASE_SIGNED_ID_TOKEN');
 assert.equal(obj.writes[0].currentDocument.exists,false);
 assert.equal(obj.writes[0].updateTransforms[0].setToServerValue,'REQUEST_TIME');
 assert.match(obj.writes[0].update.name,/control_fiscal_sugerencias\/cf_/);
 assert.equal(obj.writes[0].update.fields.uid.stringValue,'firebase-uid');
 assert.equal(obj.writes[0].update.fields.estado.stringValue,'pendiente');
 assert.ok(!JSON.stringify(obj).includes('facturas'));
 assert.ok(!JSON.stringify(obj).includes('accessToken'));
});
test('R17: Firestore 403 is reported, not a false success',async()=>{
 const {root}=setupFirebase({failCommit:true});
 await assert.rejects(()=>root.CFFeedback.send({kind:'Error',message:'Las facturas no se muestran en el visor.'}),/Firestore HTTP 403/);
});
test('R17: email mismatch from Firebase prevents authentication',async()=>{
 const {root}=setupFirebase({email:'otro@test.invalid'});
 await assert.rejects(()=>root.CFFirebaseAuth.ensureSignedIn(),/no coincide/);
 assert.equal(root.CFFirebaseAuth.active(),null);
});
test('R17: disabled config never sends to Firebase',async()=>{
 const {root,requests}=setupFirebase({key:'',project:''});
 assert.equal(root.CFFirebaseAuth.configured(),false);
 await assert.rejects(()=>root.CFFirebaseAuth.ensureSignedIn(),/vinculado/);
 assert.equal(requests.length,0);
});
test('R17: Firestore rules only allow create own UID and deny every client read',()=>{
 assert.match(rules,/request\.resource\.data\.uid == request\.auth\.uid/);
 assert.match(rules,/request\.resource\.data\.fecha == request\.time/);
 assert.match(rules,/allow get, list: if isAdmin\(\)/);
 assert.match(rules,/request.auth.uid == 'REEMPLAZAR_UID_ADMIN'/);
 assert.match(rules,/allow delete: if false/);
 assert.match(rules,/match \/\{document=\*\*\} \{allow read, write: if false;/);
 assert.doesNotMatch(rules,/allow read: if true/);
});
function setupNotification({locked=false,account={id:'book-owned',email:'user@test.invalid'},owner='book-owned'}={}){
 const calls=[];let lockedNow=locked;
 const store=new Map();
 const sessionStorage={setItem:(k,v)=>store.set(k,v),getItem:k=>store.get(k)||null,removeItem:k=>store.delete(k)};
 const app={CFGoogleAccount:{active:()=>account}};
 const ctx={window:app,Date,console,sessionStorage,
  $:id=>id==='securityLock'||id==='accountGate'?{classList:{contains:()=>!lockedNow}}:null,
  agendaEvents:[{id:'EVENT-42',evento:'Montaje',fecha:'2026-11-02',ubicacion:'Albacete, España'}],
  cfAgendaLoaded:true,agendaMonthCursor:new Date(),
  only:id=>calls.push(['only',id]),nav:id=>calls.push(['nav',id]),renderAgenda:()=>calls.push(['render']),
  openAgendaEventModal:id=>calls.push(['openEvent',id]),openAgenda:()=>calls.push(['openAgenda']),
  showToastMessage:(...a)=>calls.push(['toast',...a]),
  nativeLocalNotifications:async()=>null,loadAgenda:async()=>{},setTimeout:()=>0,
  sessionStorage,console
 };
 const start=html.indexOf('// R17: al pulsar un aviso se abre SU ficha');
 const end=html.indexOf('function updatePendingDocuments(){',start);
 assert.ok(start>0&&end>start);
 vm.runInNewContext(html.slice(start,end),vm.createContext(ctx));
 return {ctx,calls,sessionStorage,owner,unlock:()=>{lockedNow=false}};
}
test('R17: notification opens matching agenda event and does not launch route automatically',()=>{
 const {ctx,calls}=setupNotification();
 ctx.cfStoreAgendaNotificationTap({kind:'agenda',eventId:'EVENT-42',ownerBookId:'book-owned'});
 assert.deepEqual(calls.find(c=>c[0]==='openEvent'),['openEvent','EVENT-42']);
 assert.deepEqual(calls.find(c=>c[0]==='only'),['only','agendaPage']);
 assert.ok(!calls.some(c=>c[0]==='openMap'));
 assert.match(html,/id="cfAgendaMapFrame"/);
 assert.match(html,/onclick="cfOpenAgendaRoute\('apple'\)"/);
 assert.match(html,/onclick="cfOpenAgendaRoute\('google'\)"/);
});
test('R17: notification waits for Face ID unlock and rejects another account',()=>{
 const t=setupNotification({locked:true});
 t.ctx.cfStoreAgendaNotificationTap({kind:'agenda',eventId:'EVENT-42',ownerBookId:'book-owned'});
 assert.equal(t.calls.length,0);
 t.unlock();t.ctx.cfTryOpenPendingAgendaNotification();
 assert.deepEqual(t.calls.find(c=>c[0]==='openEvent'),['openEvent','EVENT-42']);
 const other=setupNotification();other.ctx.cfStoreAgendaNotificationTap({kind:'agenda',eventId:'EVENT-42',ownerBookId:'other-book'});
 assert.equal(other.calls.length,0);
});
test('R17: swipe from left navigates backwards, ignoring vertical gestures and closing visible modals',()=>{
 const handlers={};let homeCount=0,modalClosed=0,shown='settingsPage';
 const el=(id)=>({hidden:false,classList:{contains:v=>id==='accountGate'||id==='securityLock'?v==='hidden':id!==shown&&v==='hidden'}});
 const modal={id:'agendaEventModal',hidden:false,classList:{contains:()=>false},querySelector:()=>({click:()=>modalClosed++})};
 let showModal=false;
 const document={addEventListener:(key,fn)=>handlers[key]=fn,getElementById:id=>el(id),querySelectorAll:()=>showModal?[modal]:[]};
 const window={goHome:()=>homeCount++};
 vm.runInNewContext(navSource,{window,document,Date});
 const move=(startX,endX,startY=150,endY=150)=>{
  handlers.touchstart({touches:[{clientX:startX,clientY:startY}],target:{closest:()=>null}});
  handlers.touchend({changedTouches:[{clientX:endX,clientY:endY}]});
 };
 move(18,135);assert.equal(homeCount,1);
 move(18,135,100,230);assert.equal(homeCount,1);
 move(90,230);assert.equal(homeCount,1);
 showModal=true;move(15,120);assert.equal(modalClosed,1);assert.equal(homeCount,1);
});
test('R17: iOS build includes Firebase bridge, navigation module and changed build marker',()=>{
 const w=read('.github/workflows/build-ios.yml');
 for(const script of ['cf-firebase-config.js','cf-firebase-auth.js','cf-navigation.js']){
  assert.match(html,new RegExp(`<script src="${script.replace('.','\\.')}"></script>`));
  assert.ok(w.includes(script));
 }
 assert.match(w,/UI76-20261031-R29/);
 assert.match(html,/cfTryOpenPendingAgendaNotification\(\)/);
});

test('R17: swipe in settings goes back one level; documents use their own folder back',()=>{
 const handlers={};let settingsBack=0,docBack=0,home=0,shown='settingsPage';
 const element=id=>({hidden:false,classList:{contains:v=>id==='accountGate'||id==='securityLock'?v==='hidden':id!==shown&&v==='hidden'}});
 const root={goHome:()=>home++,cfSettingsBack:()=>settingsBack++,CFDocuments:{back:()=>docBack++}};
 const document={addEventListener:(type,fn)=>handlers[type]=fn,getElementById:element,querySelectorAll:()=>[]};
 vm.runInNewContext(navSource,{window:root,document,Date});
 const swipe=()=>{handlers.touchstart({touches:[{clientX:12,clientY:100}],target:{closest:()=>null}});handlers.touchend({changedTouches:[{clientX:120,clientY:102}]});};
 swipe();assert.equal(settingsBack,1);assert.equal(home,0);
 shown='documentsPage';swipe();assert.equal(docBack,1);assert.equal(home,0);
 shown='formPage';swipe();assert.equal(home,1);
});
test('R17: old notifications without explicit owner cannot open another account',()=>{
 const {ctx,calls}=setupNotification();
 ctx.cfStoreAgendaNotificationTap({kind:'agenda',eventId:'EVENT-42'});
 assert.equal(calls.length,0);
});
