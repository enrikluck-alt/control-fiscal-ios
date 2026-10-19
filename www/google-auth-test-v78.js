/* V78: prueba aislada de Google Sign-In. NO habilita operaciones fiscales. */
(function(){
  'use strict';
  const clientId='429272495544-72rmbs21hjds0fqb2hjlskbojr6gmi4g.apps.googleusercontent.com';
  const gate=document.createElement('div'); gate.id='cf-google-test-gate';
  gate.innerHTML='<div class="panel"><h2>Control Fiscal V78</h2><p>Prueba de acceso con Google</p><button id="cf-google-signin">Iniciar sesión con Google</button><p class="small" id="cf-google-result">No se habilitarán compras, facturas ni acceso al Apps Script anterior.</p></div>';
  document.body.appendChild(gate);
  const msg=document.getElementById('cf-google-result');
  const btn=document.getElementById('cf-google-signin');
  let social;
  btn.addEventListener('click',async()=>{
    btn.disabled=true; msg.textContent='Conectando con Google…';
    try{
      if(!window.Capacitor || window.Capacitor.getPlatform()!=='ios') throw Error('Esta prueba requiere un iPhone con la aplicación nativa.');
      social=window.Capacitor.registerPlugin('SocialLogin');
      await social.initialize({google:{iOSClientId:clientId,mode:'online'}});
      const response=await social.login({provider:'google',options:{scopes:['email','profile']}});
      const result=response && response.result;
      if(!result || !result.idToken) throw Error('Google no devolvió un token de identidad.');
      // La identidad aún NO autoriza operaciones fiscales. Nunca almacenar tokens en localStorage.
      const user=result.profile || result.user || {};
      const email=user.email || (result.email || 'Cuenta autenticada');
      msg.textContent='Google Sign-In completado: '+email+'. Prueba técnica correcta. Las operaciones fiscales siguen bloqueadas hasta integrar el acceso individual y verificar los permisos.';
      btn.textContent='Repetir prueba';
    }catch(e){msg.textContent='Error: '+(e && e.message ? e.message : String(e));}
    finally{btn.disabled=false;}
  });
})();
