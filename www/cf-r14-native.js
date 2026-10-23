/* R14: timeout and permission diagnostics around iOS native plugins.
   These wrappers deliberately do not pretend that an iOS permission was granted. */
(function(root){'use strict';
const LIMIT=8500;
function deadline(promise,label,ms=LIMIT){
 let timer;
 return Promise.race([
  Promise.resolve(promise),
  new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+' no respondió en '+Math.round(ms/1000)+' segundos. Comprueba en Ajustes del iPhone → Control Fiscal → Notificaciones que los avisos estén autorizados; si persiste, envía el informe de iOS.')),ms);})
 ]).finally(()=>clearTimeout(timer));
}
root.cfNativeDeadline=deadline;
const methods=['checkPermissions','requestPermissions','schedule','cancel','getPending','getDeliveredNotifications','addListener'];
const cached=new WeakMap();
root.nativeLocalNotifications=async function(){
 const raw=root.CFLocalNotifications||root.Capacitor?.Plugins?.LocalNotifications||root.__CF_NATIVE_SECURITY__?.LocalNotifications;
 if(!raw)return null;
 if(cached.has(raw))return cached.get(raw);
 const safe=Object.create(null);
 for(const key of methods){
  if(typeof raw[key]==='function')safe[key]=(...args)=>deadline(raw[key](...args), 'El plugin de notificaciones ('+key+')',key==='addListener'?5000:LIMIT);
 }
 cached.set(raw,safe);return safe;
};
root.cfEnsureNoticePermission=async function(){
 const p=await root.nativeLocalNotifications();
 if(!p)throw Error('Falta el componente nativo de notificaciones. Reinstala una IPA que incluya LocalNotifications.');
 let permission;
 try{permission=await p.checkPermissions();}
 catch(e){ // Diagnostic: try the explicit request if the first native callback hangs.
  if(!p.requestPermissions)throw e;
  try{permission=await p.requestPermissions();}catch(other){throw Error('iOS no respondió a la comprobación ni a la solicitud de permisos. '+(other.message||other));}
 }
 if(permission?.display!=='granted')permission=await p.requestPermissions();
 if(permission?.display!=='granted')throw Error('iOS no ha concedido las notificaciones. Si ya rechazaste el permiso, iOS no vuelve a mostrar el cuadro: actívalo manualmente en Ajustes del iPhone → Control Fiscal → Notificaciones.');
 return p;
};
// Explicit UI diagnostics: never remain forever in "comprobando".
const originalStatus=root.refreshNotificationStatus;
if(typeof originalStatus==='function')root.refreshNotificationStatus=async function(){
 try{return await deadline(originalStatus(),'Consulta del permiso',12000);}
 catch(e){const status=document.getElementById('notificationStatus');if(status)status.textContent='❌ '+(e.message||e);}
};
const originalDaily=root.enablePendingNotifications;
if(typeof originalDaily==='function')root.enablePendingNotifications=async function(){
 const status=document.getElementById('notificationStatus');
 try{return await deadline(originalDaily(),'Activación del recordatorio',24000);}
 catch(e){if(status)status.textContent='❌ '+(e.message||e);const b=document.getElementById('notificationPermissionBtn');if(b)b.disabled=false;}
};
const originalTest=root.cfSendTestNotification;
if(typeof originalTest==='function')root.cfSendTestNotification=async function(){
 const nodes=['notificationStatus','cfNotificationSoundStatus'].map(id=>document.getElementById(id)).filter(Boolean);
 try{return await deadline(originalTest(),'Notificación de prueba',24000);}
 catch(e){nodes.forEach(el=>el.textContent='❌ '+(e.message||e));}
};
const ORIENT_KEY='cf_orientation_mode_r14';
root.cfSetOrientationMode=async function(mode){
 const el=document.getElementById('cfOrientationChoice');mode=mode==='portrait'?'portrait':'auto';
 root.localStorage.setItem(ORIENT_KEY,mode);if(el)el.value=mode;
 const plugin=root.CFScreenOrientation||root.Capacitor?.Plugins?.ScreenOrientation;
 if(!plugin){if(el)el.title='El giro se habilita en la compilación iOS R14.';return;}
 try{if(mode==='portrait')await deadline(plugin.lock({orientation:'portrait'}),'Bloqueo de orientación',6000);
 else await deadline(plugin.unlock(),'Activación del giro',6000);}
 catch(e){const status=document.getElementById('cfOrientationStatus');if(status)status.textContent='No se pudo cambiar el giro: '+(e.message||e);}
};
function initialize(){
 const element=document.getElementById('cfOrientationChoice');
 const mode=root.localStorage.getItem(ORIENT_KEY)==='portrait'?'portrait':'auto';
 if(element)element.value=mode;
 root.cfSetOrientationMode(mode).catch(e=>console.warn('Orientación de R14:',e));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
})(window);
