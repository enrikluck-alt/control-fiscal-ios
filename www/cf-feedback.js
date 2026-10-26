/* R15. Sugerencias a Cloud Run con identidad Google, sin Gmail ni acceso fiscal. */
(function(root){'use strict';
 const kinds=new Set(['Sugerencia','Error','Consulta']);
 const endpoint=()=>String(root.CFFeedbackConfig?.endpoint||'').replace(/\/$/,'');
 function newDocId(){
   const crypto=root.crypto;
   if(!crypto?.getRandomValues)throw Error('Este dispositivo no dispone de generación segura de identificadores.');
   const data=new Uint8Array(16);crypto.getRandomValues(data);
   return 'cf_'+Array.from(data,b=>b.toString(16).padStart(2,'0')).join('');
 }
 async function sendFirebase({kind,message,allowReply,appVersion}){
   const user=await root.CFFirebaseAuth.ensureSignedIn();
   const projectId=String(root.CFFirebaseConfig?.projectId||'');
   if(!/^[-\w]{5,100}$/.test(projectId))throw Error('Configura el ID de proyecto de Firebase.');
   const id=newDocId();
   const platform=String(root.Capacitor?.getPlatform?.()||'web').slice(0,25);
   const fields={
     uid:{stringValue:user.uid},tipo:{stringValue:kind},mensaje:{stringValue:message},estado:{stringValue:'pendiente'},
     nombre:{stringValue:String(user.name||'Usuario de Control Fiscal').slice(0,100)},
     permiteRespuesta:{booleanValue:allowReply===true},
     version:{stringValue:String(appVersion||'').slice(0,60)},plataforma:{stringValue:platform}
   };
   if(allowReply===true){
     const email=String(user.email||'').trim().toLowerCase();
     if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Tu cuenta no tiene un correo verificado para responder.');
     fields.correoRespuesta={stringValue:email};
   }
   const url='https://firestore.googleapis.com/v1/projects/'+encodeURIComponent(projectId)+'/databases/(default)/documents:commit';
   const body={writes:[{update:{name:'projects/'+projectId+'/databases/(default)/documents/control_fiscal_sugerencias/'+id,fields},
     currentDocument:{exists:false},updateTransforms:[{fieldPath:'fecha',setToServerValue:'REQUEST_TIME'}]}]};
   const controller=new AbortController();const stop=setTimeout(()=>controller.abort(),15000);
   try{
     const response=await root.fetch(url,{method:'POST',headers:{Authorization:'Bearer '+user.idToken,'Content-Type':'application/json'},
       body:JSON.stringify(body),signal:controller.signal});
     const result=await response.json().catch(()=>({}));
     if(!response.ok)throw Error('Firestore HTTP '+response.status+': '+String(result.error?.message||'Comprueba las reglas y el proveedor Google de Firebase.').slice(0,200));
     if(!Array.isArray(result.writeResults)||result.writeResults.length!==1)throw Error('Firestore no ha confirmado el guardado de la sugerencia.');
     return {id};
   }catch(e){if(e?.name==='AbortError')throw Error('Google no confirmó el guardado. Comprueba Firestore antes de reintentar.');throw e;}
   finally{clearTimeout(stop);}
 }
 async function send({kind,message,appVersion,allowReply=false}){
   if(!kinds.has(kind))throw Error('Selecciona un tipo válido.');
   message=String(message||'').trim();
   if(message.length<12||message.length>2700)throw Error('Escribe entre 12 y 2700 caracteres.');
   if(root.CFFirebaseAuth?.configured?.())return sendFirebase({kind,message,appVersion,allowReply});
   const url=endpoint();
   if(!/^https:\/\/[^/\s?#]+/.test(url))throw Error('El buzón privado de sugerencias de Google Cloud todavía no está configurado. Añade apiKey y projectId en cf-firebase-config.js, activa Google en Firebase Authentication y recompila. No se ha enviado el mensaje.');
   const account=root.CFGoogleAccount?.active();
   if(!account?.id)throw Error('Inicia sesión con Google antes de enviar una sugerencia.');
   const jwt=await root.CFGoogleAccount.getSupportIdToken();
   const controller=new AbortController();const stop=setTimeout(()=>controller.abort(),15000);
   try{
     const response=await root.fetch(url+'/api/feedback',{
       method:'POST',headers:{Authorization:'Bearer '+jwt,'Content-Type':'application/json'},
       body:JSON.stringify({kind,message,allowReply,appVersion:String(appVersion||'').slice(0,60),platform:root.Capacitor?.getPlatform?.()||'web',language:root.navigator?.language||'es'}),
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
