/* R16: offline translations for interface text and attributes. No translation service is called.
   Unknown phrases fall back to the original Spanish; user/fiscal data is never translated. */
(function(root){'use strict';
const STORE='cf_ui_language_r14';
const data={
 en:{'INICIO':'HOME','Compras':'Purchases','Facturación':'Invoicing','Agenda':'Calendar','Stock':'Inventory','Ajustes':'Settings','AJUSTES':'SETTINGS','Resumen':'Summary','Documentos':'Documents','Guardar compra':'Save purchase','Guardar':'Save','Cancelar':'Cancel','CLIENTES Y DISTRIBUIDORES':'CUSTOMERS AND SUPPLIERS','MIS CLIENTES':'MY CUSTOMERS','MIS DISTRIBUIDORES':'MY SUPPLIERS','NOTIFICACIONES':'NOTIFICATIONS','Hora del recordatorio':'Reminder time','ACTIVAR / ACTUALIZAR RECORDATORIO':'ENABLE / UPDATE REMINDER','ENVIAR AVISO DE PRUEBA':'SEND TEST NOTIFICATION','AUDIO DE NOTIFICACIONES':'NOTIFICATION SOUNDS','Sonido de iOS':'iOS sound','ESCUCHAR SONIDO':'PLAY SOUND','PROBAR EN EL IPHONE':'TEST ON IPHONE','DISEÑO':'APPEARANCE','Idioma de la aplicación':'App language','Giro de pantalla':'Screen rotation','Giro automático':'Auto-rotate','Bloquear en vertical':'Lock portrait','Automático · idioma del teléfono':'Automatic · device language','MÁXIMA CALIDAD':'BEST QUALITY','RENDIMIENTO Y PANTALLA':'PERFORMANCE AND DISPLAY','RESTABLECER AJUSTES':'RESET SETTINGS','SUGERENCIAS Y ERRORES':'FEEDBACK AND ISSUES','ENVIAR SUGERENCIA O INFORMAR DE UN FALLO':'SEND FEEDBACK OR REPORT AN ISSUE','CUENTA':'ACCOUNT','CERRAR SESIÓN / CAMBIAR DE CUENTA':'SIGN OUT / SWITCH ACCOUNT','DATOS DE FACTURACIÓN':'BILLING DETAILS','OPCIONES DE FACTURA':'INVOICE OPTIONS','INFORMACIÓN Y HERRAMIENTAS':'INFORMATION AND TOOLS','GUÍA DE FUNCIONAMIENTO':'USER GUIDE','INICIAR TUTORIAL INTERACTIVO':'START INTERACTIVE GUIDE','VOLVER':'BACK','CERRAR':'CLOSE','Volver a Control Fiscal':'Back to Control Fiscal','Abrir fuera':'Open externally','Reducir':'Zoom out','Ampliar':'Zoom in','Ajustar':'Fit','Imprimir':'Print','CREAR FACTURA':'CREATE INVOICE','GUARDAR COMPRA':'SAVE PURCHASE','GUARDAR EVENTO':'SAVE EVENTO','MIS FACTURAS':'MY INVOICES','NUEVO EVENTO':'NEW EVENT','ENVIAR SUGERENCIA':'SEND FEEDBACK','Aviso diario de documentación pendiente':'Daily reminder for missing documents','Ahorro de rendimiento':'Performance saver'},
 fr:{'INICIO':'ACCUEIL','Compras':'Achats','Facturación':'Facturation','Agenda':'Agenda','Stock':'Inventaire','Ajustes':'Paramètres','AJUSTES':'PARAMÈTRES','Resumen':'Résumé','Documentos':'Documents','Guardar':'Enregistrer','Cancelar':'Annuler','NOTIFICACIONES':'NOTIFICATIONS','Hora del recordatorio':'Heure du rappel','DISEÑO':'APPARENCE','Idioma de la aplicación':"Langue de l’application",'Giro de pantalla':"Rotation de l’écran",'Giro automático':'Rotation automatique','Bloquear en vertical':'Verrouiller en portrait','Automático · idioma del teléfono':'Automatique · langue du téléphone','ENVIAR AVISO DE PRUEBA':'ENVOYER UNE NOTIFICATION TEST','AUDIO DE NOTIFICACIONES':'SONS DES NOTIFICATIONS','CUENTA':'COMPTE','CERRAR SESIÓN / CAMBIAR DE CUENTA':'SE DÉCONNECTER / CHANGER DE COMPTE','SUGERENCIAS Y ERRORES':'SUGGESTIONS ET ERREURS','Volver a Control Fiscal':'Retour à Control Fiscal','Abrir fuera':'Ouvrir ailleurs','Reducir':'Réduire','Ampliar':'Agrandir','Ajustar':'Ajuster','Imprimir':'Imprimer'},
 de:{'INICIO':'START','Compras':'Einkäufe','Facturación':'Rechnungen','Agenda':'Termine','Stock':'Inventar','Ajustes':'Einstellungen','AJUSTES':'EINSTELLUNGEN','Resumen':'Übersicht','Documentos':'Dokumente','Guardar':'Speichern','Cancelar':'Abbrechen','NOTIFICACIONES':'BENACHRICHTIGUNGEN','Hora del recordatorio':'Erinnerungszeit','DISEÑO':'DARSTELLUNG','Idioma de la aplicación':'App-Sprache','Giro de pantalla':'Bildschirmdrehung','Giro automático':'Automatisch drehen','Bloquear en vertical':'Hochformat sperren','Automático · idioma del teléfono':'Automatisch · Gerätesprache','ENVIAR AVISO DE PRUEBA':'TESTBENACHRICHTIGUNG SENDEN','AUDIO DE NOTIFICACIONES':'BENACHRICHTIGUNGSTÖNE','CUENTA':'KONTO','CERRAR SESIÓN / CAMBIAR DE CUENTA':'ABMELDEN / KONTO WECHSELN','SUGERENCIAS Y ERRORES':'FEEDBACK UND FEHLER','Volver a Control Fiscal':'Zurück zu Control Fiscal','Abrir fuera':'Extern öffnen','Reducir':'Verkleinern','Ampliar':'Vergrößern','Ajustar':'Anpassen','Imprimir':'Drucken'},
 it:{'INICIO':'HOME','Compras':'Acquisti','Facturación':'Fatturazione','Agenda':'Agenda','Stock':'Magazzino','Ajustes':'Impostazioni','AJUSTES':'IMPOSTAZIONI','Resumen':'Riepilogo','Documentos':'Documenti','Guardar':'Salva','Cancelar':'Annulla','NOTIFICACIONES':'NOTIFICHE','Hora del recordatorio':'Ora del promemoria','DISEÑO':'ASPETTO','Idioma de la aplicación':"Lingua dell’app",'Giro de pantalla':'Rotazione schermo','Giro automático':'Rotazione automatica','Bloquear en vertical':'Blocca verticale','Automático · idioma del teléfono':'Automatico · lingua del telefono','ENVIAR AVISO DE PRUEBA':'INVIA NOTIFICA DI PROVA','AUDIO DE NOTIFICACIONES':'SUONI DI NOTIFICA','CUENTA':'ACCOUNT','CERRAR SESIÓN / CAMBIAR DE CUENTA':'ESCI / CAMBIA ACCOUNT','SUGERENCIAS Y ERRORES':'SUGGERIMENTI ED ERRORI','Volver a Control Fiscal':'Torna a Control Fiscal','Abrir fuera':'Apri esternamente','Reducir':'Riduci','Ampliar':'Ingrandisci','Ajustar':'Adatta','Imprimir':'Stampa'},
 pt:{'INICIO':'INÍCIO','Compras':'Compras','Facturación':'Faturação','Agenda':'Agenda','Stock':'Inventário','Ajustes':'Definições','AJUSTES':'DEFINIÇÕES','Resumen':'Resumo','Documentos':'Documentos','Guardar':'Guardar','Cancelar':'Cancelar','NOTIFICACIONES':'NOTIFICAÇÕES','Hora del recordatorio':'Hora do lembrete','DISEÑO':'ASPETO','Idioma de la aplicación':'Idioma da aplicação','Giro de pantalla':'Rotação do ecrã','Giro automático':'Rotação automática','Bloquear en vertical':'Bloquear na vertical','Automático · idioma del teléfono':'Automático · idioma do telemóvel','ENVIAR AVISO DE PRUEBA':'ENVIAR NOTIFICAÇÃO DE TESTE','AUDIO DE NOTIFICACIONES':'SONS DE NOTIFICAÇÃO','CUENTA':'CONTA','CERRAR SESIÓN / CAMBIAR DE CUENTA':'TERMINAR SESSÃO / MUDAR CONTA','SUGERENCIAS Y ERRORES':'SUGESTÕES E ERROS','Volver a Control Fiscal':'Voltar ao Control Fiscal','Abrir fuera':'Abrir externamente','Reducir':'Reduzir','Ampliar':'Ampliar','Ajustar':'Ajustar','Imprimir':'Imprimir'}
};
// Account access, home tiles and most-used controls (remaining rare phrases fall back to Spanish).
Object.assign(data.en,{'INICIAR SESIÓN':'SIGN IN','CREAR CUENTA':'CREATE ACCOUNT','INICIAR SESIÓN CON GOOGLE':'SIGN IN WITH GOOGLE','CREAR CUENTA GOOGLE':'CREATE GOOGLE ACCOUNT','CORREO DE REFERENCIA (OPCIONAL)':'REFERENCE EMAIL (OPTIONAL)','Mantener sesión iniciada':'Keep me signed in','Preparando acceso…':'Preparing access…','REGISTRA TUS GASTOS':'TRACK YOUR EXPENSES','REGISTRA TUS INGRESOS':'TRACK YOUR INCOME','EVENTOS, HORAS, UBICACIÓN Y QUÉ LLEVAR':'EVENTS, TIMES AND LOCATIONS','COMPRAS':'PURCHASES','FACTURACIÓN':'INVOICING','AGENDA':'CALENDAR','INVENTARIO':'INVENTORY','REGISTRA · CONTROLA · SIMPLIFICA':'RECORD · TRACK · SIMPLIFY','GUARDAR BORRADOR':'SAVE DRAFT','GUARDAR FACTURA':'SAVE INVOICE','ENVIAR SUGERENCIA POR CORREO':'SEND FEEDBACK','Enviar sugerencia a los desarrolladores':'Send feedback to developers','Hora del recordatorio':'Reminder time','Ahorro de rendimiento':'Performance mode','Automático · idioma del teléfono':'Automatic · device language'});
Object.assign(data.fr,{'INICIAR SESIÓN':'SE CONNECTER','CREAR CUENTA':'CRÉER UN COMPTE','INICIAR SESIÓN CON GOOGLE':'SE CONNECTER AVEC GOOGLE','CREAR CUENTA GOOGLE':'CRÉER UN COMPTE GOOGLE','Mantener sesión iniciada':'Rester connecté','COMPRAS':'ACHATS','FACTURACIÓN':'FACTURATION','AGENDA':'AGENDA','INVENTARIO':'INVENTAIRE','REGISTRA TUS GASTOS':'SUIVEZ VOS DÉPENSES','REGISTRA TUS INGRESOS':'SUIVEZ VOS REVENUS'});
Object.assign(data.de,{'INICIAR SESIÓN':'ANMELDEN','CREAR CUENTA':'KONTO ERSTELLEN','INICIAR SESIÓN CON GOOGLE':'MIT GOOGLE ANMELDEN','CREAR CUENTA GOOGLE':'GOOGLE-KONTO ERSTELLEN','Mantener sesión iniciada':'Angemeldet bleiben','COMPRAS':'EINKÄUFE','FACTURACIÓN':'RECHNUNGEN','AGENDA':'TERMINE','INVENTARIO':'INVENTAR'});
Object.assign(data.it,{'INICIAR SESIÓN':'ACCEDI','CREAR CUENTA':'CREA ACCOUNT','INICIAR SESIÓN CON GOOGLE':'ACCEDI CON GOOGLE','CREAR CUENTA GOOGLE':'CREA ACCOUNT GOOGLE','Mantener sesión iniciada':'Resta connesso','COMPRAS':'ACQUISTI','FACTURACIÓN':'FATTURAZIONE','AGENDA':'AGENDA','INVENTARIO':'MAGAZZINO'});
Object.assign(data.pt,{'INICIAR SESIÓN':'INICIAR SESSÃO','CREAR CUENTA':'CRIAR CONTA','INICIAR SESIÓN CON GOOGLE':'INICIAR SESSÃO COM GOOGLE','CREAR CUENTA GOOGLE':'CRIAR CONTA GOOGLE','Mantener sesión iniciada':'Manter sessão iniciada','COMPRAS':'COMPRAS','FACTURACIÓN':'FATURAÇÃO','AGENDA':'AGENDA','INVENTARIO':'INVENTÁRIO'});
const original=new WeakMap(),attributeOriginal=new WeakMap();let current='es',scheduled=false;
function device(){const lang=(root.navigator.languages?.[0]||root.navigator.language||'es').toLowerCase().split('-')[0];return data[lang]?lang:'es';}
function choice(){return root.localStorage.getItem(STORE)||'auto';}
function locale(){return choice()==='auto'?device():data[choice()]?choice():'es';}
function paint(){
 const lang=locale(),dictionary=data[lang]||{};current=lang;document.documentElement.lang=lang;
 const select=document.getElementById('cfLanguageChoice');if(select&&select.value!==choice())select.value=choice();
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 let node;
 while(node=walker.nextNode()){
  const parent=node.parentElement;if(!parent||parent.closest('script,style,textarea,pre,code,[contenteditable="true"],.rdesc,.rdate,.ramount,.cfDocNodeName,[data-cf-user-content]'))continue;
  if(parent.tagName==='OPTION'&&!parent.hasAttribute('value'))parent.value=node.nodeValue.trim();
  if(!original.has(node))original.set(node,node.nodeValue);
  const raw=original.get(node),word=raw.trim();
  if(!word||word.length>400)continue;
  const undecorated=word.replace(/^[^\p{L}\p{N}]+/u,'');
  const translated=dictionary[word]||(undecorated!==word&&dictionary[undecorated]?word.slice(0,word.length-undecorated.length)+dictionary[undecorated]:word);
  const next=translated===word?raw:raw.replace(word,translated);
  if(node.nodeValue!==next)node.nodeValue=next;
 }
 // Inputs and accessibility hints must follow the same language as visible labels.
 for(const el of document.querySelectorAll('[placeholder],[title],[aria-label]')){
   let values=attributeOriginal.get(el);if(!values){values={};attributeOriginal.set(el,values);}
   for(const key of ['placeholder','title','aria-label']){
     if(!el.hasAttribute(key))continue;
     const actual=el.getAttribute(key);
     if(!(key in values))values[key]=actual;
     const source=values[key],translated=dictionary[source]||source;
     if(actual!==translated)el.setAttribute(key,translated);
   }
 }
}

function addTranslations(translations){
 for(const [lang,items] of Object.entries(translations||{})){
  if(data[lang]&&items&&typeof items==='object')Object.assign(data[lang],items);
 }
 schedule();
}
function t(phrase){return (data[locale()]||{})[String(phrase)]||String(phrase);}
function schedule(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;paint();},60);}
function setLanguage(lang){root.localStorage.setItem(STORE,lang==='auto'?'auto':data[lang]?lang:'auto');schedule();}
function start(){paint();const observer=new MutationObserver(mutations=>{if(mutations.some(m=>m.type==='childList'&&m.addedNodes.length))schedule();});observer.observe(document.body,{childList:true,subtree:true});}
root.CFi18n={setLanguage,locale,choice,refresh:schedule,addTranslations,t};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window);
