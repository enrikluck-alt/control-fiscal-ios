/* V78: diagnóstico aislado de OAuth. No guarda ni imprime tokens. */
(function(){
  'use strict';
  const clientId='429272495544-72rmbs21hjds0fqb2hjlskbojr6gmi4g.apps.googleusercontent.com';
  const scopes=['openid','email','profile','https://www.googleapis.com/auth/drive.file'];
  const gate=document.createElement('div'); gate.id='cf-google-test-gate';
  gate.innerHTML='<div class="panel"><h2>Control Fiscal V78</h2><p>Diagnóstico OAuth iOS (solo lectura)</p><button id="cf-google-signin">Probar sesión nueva</button><p class="small" id="cf-google-result">Se cerrará la sesión de Google de esta aplicación y se solicitará una nueva. No se crearán archivos.</p></div>';
  document.body.appendChild(gate);
  const btn=document.getElementById('cf-google-signin');
  const msg=document.getElementById('cf-google-result');
  const show=s=>{msg.textContent=s;};
  const getToken=v=>typeof v==='string'?v:(v&&typeof v.token==='string'?v.token:null);
  const errorName=e=>String(e?.message||e?.name||'Error').slice(0,180);
  const endpoints=[['Userinfo','https://www.googleapis.com/oauth2/v3/userinfo'],['Drive','https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)']];
  async function testFetch(token,url){
    try{const r=await fetch(url,{headers:{Authorization:'Bearer '+token},cache:'no-store'});return 'HTTP '+r.status;}
    catch(e){return 'error '+errorName(e);}
  }
  async function testNative(token,url){
    try{
      const http=window.CapacitorHttpNative;
      if(!http||typeof http.request!=='function') return 'no disponible';
      const r=await http.request({url,method:'GET',headers:{Authorization:'Bearer '+token,'Accept':'application/json'}});
      return 'HTTP '+r.status;
    }catch(e){return 'error '+errorName(e);}
  }
  btn.addEventListener('click',async()=>{
    btn.disabled=true;show('Comprobando configuración nativa…');
    const lines=[];
    try{
      if(!window.Capacitor||window.Capacitor.getPlatform()!=='ios') throw Error('Se necesita la aplicación nativa iOS.');
      const social=window.ControlFiscalSocialLogin;
      if(!social) throw Error('SocialLogin no disponible.');
      await social.initialize({google:{iOSClientId:clientId,mode:'online'}});
      try{await social.logout({provider:'google'});lines.push('Cierre de sesión anterior: correcto');}
      catch(e){lines.push('Cierre de sesión anterior: '+errorName(e));}
      const response=await social.login({provider:'google',options:{scopes}});
      const result=response?.result||{};
      const token=getToken(result.accessToken);
      lines.push('ID token: '+(result.idToken?'presente':'ausente'));
      lines.push('Access token: '+(token?'presente':'ausente'));
      lines.push('Tipo de respuesta: '+String(result.responseType||'no indicado'));
      lines.push('Formato token: '+(!token?'ausente':token.split('.').length===3?'3 segmentos (posible JWT)':'opaco'));
      lines.push('¿Igual al ID token?: '+(token&&result.idToken?String(token===result.idToken):'no comprobable'));
      lines.push('Expiración informada: '+(result.accessTokenExpirationDate?'presente':'no indicada'));
      if(token){
        for(const [name,url] of endpoints){
          lines.push(name+' web: '+await testFetch(token,url));
          lines.push(name+' nativo: '+await testNative(token,url));
        }
      }
      lines.push('No se han creado ni modificado archivos.');
      show(lines.join('\n'));
    }catch(e){lines.push('Error: '+errorName(e));show(lines.join('\n'));}
    finally{btn.disabled=false;}
  });
})();
