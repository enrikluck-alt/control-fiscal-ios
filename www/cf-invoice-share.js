/* Compartir de manera explícita un BORRADOR PDF; no emite ni numera facturas fiscales. */
(function(root){
 'use strict';
 const money=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(Number(v)||0);
 const json=t=>{try{return typeof t==='string'?JSON.parse(t):t||{}}catch{return {}}};
 const clean=s=>String(s||'').replace(/[\r\n\t]+/g,' ').trim();
 function pdfDocument(saved){
  if(!root.CFjsPDF)throw Error('No se ha cargado el generador de PDF.');
  const d=new root.CFjsPDF({unit:'mm',format:'a4'}),p=saved.payload||{},client=json(p.cliente),issuer=json(p.emisor),lines=json(p.lineas);
  const width=210,margin=17;let y=22;
  const line=(text,sz=10,bold=false)=>{
   d.setFont('helvetica',bold?'bold':'normal');d.setFontSize(sz);
   for(const row of d.splitTextToSize(clean(text),width-2*margin)){
    if(y>275){d.addPage();y=24;}
    d.text(row,margin,y);y+=sz*.5+2;
   }
  };
  d.setFillColor(70,26,25);d.rect(0,0,210,29,'F');
  d.setTextColor(255,255,255);d.setFontSize(18);d.setFont('helvetica','bold');d.text('BORRADOR - NO EMITIDA',margin,18);
  d.setTextColor(35,43,51);
  y=41;line('DOCUMENTO DE PRUEBA - NO ES UNA FACTURA FISCAL',12,true);
  line('Referencia interna: '+clean(saved.numero),9);
  line('Fecha: '+new Date().toLocaleDateString('es-ES'),9);
  y+=4;line('EMISOR',12,true);
  line(issuer.name||'Emisor sin nombre');
  line('NIF/CIF: '+(issuer.taxId||''));
  line([issuer.address,issuer.postalCode,issuer.city,issuer.province].filter(Boolean).join(', '));
  y+=4;line('CLIENTE',12,true);
  line(client.nombre||'');line('CIF/NIF: '+(client.cif||''));
  line([client.direccion,client.cp,client.ciudad,client.provincia].filter(Boolean).join(', '));
  y+=6;line('CONCEPTOS',12,true);
  if(!Array.isArray(lines))throw Error('Los conceptos guardados no tienen un formato válido.');
  for(const x of lines){
   const sub=(Number(x.cantidad)||0)*(Number(x.precio)||0);
   line(clean(x.concepto)+'  |  '+(Number(x.cantidad)||0)+' x '+money(x.precio)+' = '+money(sub),9);
  }
  y+=5;line('Base imponible: '+money(p.base),11,true);
  line('IVA ('+(Number(p.ivaPorcentaje)||0)+' %): '+money(p.iva),11);
  line('TOTAL: '+money(p.total),14,true);
  if(p.observaciones){y+=4;line('Observaciones: '+clean(p.observaciones),9);}
  y+=7;line('BORRADOR SIN NUMERACION FISCAL. NO UTILIZAR COMO FACTURA EMITIDA.',10,true);
  for(let page=1;page<=d.getNumberOfPages();page++){
   d.setPage(page);
   d.setTextColor(145,40,40);d.setFontSize(8);
   d.text('BORRADOR - NO ES UNA FACTURA EMITIDA',margin,290);
  }
  return d;
 }
 async function share(saved){
  if(!saved||!saved.numero||!saved.payload)throw Error('No hay un borrador guardado para compartir.');
  const d=pdfDocument(saved);
  const filename='ControlFiscal_BORRADOR_'+String(saved.numero).replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,55)+'.pdf';
  const bytes=d.output('arraybuffer');
  const native=root.CFFilesystem&&root.CFShare&&root.CFDirectory;
  if(native){
   const asData=d.output('datauristring');
   const encoded=asData.slice(asData.indexOf(',')+1);
   await root.CFFilesystem.writeFile({path:filename,data:encoded,directory:root.CFDirectory.Cache});
   try{
     const target=await root.CFFilesystem.getUri({path:filename,directory:root.CFDirectory.Cache});
     await root.CFShare.share({title:'Borrador Control Fiscal',text:'Borrador sin emitir. No válido como factura fiscal.',files:[target.uri]});
   }finally{
     // Un PDF contiene datos fiscales sensibles; no conservarlo en caché después de compartir.
     try{await root.CFFilesystem.deleteFile({path:filename,directory:root.CFDirectory.Cache});}catch(e){console.warn('No se pudo limpiar el PDF temporal',e);}
   }
  }else{
   const blob=new Blob([bytes],{type:'application/pdf'});
   const file=new File([blob],filename,{type:'application/pdf'});
   if(root.navigator?.canShare?.({files:[file]}))await root.navigator.share({files:[file],title:'Borrador Control Fiscal'});
   else{
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),3000);
   }
  }
  return {filename};
 }
 root.CFInvoiceShare=Object.freeze({pdfDocument,share});
})(window);
