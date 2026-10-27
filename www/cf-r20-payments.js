/* Control Fiscal R20 · cobros en el Google Sheets del propietario.
   WhatsApp/correo: solo abre un borrador, nunca envía mensajes automáticamente. */
(function(root){'use strict';
 let selected=null;
 const $=id=>document.getElementById(id);
 const text=s=>String(s||'').trim();
 const euro=n=>(Number(n)||0).toLocaleString('es-ES',{style:'currency',currency:'EUR'});
 const number=x=>Math.max(0,Number(x)||0);
 const validEmail=e=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
 const validPhone=p=>/^\+?[0-9\s().-]{6,35}$/.test(p);
 function invoiceKey(r){return 'factura:'+text(r?.requestId||r?.id||r?._key);}
 function open(kind,id){
  const isIncome=kind==='ingreso';
  const record=isIncome
   ?(root.CFR20Data?.incomes?.()||[]).find(x=>String(x.id)===String(id))
   :(root.CFR20Data?.records?.()||[]).find(x=>invoiceKey(x)===String(id));
  if(!record){root.showToastMessage?.('Registro no encontrado','Actualiza los datos de Google Sheets y vuelve a intentarlo.');return;}
  if(!isIncome&&record.tipo==='Compra')return;
  selected={kind:isIncome?'ingreso':'factura',key:isIncome?'ingreso:'+record.id:invoiceKey(record),id:String(id),record};
  const amount=isIncome?number(record.importePrevisto||record.cobrado):number(record.total);
  $('cfR20PaymentTitle').textContent='💶 Cobro · '+(isIncome?'Ingreso independiente':text(record.numeroFactura)||'Factura');
  $('cfR20PaymentSummary').textContent=(isIncome?text(record.persona):text(record.tercero))+' · '+euro(amount)+' · '+text(record.concepto||record.servicio);
  $('cfR20PaymentState').value=['pagada','parcial'].includes(record.estadoCobro)?record.estadoCobro:'pendiente';
  $('cfR22PaidAmount').value=String(number(record.cobrado));
  root.CFR22?.refreshPaymentDue?.();
  $('cfR20PaymentEmail').value=text(record.correoCobro||record.cliente?.email);
  $('cfR20PaymentPhone').value=text(record.telefonoCobro||record.cliente?.telefono);
  $('cfR20PaymentStatus').textContent='';
  $('cfR20PaymentModal').classList.remove('hidden');
 }
 function openCurrent(){
  const r=root.CFR20Data?.editingRecord?.();
  if(!r)return;
  open('factura',invoiceKey(r));
 }
 function close(){selected=null;$('cfR20PaymentModal')?.classList.add('hidden');}
 async function save(){
  const msg=$('cfR20PaymentStatus'),btn=$('cfR20PaymentSaveBtn');
  if(!selected)return;
  const estadoCobro=$('cfR20PaymentState').value,correo=text($('cfR20PaymentEmail').value),telefono=root.CFR22?.normalizeContactPhone?.('payment')||text($('cfR20PaymentPhone').value);
  const cobradoParcial=number($('cfR22PaidAmount')?.value);const total=selected.kind==='ingreso'?number(selected.record.importePrevisto||selected.record.cobrado):number(selected.record.total);
  if(estadoCobro==='parcial'&&!(cobradoParcial>0&&cobradoParcial<total)){msg.className='msg err';msg.textContent='El importe abonado debe estar entre 0 € y el total.';return;}
  if(correo&&!validEmail(correo)){msg.className='msg err';msg.textContent='Comprueba el correo electrónico del cliente.';return;}
  if(telefono&&!validPhone(telefono)){msg.className='msg err';msg.textContent='Introduce un teléfono válido. Comprueba el país y los dígitos.';return;}
  if(estadoCobro==='pendiente'&&selected.record.estadoCobro==='pagada'&&!confirm('¿Marcar de nuevo como pendiente un importe anteriormente cobrado? Comprueba el movimiento bancario y cualquier devolución antes de continuar.'))return;
  btn.disabled=true;msg.className='msg';msg.textContent='Guardando estado de cobro en tu Google Sheets…';
  const identity=selected.key;
  try{
   const result=await root.callAction({accion:'cambiarEstadoCobro',clase:selected.kind,clave:identity,estadoCobro,cobradoParcial,correo,telefono});
   if(result?.ok!==true)throw Error('Google Sheets no ha confirmado la actualización.');
   if(selected.kind==='ingreso')await root.loadPendingIncome(false);
   else await root.syncFromSheets();
   const fresh=selected.kind==='ingreso'?(root.CFR20Data?.incomes?.()||[]).find(x=>'ingreso:'+x.id===identity):(root.CFR20Data?.records?.()||[]).find(x=>invoiceKey(x)===identity);
   if(fresh)selected.record=fresh;
   msg.className='msg ok';msg.textContent='✅ Guardado. El cambio de cobro está en tus hojas privadas de Google.';
  }catch(e){msg.className='msg err';msg.textContent=e.message||String(e);}
  finally{btn.disabled=false;}
 }
 async function launchUrl(url){
  const launcher=root.Capacitor?.Plugins?.AppLauncher;
  if(launcher?.openUrl){await launcher.openUrl({url});return;}
  // Fallback web. La apertura real queda sujeta a las aplicaciones del sistema.
  root.location.href=url;
 }
 async function remind(channel){
  const msg=$('cfR20PaymentStatus');if(!selected)return;
  if($('cfR20PaymentState').value==='pagada'){
   msg.className='msg err';msg.textContent='El cobro figura como pagado. Cambia primero su estado si realmente sigue pendiente.';return;
  }
  const rec=selected.record;
  const amount=selected.kind==='ingreso'?number(rec.importePrevisto||rec.cobrado):number(rec.total);
  const state=$('cfR20PaymentState').value;const paid=state==='pagada'?amount:state==='parcial'?number($('cfR22PaidAmount')?.value):0;
  const remaining=Math.max(0,Math.round((amount-paid)*100)/100);
  const savedState=['pagada','parcial'].includes(rec.estadoCobro)?rec.estadoCobro:'pendiente';
  const savedPaid=savedState==='pagada'?amount:savedState==='parcial'?number(rec.cobrado):0;
  if(state!==savedState||Math.abs(savedPaid-paid)>0.009){msg.className='msg err';msg.textContent='Has cambiado el estado o importe recibido. Pulsa primero GUARDAR ESTADO Y CONTACTO para que el recordatorio refleje el saldo confirmado en Google Sheets.';return;}
  if(remaining<=0){msg.className='msg err';msg.textContent='No queda nada por cobrar.';return;}
  const name=text(rec.tercero||rec.persona),reference=text(rec.numeroFactura||rec.servicio||rec.concepto||'servicio');
  const body=`Hola, ${name}. Te escribimos para recordarte que tenemos pendiente de recibir el pago de ${euro(remaining)} correspondiente a ${reference} (importe acordado: ${euro(amount)}, recibido: ${euro(paid)}). Si ya has realizado el pago, por favor ignora este aviso e indícanoslo. Muchas gracias.`;
  if(channel==='gmail'){
   const email=text($('cfR20PaymentEmail').value);
   if(!validEmail(email)){msg.className='msg err';msg.textContent='Introduce el correo electrónico del cliente.';return;}
   if(!confirm('¿Enviar AHORA un recordatorio por Gmail a '+email+' por '+euro(remaining)+'? La app enviará el mensaje directamente desde tu cuenta, no abrirá un borrador.'))return;
   const button=$('cfR20PaymentGmail');button.disabled=true;
   msg.className='msg';msg.textContent='Enviando mediante tu Gmail…';
   try{
    const out=await root.CFGoogleExtras?.sendPaymentReminder?.({recipient:email,customer:name,reference,amount:remaining});
    if(!out?.id)throw Error('Gmail no ha confirmado el envío.');
    msg.className='msg ok';msg.textContent='✅ Gmail confirmó el envío del recordatorio a '+email+'.';
   }catch(e){msg.className='msg err';msg.textContent='No enviado: '+String(e.message||e)+'. Revisa los permisos Gmail API si aparece HTTP 403.';}
   finally{button.disabled=false;}
   return;
  }
  if(channel==='whatsapp'){
   const raw=root.CFR22?.normalizeContactPhone?.('payment')||text($('cfR20PaymentPhone').value);
   if(!validPhone(raw)){msg.className='msg err';msg.textContent='Primero introduce el teléfono del cliente con prefijo internacional.';return;}
   const phone=raw.replace(/[^\d]/g,'');
   if(!raw.startsWith('+')){msg.className='msg err';msg.textContent='Confirma el país del destinatario antes de enviar.';return;}
   if(!confirm('Se abrirá WhatsApp para el número '+raw+'. Revisa el destinatario y el mensaje antes de enviarlo.'))return;
   try{await launchUrl('https://wa.me/'+phone+'?text='+encodeURIComponent(body));}
   catch(e){msg.textContent='No se pudo abrir WhatsApp: '+(e.message||e);msg.className='msg err';}
  }else{
   const email=text($('cfR20PaymentEmail').value);
   if(!validEmail(email)){msg.className='msg err';msg.textContent='Introduce el correo electrónico del cliente.';return;}
   if(!confirm('Se abrirá un correo dirigido a '+email+'. Tendrás que pulsar Enviar en tu aplicación de correo.'))return;
   const subject='Recordatorio de pago · '+reference;
   try{await launchUrl('mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body));}
   catch(e){msg.textContent='No se pudo abrir Correo: '+(e.message||e);msg.className='msg err';}
  }
 }
 // Conservar las funciones como globales para los manejadores declarados en el HTML.
 root.openCFPayment=open;root.openCFPaymentForCurrent=openCurrent;root.closeCFPayment=close;
 root.saveCFPayment=save;root.sendCFPaymentReminder=remind;
 root.CFR20Payments=Object.freeze({invoiceKey,validEmail,validPhone});
 root.CFi18n?.addTranslations?.({
  en:{'Estado del pago':'Payment status','🟠 Pendiente de pago':'🟠 Payment pending','✅ Pago recibido':'✅ Payment received','Quiero recibir una respuesta por correo electrónico.':'I would like to receive an email reply.','Correo del cliente':'Customer email','Importe a cobrar':'Amount due','Realmente cobrado':'Actually received','Teléfono / WhatsApp (con prefijo internacional)':'Phone / WhatsApp (international prefix)','💾 GUARDAR ESTADO Y CONTACTO':'💾 SAVE PAYMENT STATUS AND CONTACT','💬 Preparar WhatsApp':'💬 Compose WhatsApp','✉️ Preparar correo':'✉️ Compose email','📤 Enviar con Gmail':'📤 Send with Gmail','🟠 GESTIONAR COBRO / ENVIAR RECORDATORIO':'🟠 PAYMENT STATUS / SEND REMINDER','Pago recibido. Si no lo marcas, quedará pendiente y aparecerá una etiqueta naranja.':'Payment received. Otherwise, the invoice will be marked pending in orange.'},
  fr:{'Estado del pago':'Statut du paiement','🟠 Pendiente de pago':'🟠 Paiement en attente','✅ Pago recibido':'✅ Paiement reçu','Quiero recibir una respuesta por correo electrónico.':'Je souhaite recevoir une réponse par e-mail.','Correo del cliente':'E-mail du client','Importe a cobrar':'Montant à percevoir','Realmente cobrado':'Montant encaissé','💾 GUARDAR ESTADO Y CONTACTO':'💾 ENREGISTRER LE PAIEMENT','💬 Preparar WhatsApp':'💬 Préparer WhatsApp','✉️ Preparar correo':'✉️ Préparer un e-mail','📤 Enviar con Gmail':'📤 Envoyer via Gmail'},
  de:{'Estado del pago':'Zahlungsstatus','🟠 Pendiente de pago':'🟠 Zahlung ausstehend','✅ Pago recibido':'✅ Zahlung erhalten','Quiero recibir una respuesta por correo electrónico.':'Ich möchte eine Antwort per E-Mail erhalten.','Correo del cliente':'E-Mail des Kunden','Importe a cobrar':'Offener Betrag','Realmente cobrado':'Tatsächlich erhalten','💾 GUARDAR ESTADO Y CONTACTO':'💾 ZAHLUNGSSTATUS SPEICHERN','💬 Preparar WhatsApp':'💬 WhatsApp vorbereiten','✉️ Preparar correo':'✉️ E-Mail vorbereiten','📤 Enviar con Gmail':'📤 Mit Gmail senden'},
  it:{'Estado del pago':'Stato del pagamento','🟠 Pendiente de pago':'🟠 Pagamento in sospeso','✅ Pago recibido':'✅ Pagamento ricevuto','Quiero recibir una respuesta por correo electrónico.':'Desidero ricevere una risposta via email.','Correo del cliente':'Email cliente','Importe a cobrar':'Importo dovuto','Realmente cobrado':'Importo incassato','💾 GUARDAR ESTADO Y CONTACTO':'💾 SALVA STATO PAGAMENTO','💬 Preparar WhatsApp':'💬 Prepara WhatsApp','✉️ Preparar correo':'✉️ Prepara email','📤 Enviar con Gmail':'📤 Invia con Gmail'},
  pt:{'Estado del pago':'Estado do pagamento','🟠 Pendiente de pago':'🟠 Pagamento pendente','✅ Pago recibido':'✅ Pagamento recebido','Quiero recibir una respuesta por correo electrónico.':'Quero receber uma resposta por e-mail.','Correo del cliente':'E-mail do cliente','Importe a cobrar':'Valor a receber','Realmente cobrado':'Valor recebido','💾 GUARDAR ESTADO Y CONTACTO':'💾 GUARDAR ESTADO DO PAGAMENTO','💬 Preparar WhatsApp':'💬 Preparar WhatsApp','✉️ Preparar correo':'✉️ Preparar e-mail','📤 Enviar con Gmail':'📤 Enviar com Gmail'},
  ca:{'Estado del pago':'Estat del pagament','🟠 Pendiente de pago':'🟠 Pagament pendent','✅ Pago recibido':'✅ Pagament rebut','Quiero recibir una respuesta por correo electrónico.':'Vull rebre una resposta per correu electrònic.','Correo del cliente':'Correu del client','Importe a cobrar':'Import pendent','Realmente cobrado':'Cobrat realment','💾 GUARDAR ESTADO Y CONTACTO':'💾 DESAR ESTAT DEL COBRAMENT','✉️ Preparar correo':'✉️ Preparar correu','📤 Enviar con Gmail':'📤 Enviar amb Gmail'},
  nl:{'Estado del pago':'Betaalstatus','🟠 Pendiente de pago':'🟠 Betaling openstaand','✅ Pago recibido':'✅ Betaling ontvangen','Quiero recibir una respuesta por correo electrónico.':'Ik wil graag een antwoord per e-mail ontvangen.','Correo del cliente':'E-mailadres van klant','Importe a cobrar':'Openstaand bedrag','Realmente cobrado':'Werkelijk ontvangen','💾 GUARDAR ESTADO Y CONTACTO':'💾 BETALING OPSLAAN','✉️ Preparar correo':'✉️ E-mail opstellen','📤 Enviar con Gmail':'📤 Verzenden via Gmail'},
  pl:{'Estado del pago':'Status płatności','🟠 Pendiente de pago':'🟠 Oczekuje na płatność','✅ Pago recibido':'✅ Zapłacono','Quiero recibir una respuesta por correo electrónico.':'Chcę otrzymać odpowiedź e-mailem.','Correo del cliente':'E-mail klienta','Importe a cobrar':'Kwota do zapłaty','Realmente cobrado':'Faktycznie otrzymano','💾 GUARDAR ESTADO Y CONTACTO':'💾 ZAPISZ STATUS PŁATNOŚCI','✉️ Preparar correo':'✉️ Przygotuj e-mail','📤 Enviar con Gmail':'📤 Wyślij przez Gmail'}
 });

})(window);
