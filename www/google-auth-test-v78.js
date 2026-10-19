/* Control Fiscal V78: diagnóstico seguro de OAuth. NO habilita operaciones fiscales. */
(function(){
  'use strict';
  const clientId='429272495544-72rmbs21hjds0fqb2hjlskbojr6gmi4g.apps.googleusercontent.com';
  const gate=document.createElement('div'); gate.id='cf-google-test-gate';
  gate.innerHTML='<div class="panel"><h2>Control Fiscal V78</h2><p>Diagnóstico seguro de Google Drive</p><button id="cf-google-signin">Diagnosticar acceso Google</button><p class="small" id="cf-google-result">No se mostrarán tokens ni se escribirán datos fiscales.</p></div>';
  document.body.appendChild(gate);
  const msg=document.getElementById('cf-google-result');
  const btn=document.getElementById('cf-google-signin');
  const show=(s)=>{msg.textContent=s;};
  function tokenKind(token){
    if(typeof token!=='string' || !token) return 'ausente';
    if(token.split('.').length===3) return 'formato JWT (comprobar si se usa idToken por error)';
    return 'formato opaco';
  }
  function safeKeys(obj){
    if(!obj || typeof obj!=='object') return 'no es objeto';
    return Object.keys(obj).filter(k=>/^(token|accessToken|idToken|refreshToken|serverAuthCode|expires|expiresIn|expirationDate|scopes|scope|profile|user|provider)$/i.test(k)).join(', ')||'(ninguna de las claves conocidas)';
  }
  async function probe(accessToken){
    try{
      const r=await fetch('https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)',{
        method:'GET',headers:{Authorization:'Bearer '+accessToken},cache:'no-store'
      });
      const data=await r.json().catch(()=>({}));
      return {status:r.status,message:r.ok?'Autorización Drive aceptada':String(data?.error?.message||'Petición rechazada')};
    }catch(e){return {status:'red',message:String(e?.message||e)};}
  }
  btn.addEventListener('click',async()=>{
    btn.disabled=true; show('Solicitando autorización a Google…');
    try{
      if(!window.Capacitor || window.Capacitor.getPlatform()!=='ios') throw Error('Se necesita la aplicación nativa iOS.');
      const social=window.ControlFiscalSocialLogin;
      if(!social || typeof social.initialize!=='function') throw Error('No se ha cargado SocialLogin.');
      await social.initialize({google:{iOSClientId:clientId,mode:'online'}});
      const response=await social.login({provider:'google',options:{scopes:['openid','email','profile','https://www.googleapis.com/auth/drive.file']}});
      const result=response?.result;
      if(!result) throw Error('Respuesta de Google sin result.');
      const raw=result.accessToken;
      const accessToken=typeof raw==='string'?raw:(raw && typeof raw.token==='string'?raw.token:null);
      const details=[
        'Identidad (idToken): '+(typeof result.idToken==='string' && result.idToken.length>0?'presente':'ausente'),
        'Claves conocidas en result: '+safeKeys(result),
        'Tipo de accessToken: '+(typeof raw==='string'?'cadena':raw===null?'null':typeof raw),
        'Claves conocidas de accessToken: '+safeKeys(raw),
        'Token de acceso: '+tokenKind(accessToken)
      ];
      if(!accessToken){show(details.join('\n')+'\nNo hay accessToken utilizable.');return;}
      const check=await probe(accessToken);
      details.push('Prueba de autorización Drive: HTTP '+check.status);
      details.push('Respuesta Drive: '+check.message);
      if(check.status===200){
        details.push('La autorización básica funciona. NO se han creado archivos.');
      }else{
        details.push('No se ha intentado crear ninguna hoja para evitar duplicados.');
      }
      show(details.join('\n'));
    }catch(e){show('Error de autenticación: '+String(e?.message||e));}
    finally{btn.disabled=false;}
  });
})();
