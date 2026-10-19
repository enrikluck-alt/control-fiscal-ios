/* V78: diagnóstico OAuth de solo lectura. No imprime, almacena ni envía tokens a terceros. */
(function(){
  'use strict';
  const clientId='429272495544-72rmbs21hjds0fqb2hjlskbojr6gmi4g.apps.googleusercontent.com';
  const gate=document.createElement('div'); gate.id='cf-google-test-gate';
  gate.innerHTML='<div class="panel"><h2>Control Fiscal V78</h2><p>Diagnóstico de token Google (solo lectura)</p><button id="cf-google-signin">Comprobar credenciales</button><p class="small" id="cf-google-result">No se crearán ni modificarán archivos.</p></div>';
  document.body.appendChild(gate);
  const btn=document.getElementById('cf-google-signin');
  const msg=document.getElementById('cf-google-result');
  const show=(s)=>{msg.textContent=s;};
  const getToken=(v)=>typeof v==='string'?v:(v&&typeof v.token==='string'?v.token:null);
  async function check(token,url){
    if(!token) return 'sin token';
    try {
      const r=await fetch(url,{headers:{Authorization:'Bearer '+token},cache:'no-store'});
      return 'HTTP '+r.status;
    }catch(e){return 'error de red ('+(e?.name||'desconocido')+')';}
  }
  btn.addEventListener('click',async()=>{
    btn.disabled=true;show('Iniciando diagnóstico…');
    try{
      if(!window.Capacitor || window.Capacitor.getPlatform()!=='ios') throw Error('Solo iOS nativo.');
      const social=window.ControlFiscalSocialLogin;
      if(!social) throw Error('SocialLogin no disponible.');
      await social.initialize({google:{iOSClientId:clientId,mode:'online'}});
      const response=await social.login({provider:'google',options:{scopes:['email','profile','https://www.googleapis.com/auth/drive.file']}});
      const result=response?.result||{};
      const token=getToken(result.accessToken);
      const lines=[
        'ID token: '+(result.idToken?'presente':'ausente'),
        'Access token: '+(token?'presente':'ausente'),
        '¿Access token igual a ID token?: '+(token&&result.idToken?String(token===result.idToken):'no comprobable'),
        'Userinfo con token del login: '+await check(token,'https://www.googleapis.com/oauth2/v3/userinfo'),
        'Drive con token del login: '+await check(token,'https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)')
      ];
      if(typeof social.getAuthorizationCode==='function'){
        try{
          const auth=await social.getAuthorizationCode({provider:'google'});
          const alt=getToken(auth?.accessToken);
          lines.push('getAuthorizationCode: '+(alt?'token disponible':'sin token'));
          lines.push('¿Mismo token que login?: '+(alt&&token?String(alt===token):'no comprobable'));
          if(alt&&alt!==token){
            lines.push('Userinfo con token alternativo: '+await check(alt,'https://www.googleapis.com/oauth2/v3/userinfo'));
            lines.push('Drive con token alternativo: '+await check(alt,'https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)'));
          }
        }catch(e){lines.push('getAuthorizationCode: no disponible ('+(e?.name||'error')+')');}
      }
      lines.push('No se han creado ni modificado archivos.');
      show(lines.join('\n'));
    }catch(e){show('Error: '+String(e?.message||e));}
    finally{btn.disabled=false;}
  });
})();
