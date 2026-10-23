/* Numeración configurable e inmutable por factura: el índice es la fila confirmada
 * por Google Sheets y NUNCA se recalcula con ajustes posteriores.
 * La aplicación no sustituye a un SIF certificado ni garantiza requisitos fiscales.
 */
(function(root){'use strict';
 const DEFAULT=Object.freeze({segments:[{type:'fixed',value:'F'},{type:'year'},{type:'fixed',value:'-'},{type:'sequence',width:3,start:1}]});
 function normalize(raw){
  const data=typeof raw==='string'?JSON.parse(raw):raw;
  if(!data||!Array.isArray(data.segments)||data.segments.length<1||data.segments.length>10)throw Error('Configura entre 1 y 10 segmentos.');
  const parts=data.segments.map(part=>{
   if(part.type==='fixed'){
    const value=String(part.value??'');if(value.length>20||/[^A-Za-z0-9_\-/.]/.test(value))throw Error('Texto fijo inválido (solo letras, números, guiones, barra o punto).');
    return {type:'fixed',value};
   }
   if(part.type==='year')return {type:'year',digits:part.digits===2?2:4};
   if(part.type==='sequence'){
    const width=Number(part.width??3),start=Number(part.start??1);
    if(!Number.isInteger(width)||width<1||width>9||!Number.isInteger(start)||start<1||start>999999)throw Error('Número inicial o longitud incremental incorrectos.');
    return {type:'sequence',width,start};
   }
   throw Error('Segmento de numeración desconocido.');
  });
  if(parts.filter(x=>x.type==='sequence').length!==1)throw Error('Debe existir exactamente un segmento incremental.');
  return {segments:parts};
 }
 function format(schema,row,issuedAt){
  const s=normalize(schema),index=Number(row),date=new Date(issuedAt);
  if(!Number.isInteger(index)||index<1||Number.isNaN(date.getTime()))throw Error('Índice o fecha de emisión inválidos.');
  const year=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',year:'numeric'}).format(date);
  const value=s.segments.map(x=>x.type==='fixed'?x.value:x.type==='year'?(x.digits===2?year.slice(-2):year):String(x.start+index-1).padStart(x.width,'0')).join('');
  if(!value||value.length>64)throw Error('Código de factura vacío o demasiado largo.');
  return value;
 }
 function parseIndex(schema,code,issuedAt){
  const config=normalize(schema),date=new Date(issuedAt);
  if(Number.isNaN(date.getTime()))return null;
  const year=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',year:'numeric'}).format(date);
  const esc=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const pattern=config.segments.map(x=>x.type==='fixed'?esc(x.value):x.type==='year'?(x.digits===2?year.slice(-2):year):'(\\d{'+x.width+',})').join('');
  const matched=String(code||'').match(new RegExp('^'+pattern+'$'));
  if(!matched)return null;
  const sequence=config.segments.find(x=>x.type==='sequence');
  const sequenceValue=Number(matched[1]);const index=sequenceValue-sequence.start+1;
  if(!Number.isSafeInteger(index)||index<1)return null;
  return format(config,index,issuedAt)===code?index:null;
 }
 root.CFInvoiceNumbering=Object.freeze({DEFAULT,normalize,format,parseIndex});
})(window);
