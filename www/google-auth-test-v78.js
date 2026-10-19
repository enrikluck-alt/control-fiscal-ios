/* Recuperación V78 sin crear archivos nuevos. */
(function(){'use strict';
const clientId='429272495544-72rmbs21hjds0fqb2hjlskbojr6gmi4g.apps.googleusercontent.com';
const scopes=['openid','email','profile','https://www.googleapis.com/auth/drive.file'];
const gate=document.createElement('div');gate.id='cf-google-test-gate';
gate.innerHTML='<div class="panel"><h2>Control Fiscal V78</h2><p>Lectura y escritura de prueba (no crea otro libro)</p><label for="cf-existing-id">ID o enlace de la hoja existente</label><input id="cf-existing-id" type="text" autocomplete="off" spellcheck="false" placeholder="Pega aquí la URL de Google Sheets" style="display:block;width:100%;box-sizing:border-box;margin:12px 0;padding:12px;color:#111;background:#fff;border-radius:8px"><button id="cf-auto-find">Buscar mi libro automáticamente</button> <button id="cf-auto-create">Crear solo si no existe</button><div style="margin-top:12px"><button id="cf-inspect">Comprobar libro</button> <button id="cf-repair">Configurar 7 pestañas</button></div><div style="margin:12px 0;padding:10px;border:1px solid #888;border-radius:8px"><strong>Cuenta Google activa</strong><p id="cf-active-account">Sin verificar</p><button id="cf-login-account">Iniciar sesión / elegir cuenta</button> <button id="cf-logout-account">Cerrar sesión y cambiar cuenta</button></div><div style="margin-top:14px"><button id="cf-write-test">Guardar y leer prueba</button> <button id="cf-read-test">Verificar lectura</button></div><p class="small" id="cf-google-result">Primero pulsa Comprobar libro. Solo después configura las pestañas.</p></div>';
document.body.appendChild(gate);
const input=document.getElementById('cf-existing-id');const msg=document.getElementById('cf-google-result');
const buttons=['cf-inspect','cf-repair','cf-write-test','cf-read-test','cf-auto-find','cf-auto-create','cf-login-account','cf-logout-account'].map(id=>document.getElementById(id));
const show=s=>{msg.textContent=s;};
let token=null;let verifiedId=null;let activeEmail=null;let authPromise=null;let busy=false;
const accountEl=document.getElementById('cf-active-account');
const social=()=>window.ControlFiscalSocialLogin;
function resetSession(){token=null;verifiedId=null;activeEmail=null;authPromise=null;input.value='';accountEl.textContent='Sin sesión verificada';}
async function nativeUserinfo(t){
 const http=window.CapacitorHttpNative;
 if(!http||typeof http.request!=='function')throw Error('HTTP nativo no disponible');
 const r=await http.request({url:'https://www.googleapis.com/oauth2/v3/userinfo',method:'GET',headers:{Authorization:'Bearer '+t,Accept:'application/json'}});
 let data=r.data;if(typeof data==='string'){try{data=JSON.parse(data)}catch{data={}}}
 if(r.status!==200||!data||typeof data.email!=='string'||!data.email_verified)throw Error('No se pudo verificar la cuenta Google (HTTP '+r.status+')');
 return data.email;
}
async function exclusive(fn){
 if(busy)return;busy=true;buttons.forEach(b=>b.disabled=true);
 try{await fn();}catch(e){show('Error: '+String(e?.message||e).slice(0,850));}
 finally{busy=false;buttons.forEach(b=>b.disabled=false);}
}

async function auth(){
 if(token&&activeEmail)return token;
 if(authPromise)return authPromise;
 authPromise=(async()=>{
  if(!window.Capacitor||window.Capacitor.getPlatform()!=='ios')throw Error('Requiere iOS');
  const plugin=social();if(!plugin||!window.ControlFiscalDriveV78)throw Error('Falta módulo SocialLogin/Drive');
  await plugin.initialize({google:{iOSClientId:clientId,mode:'online'}});
  const response=await plugin.login({provider:'google',options:{scopes}});
  const raw=response?.result?.accessToken;
  const t=typeof raw==='string'?raw:raw?.token;
  if(typeof t!=='string'||t.length<20)throw Error('No se recibió token OAuth');
  // Validate the actual bearer against Google before binding any spreadsheet ID.
  const email=await nativeUserinfo(t);
  token=t;activeEmail=email;accountEl.textContent=email;
  return token;
 })();
 try{return await authPromise;}catch(e){resetSession();throw e;}finally{authPromise=null;}
}
async function signIn(){await exclusive(async()=>{show('Verificando cuenta Google…');await auth();show('Cuenta Google conectada: '+activeEmail+'\nAhora puedes buscar su libro automáticamente.');});}
async function signOut(){await exclusive(async()=>{
 show('Cerrando sesión Google…');
 const plugin=social();let warning='';
 try{if(plugin&&typeof plugin.logout==='function')await plugin.logout({provider:'google'});
 else warning='El plugin no dispone de cierre de sesión nativo.';
 }catch(e){warning='Google no confirmó el cierre de sesión: '+String(e?.message||e).slice(0,180);}
 resetSession();
 show(warning?warning+'\nSe han limpiado las referencias locales. No continúes con otra cuenta hasta resolver el cierre nativo.':'Sesión cerrada. No se ha borrado ningún archivo de Drive.\nPulsa Iniciar sesión / elegir cuenta y comprueba el correo mostrado antes de acceder a un libro.');
 });}
async function action(repair){buttons.forEach(b=>b.disabled=true);show('Conectando con Google…');
 try{const id=window.ControlFiscalDriveV78.parseId(input.value);const t=await auth();
 if(repair&&verifiedId!==id)throw Error('Primero pulsa Comprobar libro con este mismo ID');
 if(repair){const r=await window.ControlFiscalDriveV78.repair(t,id);show('LIBRO CONFIGURADO\n'+r.name+'\nID: '+r.id+'\nOperaciones: '+r.changed+'\nPestañas: '+r.tabs.join(', ')+'\nNo se han escrito datos fiscales.');}
 else{const r=await window.ControlFiscalDriveV78.inspect(t,id);verifiedId=id;show('LIBRO ENCONTRADO\n'+r.drive.name+'\nID: '+r.id+'\nPestañas actuales: '+(r.sheet.sheets||[]).map(s=>s.properties?.title).join(', ')+'\nPuedes pulsar Configurar 7 pestañas.');}
 }catch(e){show('Error: '+String(e?.message||e).slice(0,650));}finally{buttons.forEach(b=>b.disabled=false);}
}
async function testAction(write){buttons.forEach(b=>b.disabled=true);show('Comprobando Google Sheets…');
 try{const id=window.ControlFiscalDriveV78.parseId(input.value);const t=await auth();
  const r=write?await window.ControlFiscalDriveV78.writeAndVerifyTest(t,id):await window.ControlFiscalDriveV78.verifyTest(t,id);
  if(!r.found){show('SIN REGISTRO DE PRUEBA\nEl libro existe y la lectura funciona. Pulsa Guardar y leer prueba.');return;}
  show((r.created?'PRUEBA GUARDADA Y LEÍDA': 'LECTURA CORRECTA')+'\nID del libro: '+r.id+'\nPestaña: Configuracion\nFila: '+r.row+'\nMarcador: '+r.marker+'\nValor: '+r.value+'\nCoincidencia: correcta\nNo se han escrito datos fiscales reales.');
 }catch(e){show('Error: '+String(e?.message||e).slice(0,650));}finally{buttons.forEach(b=>b.disabled=false);}
}
async function automatic(allowCreate){buttons.forEach(b=>b.disabled=true);show('Buscando tu libro en Google Drive…');
 try{
  const t=await auth();const r=await window.ControlFiscalDriveV78.automaticBook(t,{allowCreate});
  if(!r.found){show('No se encontró ningún libro accesible para esta aplicación. Si ya tienes uno, pega su enlace y pulsa Comprobar libro. Si es tu primera instalación, pulsa Crear solo si no existe.');return;}
  input.value=r.id;verifiedId=r.id;
  show((r.created?'LIBRO CREADO Y CONFIGURADO':'LIBRO RECUPERADO Y CONFIGURADO')+'\nID: '+r.id+'\nPestañas: '+r.tabs.join(', ')+'\nCambios: '+r.changed+'\nPuedes usar Verificar lectura.');
 }catch(e){show('Error: '+String(e?.message||e).slice(0,850));}
 finally{buttons.forEach(b=>b.disabled=false);}
}
document.getElementById('cf-login-account').addEventListener('click',signIn);
document.getElementById('cf-logout-account').addEventListener('click',signOut);
document.getElementById('cf-auto-find').addEventListener('click',()=>automatic(false));
document.getElementById('cf-auto-create').addEventListener('click',()=>automatic(true));
buttons[0].addEventListener('click',()=>action(false));buttons[1].addEventListener('click',()=>action(true));
buttons[2].addEventListener('click',()=>testAction(true));buttons[3].addEventListener('click',()=>testAction(false));
})();
