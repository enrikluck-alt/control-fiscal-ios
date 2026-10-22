'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

test('Google A -> menú Inicio V76 -> cerrar sesión -> Google B -> menú Inicio V76',async()=>{
 const source=fs.readFileSync('www/cf-google-auth.js','utf8');
 const nodes=new Map();
 const getNode=id=>{
  if(!nodes.has(id)){
   const classes=new Set();
   nodes.set(id,{
    value:'',hidden:false,disabled:false,textContent:'',
    classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),contains:v=>classes.has(v),toggle:(v,on)=>on?classes.add(v):classes.delete(v)},
    setAttribute:(k,v)=>{if(k==='hidden')nodes.get(id).hidden=true;},
   });
  }
  return nodes.get(id);
 };
 getNode('accountGate');getNode('accountCreateBtn');getNode('accountStatus');getNode('accountGoogleBtn');
 const data=new Map();const storage={
  getItem:k=>data.has(k)?data.get(k):null,
  setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)
 };
 let user='a@example.com',homeCount=0,securityStarts=0,clearCount=0,logoutCount=0,hapticCount=0;
 const idA='TEST_GOOGLE_SHEET_ABCDEFGHIJKL_123456789', idB='TEST_GOOGLE_SHEET_BCDEFGHIJKLM_123456789';
 storage.setItem('cf_google_book_'+user,idA);storage.setItem('cf_google_book_b@example.com',idB);
 const urlData=(url)=>{
  if(url.includes('userinfo'))return {email:user,email_verified:true};
  if(url.includes('sheets.googleapis.com')&&url.includes('fields=spreadsheetId,sheets'))return {spreadsheetId:user==='a@example.com'?idA:idB,sheets:['Configuracion','Compras','Facturas','Inventario','Clientes','Agenda','Ingresos','CF_Registros_v2'].map(title=>({properties:{title}}))};
  if(url.includes('sheets.googleapis.com'))return {spreadsheetId:user==='a@example.com'?idA:idB};
  if(url.includes('/drive/v3/files')&&url.includes('/files/'))return {id:user==='a@example.com'?idA:idB,ownedByMe:true,trashed:false};
  if(url.includes('/drive/v3/files')&&url.includes('files?'))return {files:[]};
  throw Error('Solicitud inesperada: '+url);
 };
 const root={
  localStorage:storage,confirm:()=>true,
  fetch:async(url,opts)=>{
   assert.match(opts.headers.Authorization,/^Bearer /);
   const obj=urlData(url);
   return {ok:true,status:200,text:async()=>JSON.stringify(obj)};
  },
  ControlFiscalSocialLogin:{
   initialize:async()=>{},
   login:async()=>({result:{accessToken:'GOOGLE_TOKEN_123456789_ABCDEFGHIJKLMNOPQRSTUVWXYZ'}}),
   logout:async()=>{logoutCount++;},
  },
  CFHaptics:{impact:async()=>{hapticCount++;}},
  goHome:()=>{homeCount++;},
  startLocalSecurityForAccount:async()=>{
   securityStarts++;
   assert.ok(homeCount>=securityStarts,'La vista Inicio debe estar seleccionada antes de desbloquear');
   // Devuelve una promesa como securityStart de la aplicación.
  },
  clearUserLocalCaches:()=>{clearCount++;},
  lockSecurity:()=>{},
  updateAccountSettings:()=>{},
  URLSearchParams,
 };
 root.window=root;
 vm.runInNewContext(source,{window:root,document:{getElementById:getNode},navigator:{},URLSearchParams,console});
 await root.CFGoogleAccount.start();
 assert.ok(!getNode('accountGate').classList.contains('hidden'));
 await root.CFGoogleAccount.connect();
 assert.equal(root.CFGoogleAccount.active().email,'a@example.com');
 assert.equal(root.CFGoogleAccount.active().id,idA);
 assert.equal(homeCount,1);
 assert.equal(securityStarts,1);
 assert.ok(getNode('accountGate').classList.contains('hidden'));
 await root.CFGoogleAccount.logout();
 assert.equal(root.CFGoogleAccount.active(),null);
 assert.ok(!getNode('accountGate').classList.contains('hidden'));
 assert.equal(logoutCount,1);
 assert.equal(hapticCount,1);
 user='b@example.com';
 await root.CFGoogleAccount.connect();
 assert.equal(root.CFGoogleAccount.active().email,'b@example.com');
 assert.equal(root.CFGoogleAccount.active().id,idB);
 assert.equal(homeCount,3); // segundo goHome al salir, tercero al entrar con B
 assert.equal(securityStarts,2);
 assert.ok(getNode('accountGate').classList.contains('hidden'));
 assert.ok(clearCount>=2);
});
