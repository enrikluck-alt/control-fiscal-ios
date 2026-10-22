/* Control Fiscal V76: única puerta de acceso Google. No crea formularios fiscales. */
(function (root) {
'use strict';
const CLIENT_ID='429272495544-72rmbs21hjds0fqb2hjlskbojr6gmi4g.apps.googleusercontent.com';
const SCOPES=['openid','email','profile','https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/drive.metadata.readonly','https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/calendar.events','https://www.googleapis.com/auth/gmail.send'];
const BOOK_NAME='Control Fiscal - Datos fiscales';
const TABS=['Configuracion','Compras','Facturas','Inventario','Clientes','Agenda','Ingresos','CF_Registros_v2','CF_Facturas_Emitidas','CF_Facturas_Documentos'];
const LAST_BOOK='cf_google_book_by_email_v76';
const PERSIST='cf_google_keep_session_v76';
let session=null,initialized=false,initInFlight=null,connecting=false,epoch=0,accessMode='login';
const element=id=>document.getElementById(id);
const status=(m,ok=false)=>{const e=element('accountStatus');if(e){e.textContent=m;e.classList.toggle('ok',ok);}};
const err=e=>String(e&&e.message||e||'Error desconocido');
function active(){return session&&session.token&&session.email&&session.id?{...session}:null;}
function clear(){epoch++;session=null;}
function cacheKey(email){return 'cf_google_book_'+email.toLowerCase();}
function normalize(raw){let d=raw;if(typeof d==='string'){try{d=JSON.parse(d)}catch{d={raw:d.slice(0,150)}}}return d||{};}
async function http(url,method='GET',data,tokenOverride){
 const token=tokenOverride||session?.token;
 if(!token)throw Error('Inicia sesión con Google para continuar.');
 // HTTP del WebView: evitamos CapacitorHttp.request, implicado en cierres
 // nativos previos de URLSession. Google APIs admiten CORS con OAuth Bearer.
 const headers={Authorization:'Bearer '+token,Accept:'application/json'};
 if(data!==undefined)headers['Content-Type']='application/json';
 let response;try{response=await root.fetch(url,{method,headers,...(data===undefined?{}:{body:JSON.stringify(data)})});}
 catch(e){throw Error('Error de conexión HTTPS con Google (verifica Internet y permisos): '+err(e).slice(0,160));}
 const body=normalize(await response.text());
 if(!response.ok){
  const desc=String(body.error?.message||body.message||body.raw||'sin detalle').slice(0,260);
  throw Error('Google HTTP '+response.status+': '+desc);
 }
 return body;
}
function bookId(text){const s=String(text||'').trim(), m=s.match(/\/spreadsheets\/d\/([\w-]+)/);const id=m?m[1]:s;return /^[\w-]{20,}$/.test(id)?id:null;}
async function init(){
 if(initialized)return;
 if(initInFlight)return initInFlight;
 initInFlight=(async()=>{
  const plugin=root.ControlFiscalSocialLogin;
  if(!plugin)throw Error('El módulo nativo de inicio de sesión no está instalado.');
  await plugin.initialize({google:{iOSClientId:CLIENT_ID,mode:'online'}});
  initialized=true;
 })();
 try{await initInFlight;}finally{initInFlight=null;}
}
function getToken(response){
 const possible=[response?.result?.accessToken,response?.accessToken,response?.result?.authentication?.accessToken];
 for(const raw of possible){const t=typeof raw==='string'?raw:raw?.token;if(typeof t==='string'&&t.length>20)return t;}
 return null;
}
async function verify(token){
 const info=await http('https://www.googleapis.com/oauth2/v3/userinfo','GET',undefined,token);
 if(!info.email_verified||!info.email)throw Error('Google no ha verificado el correo de la cuenta.');
 return String(info.email).toLowerCase();
}
async function metadata(token,id){
 // Verificar Sheets Y propiedad del archivo antes de permitir acceso.
 const sheet=await http('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(id)+'?fields=spreadsheetId','GET',undefined,token);
 if(sheet.spreadsheetId!==id)throw Error('Google Sheets no ha confirmado el libro solicitado.');
 const file=await http('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?fields=id,name,ownedByMe,trashed','GET',undefined,token);
 if(file.ownedByMe!==true||file.trashed)throw Error('El libro no pertenece a la cuenta de Google activa. Selecciona uno propio.');
 return sheet;
}
async function discover(token){
 // Metadata scope is needed to find pre-existing V76 workbooks not created by this OAuth client.
 const files=[];let page='';
 for(let n=0;n<10;n++){
  const q="mimeType='application/vnd.google-apps.spreadsheet' and trashed=false and (name contains 'Control Fiscal' or name contains 'Control fiscal')";
  const params=new URLSearchParams({q,fields:'nextPageToken,files(id,name,mimeType,createdTime,ownedByMe)',pageSize:'100'});
  if(page)params.set('pageToken',page);
  const r=await http('https://www.googleapis.com/drive/v3/files?'+params,'GET',undefined,token);
  files.push(...(r.files||[]).filter(f=>f.ownedByMe===true));page=r.nextPageToken||'';if(!page)break;
 }
 const unique=[...new Map(files.map(f=>[f.id,f])).values()];
 return unique;
}
async function prepare(token,id){
 const book=await http('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(id)+'?fields=spreadsheetId,sheets(properties(sheetId,title))','GET',undefined,token);
 const names=new Set((book.sheets||[]).map(s=>s.properties?.title));const requests=[];
 for(const title of TABS)if(!names.has(title))requests.push({addSheet:{properties:{title}}});
 if(requests.length){await http('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(id)+':batchUpdate','POST',{requests},token);}
 return true;
}
async function useBook(token,email,id,fromInteractiveLogin=false){
 const guard=epoch;
 await metadata(token,id);
 await prepare(token,id);
 if(guard!==epoch)throw Error('Se ha cancelado la conexión porque la sesión cambió.');
 const previous=root.localStorage.getItem('cf_last_account_email_v76')||'';
 if(previous!==email&&typeof root.clearUserLocalCaches==='function')root.clearUserLocalCaches();
 // Never share the previous user's local cached records.
 root.localStorage.setItem('cf_last_account_email_v76',email);
 root.localStorage.setItem(PERSIST,element('accountKeepSession')?.checked?'1':'0');
 root.localStorage.setItem('cf_account_email_v76',email);
 root.localStorage.setItem('cf_account_sheet_url_v76','https://docs.google.com/spreadsheets/d/'+id+'/edit');
 root.localStorage.setItem(cacheKey(email),id);
 session={token,email,id};
 if(typeof root.updateAccountSettings==='function')root.updateAccountSettings();
 // Restaurar exactamente la navegación de V76. No debemos reabrir la última
 // ventana (Ajustes, Compras, etc.) después de cambiar de usuario.
 if(typeof root.goHome==='function')root.goHome();
 element('accountCreateBtn')?.setAttribute('hidden','');
 status('Cuenta y libro verificados. Abriendo Inicio…',true);
 try {
   // securityStart muestra inmediatamente el bloqueo con PIN/Face ID. Solo
   // ocultamos el acceso Google una vez que el bloqueo está inicializado.
   const securityReady=root.startLocalSecurityForAccount(fromInteractiveLogin);
   element('accountGate')?.classList.add('hidden');
   await securityReady;
 } catch (error) {
   // Si el bloqueo no puede arrancar, NUNCA mostrar datos fiscales sin acceso.
   clear();
   if(typeof root.lockSecurity==='function')root.lockSecurity();
   element('accountGate')?.classList.remove('hidden');
   status('No se ha podido iniciar la protección de la aplicación: '+err(error));
 }
}
async function connect(automatic=false){
 if(connecting)return;connecting=true;
 const guard=epoch;
 const login=element('accountGoogleBtn');if(login)login.disabled=true;
 try{
  status(automatic?'Restableciendo sesión de Google…':'Abriendo Google…');
  await init();const plugin=root.ControlFiscalSocialLogin;
  let response;
  if(automatic){
   // On iOS the plugin can keep native credentials while its refresh() method
   // returns void. Retrieve the existing authorization first, without a picker.
   let cached;
   if(typeof plugin.getAuthorizationCode==='function'){
    try{cached=await plugin.getAuthorizationCode({provider:'google'});}catch(e){console.info('Autorización local no recuperable; comprobando Google',err(e));}
   }
   if(!getToken(cached)&&typeof plugin.refresh==='function'){
    try{const result=await plugin.refresh({provider:'google'});cached=getToken(result)?result:cached;}catch(e){console.info('Renovación local no disponible',err(e));}
    if(!getToken(cached)&&typeof plugin.getAuthorizationCode==='function'){
      try{cached=await plugin.getAuthorizationCode({provider:'google'});}catch(e){console.info('Token no disponible tras renovar',err(e));}
    }
   }
   if(!getToken(cached)){
      // A reconnect is not proof that the user's Google session expired.
      throw Error('No se ha podido recuperar la autorización de Google de forma automática. Pulsa INICIAR SESIÓN para reconectar tu cuenta. Tu libro no se ha borrado.');
   }
   response=cached;
  }else{response=await plugin.login({provider:'google',options:{scopes:SCOPES,forcePrompt:false}});}
  const token=getToken(response);
  if(!token){throw Error('No hay autorización vigente de Google. Pulsa iniciar sesión para renovarla.');}
  const email=await verify(token);
  const hint=String(element('accountEmailHint')?.value||'').trim().toLowerCase();
  if(!automatic&&hint&&email!==hint){
    try{await plugin.logout({provider:'google'});}catch{}
    throw Error('Has elegido '+email+', pero escribiste '+hint+'. Elige la cuenta indicada o borra el correo opcional.');
  }
  if(guard!==epoch)throw Error('La sesión cambió durante la verificación.');
  status('Cuenta verificada: '+email+'. Buscando libro existente…');
  const stored=bookId(root.localStorage.getItem(cacheKey(email)));
  if(stored){try{await useBook(token,email,stored,!automatic);return;}catch(e){console.warn('Libro anterior inaccesible',e);root.localStorage.removeItem(cacheKey(email));}}
  let candidates=[];
  try{candidates=await discover(token);}
  catch(e){
   session={token,email,id:null};
   element('accountExistingBookField').hidden=false;
   status('Cuenta '+email+' verificada. No puedo buscar automáticamente libros en Drive ('+err(e)+'). Pega el enlace de tu Google Sheets existente.');
   return;
  }
  if(candidates.length===1){await useBook(token,email,candidates[0].id,!automatic);return;}
  // Account verified, but no workbook bound: keep the access gate until chosen.
  session={token,email,id:null};
  const existing=element('accountExistingBookField');if(existing)existing.hidden=false;
  if(candidates.length>1){
   status('Encontrados '+candidates.length+' libros de Control Fiscal. Pega el enlace del que quieres abrir para evitar mezclar datos.');
  }else{
   const b=element('accountCreateBtn');if(b)b.hidden=false;
   status('Cuenta '+email+' verificada. No se encontró un libro. Puedes crearlo o pegar el enlace de uno existente.');
  }
 }catch(e){
  status(err(e));
  if(!session?.id){clear();}
 }finally{connecting=false;if(login)login.disabled=false;}
}
async function openExisting(){
 try{
  const s=session;if(!s?.token||!s.email)throw Error('Inicia sesión con Google antes de seleccionar un libro.');
  const id=bookId(element('accountExistingBook')?.value);if(!id)throw Error('Pega la URL o ID de un Google Sheets válido.');
  status('Verificando acceso al libro…');await useBook(s.token,s.email,id);
 }catch(e){status(err(e));}
}
async function createBook(){
 const b=element('accountCreateBtn');if(b)b.disabled=true;
 try{
  const s=session;if(!s?.token||!s.email)throw Error('Primero verifica la cuenta con Google.');
  const existing=await discover(s.token);
  if(existing.length)throw Error('Google ha encontrado libros existentes. Selecciona uno antes de crear otro.');
  if(!root.confirm('No aparece ningún Control Fiscal existente. ¿Crear un libro nuevo en tu Google Drive?'))return;
  status('Creando libro personal…');
  const file=await http('https://www.googleapis.com/drive/v3/files?fields=id,name','POST',{name:BOOK_NAME,mimeType:'application/vnd.google-apps.spreadsheet',appProperties:{controlFiscalVersion:'76-google'}},s.token);
  if(!file.id)throw Error('Google no ha devuelto un ID. Revisa Drive antes de volver a crear un libro.');
  root.localStorage.setItem(cacheKey(s.email),file.id);
  await useBook(s.token,s.email,file.id);
 }catch(e){status(err(e));}finally{if(b)b.disabled=false;}
}
async function logout(){
 try{await root.CFHaptics?.impact({style:'Light'});}catch{try{navigator.vibrate?.(35);}catch{}}
 if(!root.confirm('¿Quieres cerrar la sesión de Google y volver a la pantalla de acceso?'))return;
 clear();
 const plugin=root.ControlFiscalSocialLogin;
 let warning='';
 try{if(plugin&&typeof plugin.logout==='function')await plugin.logout({provider:'google'});}catch(e){warning='Google no confirmó el cierre nativo: '+err(e);}
 root.localStorage.removeItem('cf_account_session_token_v76');
 root.localStorage.removeItem('cf_account_email_v76');root.localStorage.removeItem('cf_account_sheet_url_v76');
 if(typeof root.clearUserLocalCaches==='function')root.clearUserLocalCaches();
 if(typeof root.lockSecurity==='function')root.lockSecurity();
 if(typeof root.goHome==='function')root.goHome();
 element('accountExistingBookField')?.setAttribute('hidden','');
 element('accountCreateBtn')?.setAttribute('hidden','');
 element('accountGate')?.classList.remove('hidden');
 if(element('accountExistingBook'))element('accountExistingBook').value='';
 status(warning||'Sesión cerrada. Inicia sesión con otra cuenta de Google.',!warning);
}
function setAccessMode(mode){
 accessMode=mode==='create'?'create':'login';
 element('accountModeLogin')?.classList.toggle('active',accessMode==='login');
 element('accountModeCreate')?.classList.toggle('active',accessMode==='create');
 if(element('accountGoogleBtn'))element('accountGoogleBtn').hidden=accessMode==='create';
 if(element('accountSignupBtn'))element('accountSignupBtn').hidden=accessMode!=='create';
 status(accessMode==='create'?'Crearás la cuenta en Google dentro de una ventana segura. Al finalizar vuelve aquí e inicia sesión.':'Elige una cuenta de Google existente.');
}
async function createGoogleAccount(){
 const url='https://accounts.google.com/signup';
 try{
  if(!root.CFBrowser?.open)throw Error('No está disponible la ventana de registro Google dentro de la aplicación.');
  await root.CFBrowser.open({url,presentationStyle:'fullscreen'});
  setAccessMode('login');
  status('Cuando termines de crear tu cuenta, cierra la ventana de Google y pulsa INICIAR SESIÓN.');
 }catch(e){status('No se ha podido abrir el registro de Google: '+err(e));}
}
async function start(){
 root.localStorage.removeItem('cf_account_session_token_v76');
 if(typeof root.clearUserLocalCaches==='function')root.clearUserLocalCaches();
 element('accountGate')?.classList.remove('hidden');
 element('securityLock')?.classList.add('hidden');
 setAccessMode('login');
 const keep=root.localStorage.getItem(PERSIST)==='1';
 if(element('accountKeepSession'))element('accountKeepSession').checked=keep;
 status('Inicia sesión con Google para abrir tu Control Fiscal.');
 // Initialize native Google once at the beginning, concurrently with UI paint.
 const warmup=init().catch(e=>console.warn('Google no se pudo precargar',err(e)));
 if(keep){
   status('Comprobando si tu sesión de Google sigue abierta…');
   // El arranque visual ya está listo antes de ejecutar la renovación del token.
   await warmup;
   if(!session&&!connecting)await connect(true);
 }
}
root.CFGoogleAccount=Object.freeze({start,connect,setAccessMode,createGoogleAccount,openExisting,createBook,logout,active,http,bookId,clear,discover,prepare});
})(window);
