/* Control Fiscal R17. Puente Google OAuth nativo -> Firebase Authentication.
   ID tokens en memoria, sin credenciales de Drive/Sheets ni tokens persistentes. */
(function(root){'use strict';
 let state=null, pending=null, generation=0;
 const notify=()=>{try{root.cfUpdateFirebaseStatus?.()}catch(_){}};
 const cfg=()=>root.CFFirebaseConfig||{};
 const configured=()=>/^[-\w]{5,100}$/.test(String(cfg().projectId||'')) && /^[\w-]{15,200}$/.test(String(cfg().apiKey||''));
 const problem=()=> 'Firebase todavía no está vinculado a esta compilación. Configura apiKey y projectId en cf-firebase-config.js, activa el proveedor Google en Firebase Authentication y recompila.';
 const err=e=>String(e?.message||e||'Error');
 function clear(){generation++;state=null;pending=null;notify();}
 function active(){const acc=root.CFGoogleAccount?.active();return state && acc?.email===state.email && acc?.id?{uid:state.uid,email:state.email}:null;}
 function jwtValid(value){
  if(typeof value!=='string'||value.length>6000||value.split('.').length!==3)return false;
  try{const payload=JSON.parse(atob(value.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));return Number(payload.exp||0)>Date.now()/1000+60;}
  catch{return false;}
 }
 async function exchange(googleIdToken,account){
  if(!configured())throw Error(problem());
  if(!jwtValid(googleIdToken))throw Error('La identidad de Google no es válida o está caducada. Vuelve a iniciar sesión.');
  const key=cfg().apiKey;
  const response=await root.fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key='+encodeURIComponent(key),{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({requestUri:'http://localhost',postBody:new URLSearchParams({id_token:googleIdToken,providerId:'google.com'}).toString(),returnSecureToken:true})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error('Firebase Authentication: '+String(data.error?.message||'Error '+response.status).slice(0,200)+'. Comprueba que Google esté habilitado como proveedor.');
  const email=String(data.email||'').trim().toLowerCase();
  if(!data.localId||!data.idToken||email!==account.email)throw Error('La cuenta devuelta por Firebase no coincide con la de Google. No se ha autorizado el acceso.');
  return {uid:data.localId,idToken:data.idToken,email,expiresAt:Date.now()+(Number(data.expiresIn||3600)-90)*1000};
 }
 async function signInWithGoogleIdToken(jwt,account){
  if(!configured())throw Error(problem());
  const current=account||root.CFGoogleAccount?.active();
  if(!current?.email)throw Error('Inicia sesión con Google antes de enlazar Firebase.');
  const expected={email:String(current.email).toLowerCase(),id:current.id||''};
  if(state?.email===expected.email&&state.expiresAt>Date.now()+60000)return active();
  if(pending)return pending;
  const epoch=generation;
  pending=(async()=>{
   const next=await exchange(jwt,expected);
   const now=root.CFGoogleAccount?.active();
   // Si aún estamos eligiendo libro se acepta únicamente la cuenta validada.
   if(epoch!==generation || (now?.email&&now.email!==expected.email))throw Error('La cuenta ha cambiado durante Firebase Authentication.');
   state=next;notify();return {uid:next.uid,email:next.email};
  })();
  try{return await pending;}finally{pending=null;}
 }
 async function ensureSignedIn(){
  if(!configured())throw Error(problem());
  const acc=root.CFGoogleAccount?.active();
  if(!acc?.id||!acc.email)throw Error('Inicia sesión con Google y abre tu libro antes de enviar sugerencias.');
  if(active()&&state.expiresAt>Date.now()+60000)return {uid:state.uid,idToken:state.idToken};
  if(pending){await pending;if(active())return {uid:state.uid,idToken:state.idToken};}
  // El plugin social es la única fuente de identidad: nunca usar access token de Drive como ID token.
  const jwt=await root.CFGoogleAccount.getSupportIdToken();
  await signInWithGoogleIdToken(jwt,acc);
  if(!active())throw Error('No se ha podido autenticar Firebase para la cuenta activa.');
  return {uid:state.uid,idToken:state.idToken};
 }
 root.CFFirebaseAuth=Object.freeze({configured,active,clear,signInWithGoogleIdToken,ensureSignedIn});
})(window);
