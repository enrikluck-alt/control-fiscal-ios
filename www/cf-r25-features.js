/* Control Fiscal R25 — navegación de listados y adjuntos posteriores. */
(function(root){'use strict';
 const $=id=>root.document.getElementById(id);
 root.openRecordsFiltered=function(kind){
   root.openRecords();root.setRecordFilter(kind==='Compra'?'Compra':'facturas');
   const box=$('recordInfo');if(box)box.setAttribute('aria-live','polite');
 };
 root.openPendingIncomeListAll=function(){
   root.openFacturacionPage();
   root.cfR25AllIncomesShown=true;
   root.renderPendingIncomeList?.();
   const list=$('pendingIncomeList');if(list)list.scrollIntoView({behavior:'smooth',block:'nearest'});
 };
 root.cfR25UploadRecordFile=async function(file){
   if(!file)throw Error('Selecciona un documento para adjuntar.');
   const supported=new Set(['application/pdf','image/jpeg','image/png']);
   if(!supported.has(file.type)||file.size<=0||file.size>5*1024*1024)
     throw Error('Selecciona un PDF, JPG o PNG de hasta 5 MB.');
   const account=root.CFGoogleAccount?.active();
   if(!account?.token||!account?.id)throw Error('Inicia sesión en tu cuenta Google.');
   if(!root.CFR21Files?.fileToBase64||!root.CFGoogleUploads?.upload)
     throw Error('El módulo de archivos privados no está disponible.');
   const bytes=await root.CFR21Files.fileToBase64(file);
   const url=await root.CFGoogleUploads.upload(file.name,file.type,bytes,account);
   if(root.CFGoogleAccount?.active()?.id!==account.id)throw Error('Has cambiado de cuenta durante la carga.');
   if(!/^https:\/\/drive\.google\.com\//.test(url))throw Error('Google Drive no confirmó el archivo.');
   return url;
 };
 root.attachIssuedInvoicePDF=async function(){
   const record=root.cfR25CurrentRecord?.();
   const status=$('modalMsg');
   if(!record?.emitida||!record.numeroFactura||record.facturaUrl){if(status){status.className='msg err';status.textContent='La factura ya tiene PDF o no es una factura emitida.';}return;}
   const file=$('cfR25RecordFile')?.files?.[0];
   if(!file){if(status){status.className='msg err';status.textContent='Selecciona primero el PDF de la factura.';}return;}
   const button=$('cfR25IssuedAttachmentBtn');if(button)button.disabled=true;
   if(status){status.className='msg';status.textContent='Subiendo el documento al Drive privado…';}
   try{
     const url=await root.cfR25UploadRecordFile(file);
     await root.CFGoogleData.action({accion:'registrarDocumentoFactura',numeroFactura:record.numeroFactura,url});
     if(status){status.className='msg ok';status.textContent='Documento asociado correctamente a la factura emitida. No se han modificado sus datos fiscales.';}
     await root.syncFromSheets();
     if(button)button.remove();
     const view=$('cfR25ViewAttachment');if(view){view.hidden=false;view.dataset.url=url;}
   }catch(error){if(status){status.className='msg err';status.textContent='No se pudo vincular el PDF: '+(error?.message||error);}}
   finally{if(button)button.disabled=false;}
 };
})(window);
