/* V78: prueba aislada de OAuth Drive. No habilita operaciones fiscales. */
(function(){
  'use strict';
  const clientId='429272495544-72rmbs21hjds0fqb2hjlskbojr6gmi4g.apps.googleusercontent.com';
  const gate=document.createElement('div'); gate.id='cf-google-test-gate';
  gate.innerHTML='<div class="panel"><h2>Control Fiscal V78</h2><p>Prueba Google Drive personal</p><button id="cf-google-signin">Iniciar sesión y comprobar Drive</button><p class="small" id="cf-google-result">Se solicitará permiso para los archivos de Control Fiscal. No se habilitan operaciones fiscales.</p></div>';
  document.body.appendChild(gate);
  const msg=document.getElementById('cf-google-result');
  const btn=document.getElementById('cf-google-signin');
  const show=(text)=>{msg.textContent=text;};
  btn.addEventListener('click',async()=>{
    btn.disabled=true;show('Conectando con Google…');
    try{
      if(!window.Capacitor || window.Capacitor.getPlatform()!=='ios') throw Error('Se necesita la aplicación nativa iOS.');
      const social=window.ControlFiscalSocialLogin;
      if(!social || typeof social.initialize!=='function') throw Error('No se ha cargado SocialLogin.');
      if(!window.ControlFiscalDriveV78) throw Error('No se ha cargado drive-v78.js.');
      await social.initialize({google:{iOSClientId:clientId,mode:'online'}});
      const response=await social.login({provider:'google',options:{scopes:['openid','email','profile','https://www.googleapis.com/auth/drive.file']}});
      const result=response && response.result;
      if(!result || !result.idToken) throw Error('Google no devolvió token de identidad.');
      // Nunca enviar tokens a Apps Script ni imprimirlos en pantalla o logs.
      const accessToken=typeof result.accessToken==='string' ? result.accessToken : result.accessToken && result.accessToken.token;
      if(!accessToken) throw Error('Identidad correcta, pero no hay token OAuth para Drive. Revisar respuesta del plugin y los scopes.');
      show('Autenticación correcta. Buscando o creando el libro de prueba en tu Drive…');
      const book=await window.ControlFiscalDriveV78.findOrCreateBook(accessToken);
      show((book.created?'Libro creado':'Libro existente recuperado')+' correctamente en tu Google Drive.\nNombre: '+book.name+'\nID: '+book.id+'\n\nPrueba técnica de Drive completada. Las operaciones fiscales siguen bloqueadas.');
      btn.textContent='Repetir prueba de recuperación';
    }catch(e){show('Error: '+(e && e.message ? e.message : String(e)));}
    finally{btn.disabled=false;}
  });
})();
