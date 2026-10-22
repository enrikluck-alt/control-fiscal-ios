/* PDF de facturas y borradores, copias privadas en caché solo durante compartir.
 * No declara cumplimiento RRSIF/VERI*FACTU. Numeración asignada en Sheets.
 */
(function(root){'use strict';
 const money=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(Number(v)||0);
 const json=t=>{try{return typeof t==='string'?JSON.parse(t):t||{}}catch{return {}}};
 const clean=s=>String(s||'').replace(/[\r\n\t]+/g,' ').trim();
 function pdfDocument(saved){
  if(!root.CFjsPDF)throw Error('No se ha cargado el generador PDF.');
  const d=new root.CFjsPDF({unit:'mm',format:'a4'}),p=saved.payload||{},client=json(p.cliente),issuer=json(p.emisor),lines=json(p.lineas);
  const issued=!!saved.emitida,width=210,margin=17;let y=22;
  const line=(text,sz=10,bold=false)=>{
   d.setFont('helvetica',bold?'bold':'normal');d.setFontSize(sz);
   for(const row of d.splitTextToSize(clean(text),width-2*margin)){
    if(y>275){d.addPage();y=24;}
    d.text(row,margin,y);y+=sz*.5+2;
   }
  };
  d.setFillColor(32,42,50);d.rect(0,0,210,37,'F');
  d.setTextColor(255,255,255);d.setFontSize(17);d.setFont('helvetica','bold');d.text(issued?'FACTURA':'BORRADOR - NO EMITIDA',margin,18);
  d.setTextColor(35,43,51);y=47;
  line(issued?'Nº de factura: '+clean(saved.numero):'DOCUMENTO DE PRUEBA - NO ES UNA FACTURA FISCAL',12,true);
  if(!issued)line('Referencia interna: '+clean(saved.numero),9);
  line('Fecha de emisión: '+(saved.fecha?new Date(saved.fecha).toLocaleDateString('es-ES'):new Date().toLocaleDateString('es-ES')),10);
  y+=5;line('EMISOR',12,true);
  line(issuer.name||'');line('NIF/CIF: '+(issuer.taxId||''));
  line([issuer.address,issuer.postalCode,issuer.city,issuer.province].filter(Boolean).join(', '));
  if(issuer.email)line('Correo: '+issuer.email,9);if(issuer.phone)line('Teléfono: '+issuer.phone,9);if(issuer.iban)line('IBAN: '+issuer.iban,9);
  y+=5;line('CLIENTE',12,true);
  line(client.nombre||'');line('CIF/NIF: '+(client.cif||''));
  line([client.direccion,client.cp,client.ciudad,client.provincia].filter(Boolean).join(', '));
  if(client.email)line('Correo: '+client.email,9);
  y+=7;line('CONCEPTOS',12,true);
  if(!Array.isArray(lines))throw Error('Los conceptos no son válidos.');
  for(const x of lines){const sub=(Number(x.cantidad)||0)*(Number(x.precio)||0);
   line(clean(x.concepto)+'  |  '+(Number(x.cantidad)||0)+' × '+money(x.precio)+' = '+money(sub),9);
  }
  y+=5;if(Number(p.descuento)>0)line('Descuento: '+p.descuento+' %',10);
  line('Base imponible: '+money(p.base),11,true);
  line('IVA ('+(Number(p.ivaPorcentaje)||0)+' %): '+money(p.iva),11);
  line('TOTAL: '+money(p.total),14,true);
  if(p.observaciones){y+=4;line('Observaciones: '+clean(p.observaciones),9);}
  if(!issued){y+=7;line('BORRADOR SIN NUMERACION FISCAL. NO UTILIZAR COMO FACTURA EMITIDA.',10,true);}
  for(let page=1;page<=d.getNumberOfPages();page++){
   d.setPage(page);d.setTextColor(145,145,145);d.setFontSize(8);
   d.text(issued?'Copia de factura · Control Fiscal':'BORRADOR - NO ES UNA FACTURA EMITIDA',margin,290);
  }
  return d;
 }
 async function addLogo(d){
  if(typeof d.addImage!=='function')return;
  try{
   let imageData=root.localStorage?.getItem?.('cf_home_brand_image')||'';
   if(!/^data:image\/(png|jpeg|jpg);base64,/.test(imageData)){
    if(!root.fetch||!root.btoa)return;
    const r=await root.fetch('chispas-logo.png');if(!r.ok)return;
    const bytes=new Uint8Array(await r.arrayBuffer());let binary='';
    for(let k=0;k<bytes.length;k+=16384)binary+=String.fromCharCode(...bytes.subarray(k,k+16384));
    imageData='data:image/png;base64,'+root.btoa(binary);
   }
   d.addImage(imageData,/jpeg|jpg/.test(imageData.slice(0,30))?'JPEG':'PNG',164,5,29,28);
  }catch(e){console.warn('El PDF se generó sin logo porque no se pudo cargar.',e);}
 }
 async function generate(saved){
  if(!saved?.numero||!saved.payload)throw Error('No hay datos de factura para generar el PDF.');
  const d=pdfDocument(saved);await addLogo(d);
  const prefix=saved.emitida?'FACTURA':'BORRADOR';
  const filename='ControlFiscal_'+prefix+'_'+String(saved.numero).replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,55)+'.pdf';
  const asData=d.output('datauristring');return {filename,base64:asData.slice(asData.indexOf(',')+1),bytes:d.output('arraybuffer')};
 }
 async function share(saved){
  const out=await generate(saved),native=root.CFFilesystem&&root.CFShare&&root.CFDirectory;
  if(native){
   await root.CFFilesystem.writeFile({path:out.filename,data:out.base64,directory:root.CFDirectory.Cache});
   try{const target=await root.CFFilesystem.getUri({path:out.filename,directory:root.CFDirectory.Cache});
    await root.CFShare.share({title:saved.emitida?'Factura '+saved.numero:'Borrador Control Fiscal',text:saved.emitida?'Factura '+saved.numero:'Borrador sin emitir. No válido como factura fiscal.',files:[target.uri]});
   }finally{try{await root.CFFilesystem.deleteFile({path:out.filename,directory:root.CFDirectory.Cache});}catch(e){console.warn('No se pudo limpiar PDF temporal',e);}}
  }else{
   const blob=new Blob([out.bytes],{type:'application/pdf'}),file=new File([blob],out.filename,{type:'application/pdf'});
   if(root.navigator?.canShare?.({files:[file]}))await root.navigator.share({files:[file],title:'Control Fiscal'});
   else{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=out.filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);}
  }
  return {filename:out.filename};
 }
 root.CFInvoiceShare=Object.freeze({pdfDocument,generate,share});
})(window);
