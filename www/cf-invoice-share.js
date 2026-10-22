/* PDF vectorial A4 basado en la plantilla aportada por el usuario.
 * El documento NO afirma cumplimiento automático de VERI*FACTU/RRSIF.
 */
(function(root){'use strict';
 const money=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(Number(v)||0);
 const json=t=>{try{return typeof t==='string'?JSON.parse(t):t||{}}catch{return {}}};
 const clean=s=>String(s??'').replace(/[\r\n\t]+/g,' ').trim();
 function pdfDocument(saved){
  if(!root.CFjsPDF)throw Error('No se ha cargado el generador PDF.');
  const d=new root.CFjsPDF({unit:'mm',format:'a4'}),p=saved.payload||{},client=json(p.cliente),issuer=json(p.emisor),items=json(p.lineas);
  if(!Array.isArray(items)||!items.length)throw Error('Los conceptos de la factura están vacíos.');
  const issued=!!saved.emitida, left=19,right=191;
  const text=(s,x,y,size=10,bold=false)=>{d.setFont('helvetica',bold?'bold':'normal');d.setFontSize(size);d.text(clean(s),x,y);};
  const stroke=()=>{d.setDrawColor?.(35,38,42);};
  const rule=(y)=>{stroke();d.setLineWidth?.(.4);d.line?.(left,y,right,y);};
  const wrapped=(val,x,y,width,size=9,maxY=230)=>{
   d.setFont('helvetica','normal');d.setFontSize(size);
   for(const t of d.splitTextToSize(clean(val),width)){
    if(y>maxY){d.addPage();y=25;}
    text(t,x,y,size);y+=size*.38+2.3;
   }return y;
  };
  const prefix=issued?'FACTURA':'BORRADOR - NO EMITIDA';
  // Cabecera blanca como en la factura de ejemplo: imagen izquierda, número derecha.
  d.setTextColor(20,24,29);text(prefix,148,16,11,true);
  text('Nº: '+clean(saved.numero||'SIN NUMERO'),148,22,9,true);
  const date=saved.fecha?new Date(saved.fecha):new Date();
  text('Fecha: '+(Number.isNaN(date.getTime())?'':date.toLocaleDateString('es-ES')),148,28,9);
  text(issuer.name||'EMISOR',left,47,10,true);
  text(clean(p.titulo||p.observaciones||'Factura de servicios'),126,47,9);
  // Emisor y cliente en tabla de dos columnas.
  d.setFillColor(221,221,221);d.rect(left,53,172,8,'F');stroke();d.rect(left,53,172,56);d.line?.(105,61,105,109);
  text('EMISOR',left+2,59,9,true);text('CLIENTE',107,59,9,true);
  const issuerLines=[issuer.name,'CIF/NIF: '+(issuer.taxId||''),issuer.address,
   [issuer.postalCode,issuer.city].filter(Boolean).join(' · '),issuer.province,
   issuer.phone?'Tel.: '+issuer.phone:'',issuer.email,issuer.iban?'IBAN: '+issuer.iban:''].filter(Boolean);
  const clientLines=[client.nombre,'CIF/NIF: '+(client.cif||''),client.direccion,
   [client.cp,client.ciudad].filter(Boolean).join(' · '),client.provincia,
   client.telefono?'Tel.: '+client.telefono:'',client.email].filter(Boolean);
  issuerLines.slice(0,8).forEach((line,i)=>wrapped(line,left+2,66+i*5.2,79,8,108));
  clientLines.slice(0,8).forEach((line,i)=>wrapped(line,107,66+i*5.2,80,8,108));
  // Tabla de conceptos con encabezado gris y espacio variable de filas.
  let y=119;rule(115);d.setFillColor(195,195,195);d.rect(left,y,172,9,'F');stroke();d.rect(left,y,172,9);
  text('PRODUCTO / SERVICIO',left+2,y+6,9,true);text('PRECIO',139,y+6,8,true);text('CANT.',163,y+6,8,true);text('TOTAL',180,y+6,8,true);
  y+=12;
  let subtotalComputed=0;
  for(const line of items){
   const qty=Number(line.cantidad)||0,price=Number(line.precio)||0,total=qty*price;
   subtotalComputed+=total;
   const rows=d.splitTextToSize(clean(line.concepto),106);
   const need=Math.max(9,rows.length*4.5+3);
   if(y+need>241){d.addPage();y=23;}
   text(money(price),139,y+5,8);text(String(qty),165,y+5,8);text(money(total),178,y+5,8);
   let ty=y+5;for(const r of rows){text(r,left+2,ty,8);ty+=4.5;}
   y+=need;
   if(items.length>1&&typeof d.line==='function'){d.setDrawColor?.(230,230,230);d.line(left,y,right,y);}
  }
  if(y>232){d.addPage();y=45;}
  rule(Math.max(y+3,240));
  y=Math.max(y+11,249);
  const discount=Number(p.descuento)||0,vatPct=Number(p.ivaPorcentaje)||0;
  text('Base imponible',left,y,9);text(money(p.base??subtotalComputed),163,y,9,true);y+=7;
  if(discount){text('Descuento: '+discount+' %',left,y,9);y+=7;}
  text('IVA ('+vatPct+' %)',left,y,9);text(money(p.iva),163,y,9);y+=8;
  rule(y-5);text('TOTAL FACTURA',left,y+3,11,true);text(money(p.total),161,y+3,11,true);y+=11;
  if(y>284){d.addPage();y=34;}
  text('TOTAL A PAGAR',left,y,11,true);text(money(p.total),161,y,11,true);
  if(!issued){d.setTextColor(170,25,25);text('BORRADOR SIN EMITIR. NO VALIDO COMO FACTURA FISCAL.',left,285,9,true);}
  // Etiqueta de copia discreta; el texto y las tablas permanecen vectoriales.
  d.setTextColor(125,125,125);
  for(let k=1;k<=d.getNumberOfPages();k++){d.setPage(k);text(issued?'Control Fiscal · Copia de factura':'BORRADOR - NO ES UNA FACTURA EMITIDA',left,293,8);}
  return d;
 }
 const logoCache=new Map();
 async function loadInvoiceLogo(){
  try{
   const s=root.CFGoogleAccount?.active?.(),book=s?.id||'';
   const local=root.localStorage?.getItem?.('cf_invoice_brand_image_v1_'+book);
   if(/^data:image\/(png|jpeg|jpg);base64,/.test(local||''))return local;
   const url=root.cfInvoiceBrandUrl||'';
   const id=/https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)\//.exec(url)?.[1];
   if(id&&s?.token){
    const key=s.email+':'+id;if(logoCache.has(key))return logoCache.get(key);
    const r=await root.fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?alt=media',{headers:{Authorization:'Bearer '+s.token}});
    if(r.ok){const type=(r.headers?.get?.('Content-Type')||'image/png').split(';')[0];
     if(/^image\/(png|jpeg)$/.test(type)){
      const data=new Uint8Array(await r.arrayBuffer());if(data.length<4*1024*1024){
       let binary='';for(let i=0;i<data.length;i+=16384)binary+=String.fromCharCode(...data.subarray(i,i+16384));
       const result='data:'+type+';base64,'+root.btoa(binary);logoCache.set(key,result);return result;
      }
     }
    }
   }
   const menuImage=root.localStorage?.getItem?.('cf_home_brand_image')||'';
   if(/^data:image\/(png|jpeg|jpg);base64,/.test(menuImage))return menuImage;
   if(!root.fetch||!root.btoa)return '';
   const response=await root.fetch('chispas-logo.png');if(!response.ok)return '';
   const bytes=new Uint8Array(await response.arrayBuffer());let binary='';
   for(let k=0;k<bytes.length;k+=16384)binary+=String.fromCharCode(...bytes.subarray(k,k+16384));
   return 'data:image/png;base64,'+root.btoa(binary);
  }catch(e){root.console?.warn?.('No se puede cargar el logotipo de la factura',e);return '';}
 }
 async function generate(saved){
  if(!saved?.numero||!saved.payload)throw Error('No hay datos para generar el PDF.');
  const d=pdfDocument(saved);const image=await loadInvoiceLogo();
  if(image&&typeof d.addImage==='function'){
   try{const size=d.getImageProperties?.(image),ratio=size?.width&&size?.height?size.width/size.height:1.8;const w=Math.min(76,34*ratio),h=Math.min(34,76/ratio);d.addImage(image,/jpeg|jpg/.test(image.slice(0,32))?'JPEG':'PNG',19,7,w,h);}catch(e){root.console?.warn?.('El PDF se generó sin el logo',e);}
  }
  const prefix=saved.emitida?'FACTURA':'BORRADOR';
  const filename='ControlFiscal_'+prefix+'_'+String(saved.numero).replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,55)+'.pdf';
  const uri=d.output('datauristring');return {filename,base64:uri.slice(uri.indexOf(',')+1),bytes:d.output('arraybuffer')};
 }
 async function share(saved){
  const out=await generate(saved),native=root.CFFilesystem&&root.CFShare&&root.CFDirectory;
  if(native){
   await root.CFFilesystem.writeFile({path:out.filename,data:out.base64,directory:root.CFDirectory.Cache});
   try{const target=await root.CFFilesystem.getUri({path:out.filename,directory:root.CFDirectory.Cache});
    await root.CFShare.share({title:saved.emitida?'Factura '+saved.numero:'Borrador Control Fiscal',text:saved.emitida?'Factura '+saved.numero:'Borrador sin emitir.',files:[target.uri]});
   }finally{try{await root.CFFilesystem.deleteFile({path:out.filename,directory:root.CFDirectory.Cache});}catch(e){root.console?.warn?.('No se pudo limpiar PDF temporal',e);}}
  }else{
   const blob=new Blob([out.bytes],{type:'application/pdf'}),file=new File([blob],out.filename,{type:'application/pdf'});
   if(root.navigator?.canShare?.({files:[file]}))await root.navigator.share({files:[file],title:'Control Fiscal'});
   else{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=out.filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);}
  }
  return {filename:out.filename};
 }
 root.CFInvoiceShare=Object.freeze({pdfDocument,generate,share,loadInvoiceLogo});
})(window);
