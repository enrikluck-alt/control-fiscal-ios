/* R15. Sugerencias a Cloud Run con identidad Google, sin Gmail ni acceso fiscal. */
(function(root){'use strict';
 const kinds=new Set(['Sugerencia','Error','Consulta']);
 const endpoint=()=>String(root.CFFeedbackConfig?.endpoint||'').replace(/\/$/,'');
 async function send({kind,message,appVersion}){
   if(!kinds.has(kind))throw Error('Selecciona un tipo válido.');
   message=String(message||'').trim();
   if(message.length<12||message.length>2700)throw Error('Escribe entre 12 y 2700 caracteres.');
   const url=endpoint();
   if(!/^https:\/\/[^/\s?#]+/.test(url))throw Error('El buzón privado de sugerencias de Google Cloud todavía no está configurado. No se ha enviado el mensaje.');
   const account=root.CFGoogleAccount?.active();
   if(!account?.id)throw Error('Inicia sesión con Google antes de enviar una sugerencia.');
   const jwt=await root.CFGoogleAccount.getSupportIdToken();
   const controller=new AbortController();const stop=setTimeout(()=>controller.abort(),15000);
   try{
     const response=await root.fetch(url+'/api/feedback',{
       method:'POST',headers:{Authorization:'Bearer '+jwt,'Content-Type':'application/json'},
       body:JSON.stringify({kind,message,appVersion:String(appVersion||'').slice(0,60),platform:root.Capacitor?.getPlatform?.()||'web',language:root.navigator?.language||'es'}),
       signal:controller.signal
     });
     const output=await response.json().catch(()=>({}));
     if(root.CFGoogleAccount?.active()?.id!==account.id)throw Error('La cuenta de Google cambió durante el envío.');
     if(!response.ok)throw Error(output.message||('Servidor de sugerencias HTTP '+response.status));
     if(!output.id||output.received!==true)throw Error('Google Cloud no ha confirmado la recepción.');
     return {id:output.id};
   }catch(e){if(e?.name==='AbortError')throw Error('No se recibió respuesta de Google Cloud. Revisa la conexión y consulta el panel antes de reintentar.');throw e;}
   finally{clearTimeout(stop);}
 }
 root.CFFeedback=Object.freeze({send});
})(window);
