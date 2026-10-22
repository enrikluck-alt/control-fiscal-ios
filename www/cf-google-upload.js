/* Adjuntos Google Drive — bytes reales (multipart/related), no base64 dentro de MIME.
   Drive multipart es adecuado para archivos de hasta 5 MB. No crea filas fiscales
   si Google rechaza el archivo. */
(function(root){'use strict';
const MAX_BYTES=5*1024*1024;
const safeName=s=>String(s||'documento').replace(/[\x00-\x1f\/\\]/g,'_').slice(0,150);
function decode(raw){
 const value=String(raw||'').replace(/\s/g,'');
 if(!value)throw Error('Adjunto base64 vacío.');
 const estimated=(value.length/4)*3-(value.endsWith('==')?2:value.endsWith('=')?1:0);
 if(estimated>MAX_BYTES)throw Error('Adjunto superior a 5 MB. Reduce el tamaño para subirlo a Drive.');
 if(value.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(value))throw Error('Adjunto base64 inválido.');
 const binary=root.atob(value),bytes=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 return bytes;
}
async function upload(filename,mime,base64,s){
 const account=root.CFGoogleAccount?.active();
 if(!account||account.email!==s.email||account.id!==s.id||account.token!==s.token)throw Error('La cuenta ha cambiado. No se envió el documento.');
 if(!/^(application\/pdf|image\/(jpeg|png))$/.test(mime||''))throw Error('Solo se admiten archivos PDF, JPG y PNG.');
 const bytes=decode(base64);
 const boundary='cf-upload-'+Math.random().toString(36).slice(2);
 const meta={name:safeName(filename),description:'Adjunto Control Fiscal'};
 const body=new Blob([
  '--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n',
  JSON.stringify(meta),
  '\r\n--'+boundary+'\r\nContent-Type: '+mime+'\r\n\r\n',
  bytes,
  '\r\n--'+boundary+'--\r\n'
 ],{type:'multipart/related; boundary='+boundary});
 let response;
 try{
  response=await root.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink',{
   method:'POST',headers:{Authorization:'Bearer '+s.token,'Content-Type':'multipart/related; boundary='+boundary,Accept:'application/json'},body
  });
 }catch(e){throw Error('No se pudo conectar con Google Drive para enviar el archivo: '+String(e.message||e));}
 const result=await response.json().catch(()=>({}));
 if(!response.ok||!result.id)throw Error('Google Drive rechazó el adjunto (HTTP '+response.status+'): '+String(result.error?.message||'sin detalle').slice(0,200));
 const size=Number(result.size);
 if(Number.isFinite(size)&&size!==bytes.length)throw Error('El adjunto llegó con tamaño diferente. Comprueba el archivo en Google Drive antes de continuar.');
 const after=root.CFGoogleAccount?.active();
 if(!after||after.email!==s.email||after.id!==s.id||after.token!==s.token)throw Error('La sesión ha cambiado durante la subida. Comprueba el archivo en Drive.');
 return result.webViewLink||'https://drive.google.com/file/d/'+encodeURIComponent(result.id)+'/view';
}
root.CFGoogleUploads=Object.freeze({upload,MAX_BYTES});
})(window);
