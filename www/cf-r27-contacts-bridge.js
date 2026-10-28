/* R27: puente de seguridad para el selector telefónico nativo de Capacitor.
   No lee ni sincroniza la agenda; solo devuelve el teléfono elegido. */
(function(root){'use strict';
 function firstValue(values){
   if(!Array.isArray(values)||!values.length)return '';
   const obj=values.find(x=>x?.isPrimary||x?.pref)||values[0];
   return typeof obj==='string'?obj:String(obj?.value||obj?.number||'');
 }
 function normalize(payload){
   const contact=payload?.contacts?.[0]||payload?.contact||null;
   if(!contact)return null;
   const number=firstValue(contact.phoneNumbers);
   return {displayName:String(contact.displayName||[contact.givenName,contact.familyName].filter(Boolean).join(' ')),
     phoneNumbers:number?[{value:number}]:[],emails:[]};
 }
 async function nativePick(){
   const cap=root.Capacitor;
   if(!cap||cap.getPlatform?.()==='web')throw Error('La agenda del teléfono solo está disponible en la aplicación instalada.');
   // La implementación principal de Capacitor se genera al compilar; en caso
   // de fallo del bundle, probar el puente nativo registrado por la app.
   const plugin=cap.Plugins?.CapacitorContacts || cap.registerPlugin?.('CapacitorContacts');
   if(!plugin)throw Error('CapacitorContacts no está registrado en esta IPA. Comprueba el paso de integración nativa de GitHub Actions.');
   const method=typeof plugin.pickContacts==='function'?'pickContacts':typeof plugin.pickContact==='function'?'pickContact':null;
   if(!method)throw Error('El plugin Contacts está presente pero no expone el selector. Comprueba la versión del plugin.');
   return normalize(await plugin[method]({property:'phoneNumber'}));
 }
 // Mantener el selector generado, si existe, y disponer de una alternativa real.
 const compiled=root.CFNativeContactPicker?.pickContact;
 root.CFNativeContactPicker=Object.freeze({
   source:typeof compiled==='function'?'bundle+y-puente':'puente-nativo',
   pickContact:async()=>{
     if(typeof compiled==='function'){
       try{return await compiled();}
       catch(error){
         // No repetir el selector si se canceló o falló por otro motivo:
         // únicamente usar fallback si la implementación JS no está disponible.
         if(!/not implemented|not available|unavailable|plugin is not/i.test(String(error?.message||error)))throw error;
       }
     }
     return nativePick();
   }
 });
 root.CFR27Contacts=Object.freeze({normalize,firstValue,nativePick});
})(window);
