/* Prueba aislada V78: crea o recupera UN libro personal. Sin operaciones fiscales. */
(function(){
'use strict';
const clientId='429272495544-72rmbs21hjds0fqb2hjlskbojr6gmi4g.apps.googleusercontent.com';
const scopes=['openid','email','profile','https://www.googleapis.com/auth/drive.file'];
const gate=document.createElement('div');gate.id='cf-google-test-gate';
gate.innerHTML='<div class="panel"><h2>Control Fiscal V78</h2><p>Prueba de libro personal en Google Drive</p><button id="cf-google-signin">Buscar o crear mi libro de prueba</button><p class="small" id="cf-google-result">Esta prueba puede crear una hoja de cálculo vacía en tu Drive. No se guardarán datos fiscales.</p></div>';
document.body.appendChild(gate);
const btn=document.getElementById('cf-google-signin');const msg=document.getElementById('cf-google-result');
const show=s=>{msg.textContent=s;};
btn.addEventListener('click',async()=>{
  btn.disabled=true;show('Iniciando sesión y comprobando Drive…');
  try{
    if(!window.Capacitor||window.Capacitor.getPlatform()!=='ios')throw Error('Esta prueba requiere iOS.');
    const social=window.ControlFiscalSocialLogin;
    if(!social||!window.ControlFiscalDriveV78)throw Error('Falta el módulo nativo o Drive.');
    await social.initialize({google:{iOSClientId:clientId,mode:'online'}});
    const login=await social.login({provider:'google',options:{scopes}});
    const raw=login?.result?.accessToken;
    const token=typeof raw==='string'?raw:raw?.token;
    if(typeof token!=='string'||token.length<20)throw Error('No se recibió token OAuth válido.');
    show('Autenticación correcta. Buscando el libro V78…');
    const book=await window.ControlFiscalDriveV78.findOrCreateBook(token);
    show((book.created?'LIBRO CREADO':'LIBRO RECUPERADO')+'\nNombre: '+book.name+'\nID: '+book.id+'\nPestañas añadidas: '+book.tabsAdded+'\n\nVuelve a pulsar para verificar que se recupera el mismo ID. No se han escrito datos fiscales.');
  }catch(e){show('Error: '+String(e?.message||e).slice(0,500)+'\n\nSi se muestra un ID, no vuelvas a crear otro libro: envíanos ese mensaje.');}
  finally{btn.disabled=false;}
});
})();
