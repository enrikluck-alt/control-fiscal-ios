/* PDF vectorial A4 basado en la plantilla aportada por el usuario.
 * El documento NO afirma cumplimiento automático de VERI*FACTU/RRSIF.
 */
(function(root){'use strict';
 const money=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(Number(v)||0);
 const json=t=>{try{return typeof t==='string'?JSON.parse(t):t||{}}catch{return {}}};
 const clean=s=>String(s??'').replace(/[\r\n\t]+/g,' ').trim();
 function pdfDocument(saved){
  if(!root.CFjsPDF)throw Error('No se ha cargado el generador PDF.');
  const d=new root.CFjsPDF({unit:'mm',format:'a4'});
  const p=saved.payload||{},client=json(p.cliente),issuer=json(p.emisor),items=json(p.lineas);
  if(!Array.isArray(items)||!items.length)throw Error('Los conceptos de la factura están vacíos.');
  const issued=!!saved.emitida;
  // Plantilla A4 del PDF aportado: cabecera blanca, identidad en dos columnas,
  // productos en tabla sombreada, total inferior destacado y logo del emisor.
  const L=7,R=203,W=196;
  const stroke=()=>{d.setDrawColor?.(20,20,20);d.setLineWidth?.(.35);};
  const text=(value,x,y,size=9,bold=false)=>{d.setFont('helvetica',bold?'bold':'normal');d.setFontSize(size);d.text(clean(value),x,y);};
  const line=(x1,y1,x2,y2,w=.4)=>{stroke();d.setLineWidth?.(w);d.line?.(x1,y1,x2,y2);};
  const rect=(x,y,w,h,fill=false)=>{stroke();d.rect(x,y,w,h,fill?'F':'S');};
  const shade=(x,y,w,h,color=196)=>{d.setFillColor(color,color,color);d.rect(x,y,w,h,'F');};
  const ellipsis=(value,maxWidth,size=8)=>{
   d.setFont('helvetica','normal');d.setFontSize(size);
   let v=clean(value);if(!d.getTextWidth)return v;
   while(v.length>1&&d.getTextWidth(v)>maxWidth)v=v.slice(0,-2)+'…';return v;
  };
  function topHeader(){
    d.setTextColor(19,19,19);
    text((issued?'FACTURA: ':'BORRADOR - NO EMITIDA: ')+clean(saved.numero||''),151,13,10,true);
    const date=saved.fecha?new Date(saved.fecha):new Date();
    text('Fecha: '+(Number.isNaN(date.getTime())?'':date.toLocaleDateString('es-ES')),151,20,9);
    text(ellipsis(issuer.name||'EMISOR',117,10),L,56,10,true);
    if(p.referencia||p.titulo){text('Presupuesto / referencia:',131,56,8,true);text(ellipsis(p.referencia||p.titulo,40,8),168,56,8);}
    shade(L,64,W,7,223);rect(L,64,W,54);line(106,71,106,118);
    text('EMISOR',L+1,69,9,true);text('Cliente',108,69,9,true);
    const issuerRows=[issuer.name,issuer.taxId?'CIF/NIF: '+issuer.taxId:'',issuer.address,
     [issuer.postalCode,issuer.city].filter(Boolean).join('  '),issuer.province,
     issuer.phone?'Tel.: '+issuer.phone:'',issuer.email,
     issuer.iban?'Nº cuenta: '+issuer.iban:''].filter(Boolean);
    const customerRows=[client.nombre,client.cif||'',client.direccion,
     [client.cp,client.ciudad].filter(Boolean).join('  '),client.provincia,
     client.telefono?'Tel.: '+client.telefono:'',client.email].filter(Boolean);
    issuerRows.slice(0,8).forEach((v,i)=>text(ellipsis(v,95,8),L+1,76+i*5.2,8,i===1));
    customerRows.slice(0,8).forEach((v,i)=>text(ellipsis(v,92,8),108,76+i*5.2,8));
    line(L,123,R,123,.85);
  }
  function tableHeader(y){
    shade(L,y,W,16,188);
    rect(L,y,W,16);
    text('Producto',L+1,y+6,9,true);
    text('Precio',143,y+6,9,true);
    text('cantidad',169,y+6,8,true);
    text('Total',187,y+6,9,true);
    line(139,y,139,y+16,.25);line(164,y,164,y+16,.25);line(182,y,182,y+16,.25);
  }
  topHeader();
  let y=130,tableBottom=244,tableTop=130;
  tableHeader(y);y+=17;
  const subtotal=items.reduce((v,r)=>v+(Number(r.cantidad)||0)*(Number(r.precio)||0),0);
  let pageItems=0;
  for(const row of items){
    const qty=Number(row.cantidad)||0,price=Number(row.precio)||0,total=qty*price;
    d.setFont('helvetica','normal');d.setFontSize(8);
    const desc=d.splitTextToSize(clean(row.concepto),129);
    const height=Math.max(6.2,desc.length*4.3+1);
    if(y+height>tableBottom){
      rect(L,tableTop,W,tableBottom-tableTop);
      d.addPage();tableBottom=245;tableTop=16;y=16;tableHeader(y);y+=17;pageItems=0;
    }
    if(pageItems%2===1)shade(L,y,W,height,244);
    desc.forEach((part,i)=>text(part,L+1,y+4.6+i*4.3,8));
    text(money(price),141,y+4.6,8);
    text(String(qty),171,y+4.6,8);
    text(money(total),184,y+4.6,8);
    y+=height;pageItems++;
  }
  // Un rectángulo alto y uniforme mantiene el mismo aspecto que el documento original.
  if(y<=tableBottom){rect(L,tableTop,W,tableBottom-tableTop);}
  else{line(L,y,R,y,.4);}
  const discount=Number(p.descuento)||0,vatPct=Number(p.ivaPorcentaje)||0;
  const base=Number(p.base??subtotal),vat=Number(p.iva)||0,total=Number(p.total)||0;
  if(y>246){d.addPage();y=27;}else y=252;
  text('Base Importe',L,y,9);
  text(money(base),183,y,9);y+=6;
  text('IVA ('+vatPct+' %)',L,y,9);
  text(money(vat),183,y,9);y+=6;
  line(L,y-2,R,y-2,.55);
  text('TOTAL FACTURA',L,y+2,10,true);text(money(total),179,y+2,10,true);y+=10;
  text('Descuento:',L,y,8);
  text(discount+' %',165,y,8);y+=6;
  line(L,y-3,R,y-3,.9);
  text('TOTAL A PAGAR',L,y+2,10,true);
  shade(178,y-2,25,7,222);text(money(total),179,y+2,9,true);
  if(!issued){d.setTextColor(166,30,30);text('BORRADOR SIN EMITIR. NO ES UNA FACTURA FISCAL.',L,292,8,true);}
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
   const response=await root.fetch('control-fiscal-logo.jpg');if(!response.ok)return '';
   const bytes=new Uint8Array(await response.arrayBuffer());let binary='';
   for(let k=0;k<bytes.length;k+=16384)binary+=String.fromCharCode(...bytes.subarray(k,k+16384));
   return 'data:image/jpeg;base64,'+root.btoa(binary);
  }catch(e){root.console?.warn?.('No se puede cargar el logotipo de la factura',e);return '';}
 }
 async function generate(saved){
  if(!saved?.numero||!saved.payload)throw Error('No hay datos para generar el PDF.');
  const d=pdfDocument(saved);const image=await loadInvoiceLogo();
  if(image&&typeof d.addImage==='function'){
   try{const size=d.getImageProperties?.(image),ratio=size?.width&&size?.height?size.width/size.height:1.8;const w=Math.min(73,33*ratio),h=Math.min(33,73/ratio);d.setPage?.(1);d.addImage(image,/jpeg|jpg/.test(image.slice(0,32))?'JPEG':'PNG',12,9,w,h);}catch(e){root.console?.warn?.('El PDF se generó sin el logo',e);}
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
