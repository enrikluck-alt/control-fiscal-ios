/* Control Fiscal V76 — datos personales en Google Sheets.
   V2: diario de cambios APEND-ONLY en CF_Registros_v2.
   NO reescribe, limpia ni cambia el esquema de ninguna hoja antigua.
   Las facturas nuevas pueden guardarse como BORRADORES o registrarse como EMITIDAS
   en pestañas nuevas separadas. La app NO certifica cumplimiento de sistemas de facturación. */
(function(root){
'use strict';
const MARK='CFV76_GOOGLE_2', OLD_MARK='CFV76_GOOGLE_1', LEDGER='CF_Registros_v2';
const API='https://sheets.googleapis.com/v4/spreadsheets/';
const ISSUED_TAB='CF_Facturas_Emitidas',ISSUED_DOC_TAB='CF_Facturas_Documentos',ISSUED_ARCHIVE_TAB='CF_Facturas_Archivadas';
const PAYMENT_TAB='CF_EstadosCobro',PAYMENT_MARK='CF_ESTADO_COBRO_1';
const has=v=>v!==undefined&&v!==null&&String(v)!=='';
const num=v=>Number(v)||0;
const now=()=>new Date().toISOString();
const ident=p=>p+'-'+(root.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2));
const parseJSON=(s,f={})=>{try{return typeof s==='string'?JSON.parse(s):s??f;}catch{return f;}};
const quote=t=>"'"+String(t).replace(/'/g,"''")+"'";
const range=(t,addr='A:U')=>encodeURIComponent(quote(t)+'!'+addr);
function session(){const s=root.CFGoogleAccount?.active();if(!s?.token||!s.id)throw Error('Inicia sesión con Google y selecciona un libro.');return s;}
function check(s){const current=root.CFGoogleAccount?.active();if(!current||current.email!==s.email||current.id!==s.id)throw Error('La cuenta ha cambiado. No se aplicaron los datos de otra sesión.');if(current.token!==s.token)s.token=current.token;}
async function api(s,path,method='GET',data){check(s);const result=await root.CFGoogleAccount.http(API+encodeURIComponent(s.id)+path,method,data,s.token);check(s);return result;}
async function read(s,tab){const r=await api(s,'/values/'+range(tab));return Array.isArray(r.values)?r.values:[];}
async function append(s,tab,row){return api(s,'/values/'+range(tab,'A:C')+':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS','POST',{values:[row]});}
const missing=e=>/Unable to parse range|not found|does not exist|Cannot find range|HTTP 400/i.test(String(e.message||e));
async function maybeRead(s,tab){try{return await read(s,tab);}catch(e){if(missing(e))return [];throw e;}}
function legacy(tab,r,idx){
 if(!r.length||!has(r[0]))return null;
 if(tab==='Clientes'){
  if(r[0]==='Nombre / Empresa'||String(r[8]).toLowerCase()==='false')return null;
  return {nombre:r[0]||'',cif:r[1]||'',direccion:r[2]||'',cp:r[3]||'',ciudad:r[4]||'',provincia:r[5]||'',telefono:r[6]||'',email:r[7]||''};
 }
 if(tab==='Inventario'){
  if(r[0]==='ID')return null;
  return {id:r[0],actualizado:r[1]||'',articulo:r[2]||'',categoria:r[3]||'',cantidad:num(r[4]),unidad:r[5]||'unidades',minimo:num(r[6]),ubicacion:r[7]||'',estado:r[8]||'Disponible',notas:r[9]||''};
 }
 if(tab==='Agenda'){
  if(r[0]==='ID')return null;
  return {id:r[0],fecha:String(r[1]||'').slice(0,10),horaInicio:r[2]||'',horaFin:r[3]||'',evento:r[4]||'',cliente:r[5]||'',ubicacion:r[6]||'',llevar:r[7]||'',comentarios:r[8]||''};
 }
 if(['Ingresos independientes','Ingresos pendientes','Ingresos'].includes(tab)){
  if(r[0]==='ID')return null;
  return {id:r[0],fecha:r[1]||'',persona:r[2]||'',servicio:r[3]||'',material:num(r[4]),cobrado:num(r[5]),beneficio:num(r[6])};
 }
 if(tab==='Compras'||tab==='Facturación'){
  if(r[0]==='Fecha')return null;
  return {fecha:r[0]||'',tercero:r[1]||'',concepto:r[2]||'',base:num(r[3]),ivaPorcentaje:num(r[4]),iva:num(r[5]),total:num(r[6]),facturaUrl:r[7]||'',numeroFactura:r[8]||'',tipo:tab==='Compras'?'Compra':'Facturación'};
 }
 return null;
}
function objectRow(tab,row,index){
 const marker=String(row[0]||'');
 if(marker===OLD_MARK||marker==='CFV78_FORM_V1'){
  const obj=parseJSON(row[2],null);return obj&&typeof obj==='object'?{...obj,_row:index+1,_tab:tab,_key:'legacy:'+tab+':'+(index+1)}:null;
 }
 if(/^CFV78_/.test(marker))return null;
 if(index===0)return null;
 const old=legacy(tab,row,index);
 return old?{...old,_row:index+1,_tab:tab,_key:'legacy:'+tab+':'+(index+1)}:null;
}
async function ledger(s){
 const rows=await maybeRead(s,LEDGER),latest=new Map(),first=new Map();
 rows.forEach((r,i)=>{
  if(r[0]!==MARK||!r[1])return;
  const e=parseJSON(r[2],null);
  if(!e||typeof e!=='object'||!e.tab||!e.key||e.key!==r[1])return;
  if(!first.has(e.key))first.set(e.key,i+1);
  latest.set(e.key,{...e,_ledgerRow:i+1,_sourceRow:first.get(e.key)});
 });
 return latest;
}
async function items(s,tab,ledgerEntries){
 const rows=await maybeRead(s,tab);
 const found=new Map();
 rows.forEach((r,i)=>{const item=objectRow(tab,r,i);if(item)found.set(item._key,item);});
 const changes=ledgerEntries||await ledger(s);
 for(const change of changes.values()){
  if(change.tab!==tab)continue;
  const old=found.get(change.key);
  if(change.deleted){found.delete(change.key);continue;}
  if(!change.data||typeof change.data!=='object')continue;
  // La fila legacy conserva su identificador. Las filas nuevas usan índices negativos
  // para que un alta nunca colisione con una fila histórica de la misma pestaña.
  const originalRow=old?._row||((change.key.startsWith('legacy:'+tab+':'))?Number(change.key.slice(('legacy:'+tab+':').length)):null);
  found.set(change.key,{...change.data,_key:change.key,_tab:tab,_row:originalRow||-change._sourceRow});
 }
 return [...found.values()];
}
async function all(s,tabs){const changes=await ledger(s);const out=[];for(const tab of tabs)out.push(...await items(s,tab,changes));return out;}
async function revision(s,tab,key,data,deleted=false){
 if(!key)throw Error('No se puede actualizar un registro sin identificador.');
 const target=data&&typeof data==='object'?{...data}:{};
 for(const k of Object.keys(target))if(k.startsWith('_'))delete target[k];
 await append(s,LEDGER,[MARK,key,JSON.stringify({key,tab,deleted,data:target,at:now()})]);
}
async function upsert(s,tab,obj,key='id',match){
 const known=await items(s,tab);
 const found=known.find(x=>match?match(x):has(obj[key])&&String(x[key]||'')===String(obj[key]));
 const value={...obj};for(const field of Object.keys(value))if(field.startsWith('_'))delete value[field];
 const recordKey=found?._key||ident('new');
 await revision(s,tab,recordKey,value);
 return recordKey;
}
async function remove(s,tab,test){const found=(await items(s,tab)).find(test);if(found)await revision(s,tab,found._key,{},true);return {ok:true};}
async function config(s){const rows=await maybeRead(s,'Configuracion'),out={};for(const r of rows)if(has(r[0])&&r[0]!=='Clave')out[r[0]]=String(r[1]||'');return out;}
async function putConfig(s,object){
 const rows=await maybeRead(s,'Configuracion');
 for(const [key,value] of Object.entries(object)){
  const i=rows.findIndex(r=>r[0]===key),pair=[key,String(value??'')];
  if(i>=0)await api(s,'/values/'+range('Configuracion','A'+(i+1)+':B'+(i+1))+'?valueInputOption=RAW','PUT',{values:[pair]});
  else await api(s,'/values/'+range('Configuracion','A:B')+':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS','POST',{values:[pair]});
 }
}
const inflightDrafts=new Map();
const inflightIssues=new Map();
async function issuedRecords(s){
 const [rows,files,archivedRows]=await Promise.all([maybeRead(s,ISSUED_TAB),maybeRead(s,ISSUED_DOC_TAB),maybeRead(s,ISSUED_ARCHIVE_TAB)]);
 const archived=new Map();for(const r of archivedRows)if(r[0]==='CF_ISSUED_ARCHIVE_1'&&r[1])archived.set(r[1],r[2]==='ocultar');
 const pdfs=new Map();for(const f of files)if(f[0]==='CF_PDF_1'&&f[1]&&/^https:\/\//.test(f[2]||''))pdfs.set(f[1],f[2]);
 return rows.map((r,index)=>{
  if(r[0]!=='CF_FACTURA_EMITIDA_1'||!r[1])return null;
  const doc=parseJSON(r[2],null);if(!doc||typeof doc!=='object')return null;
  const invoiceNumber=doc.numeroAsignado|| (doc.numbering&&root.CFInvoiceNumbering?root.CFInvoiceNumbering.format(doc.numbering,doc.sequenceIndex||index+1,doc.fecha):'CF-'+String(index+1).padStart(6,'0'));
  return {...doc,numeroFactura:invoiceNumber, facturaUrl:pdfs.get(invoiceNumber)||'',fila:index+1,emitida:true,archivada:!!archived.get(r[1]),tipo:'Facturación',estado:'EMITIDA',requestId:r[1],_tab:ISSUED_TAB};
 }).filter(Boolean);
}

// Estados de cobro en hoja separada, append-only; nunca modifica facturas emitidas.
async function paymentStates(s){
 const rows=await maybeRead(s,PAYMENT_TAB),latest=new Map();
 for(const row of rows){
  if(row[0]!==PAYMENT_MARK||!row[1])continue;
  const v=parseJSON(row[2],null);
  if(v&&['pendiente','pagada'].includes(v.estado))latest.set(String(row[1]),v);
 }
 return latest;
}
function paymentKey(rec,kind='factura'){
 const id=String(rec?.requestId||rec?.id||rec?._key||'');
 return id?kind+':'+id:'';
}
function paymentAttach(item,states,kind='factura'){
 const known=states.get(paymentKey(item,kind));
 const oldPaid=kind==='ingreso'&&Number(item.cobrado)>0;
 return {...item,estadoCobro:known?.estado||item.estadoCobro||(oldPaid?'pagada':'sin_indicar'),
  correoCobro:known?.correo||item.correoCobro||item.cliente?.email||'',
  telefonoCobro:known?.telefono||item.telefonoCobro||item.cliente?.telefono||'',
  fechaCobro:known?.fechaCobro||''};
}

function verifyEmissionDoc(p){
 const issuer=parseJSON(p.emisor),client=parseJSON(p.cliente),lines=parseJSON(p.lineas,[]);
 for(const [name,obj] of [['Emisor',issuer],['Cliente',client]]){
  const fields=name==='Emisor'?['name','taxId','address','postalCode','city','province']:['nombre','cif','direccion','cp','ciudad','provincia'];
  if(fields.some(k=>!String(obj?.[k]||'').trim()))throw Error('Completa nombre, NIF/CIF, dirección, CP, ciudad y provincia del '+name.toLowerCase()+' antes de emitir.');
 }
 if(!Array.isArray(lines)||!lines.length||lines.some(x=>!x.concepto||!(num(x.cantidad)>0)||num(x.precio)<0))throw Error('La factura requiere conceptos, cantidades y precios correctos.');
 if(!(num(p.total)>0))throw Error('La factura debe tener un importe positivo.');
 return {issuer,client,lines};
}

async function action(p){
 const s=session(),a=String(p.accion||'');
 switch(a){
 case 'syncRecords':{
  const [result,states]=await Promise.all([Promise.all([all(s,['Compras','Facturas','Facturación']),issuedRecords(s)]),paymentStates(s)]);
  const normalized=[...result[0],...result[1]].map(x=>paymentAttach({...x,fila:x._row,fecha:x.fecha||now(),tipo:x.tipo||((x._tab==='Compras')?'Compra':'Facturación')},states));
  return {ok:true,compras:normalized.filter(x=>x.tipo==='Compra'),facturacion:normalized.filter(x=>x.tipo!=='Compra')};
 }
 case 'guardarRegistro':{
  const t=p.tipo==='Compra'?'Compras':'Facturas';
  const requestId=String(p.requestId||ident('REQ'));
  // Idempotencia: si un reintento sigue a una respuesta de red perdida, no crear dos compras.
  const existing=(await items(s,t)).find(x=>x.requestId===requestId);
  if(existing)return {ok:true,id:existing.id||'',repetida:true};
  let url='';if(p.archivoBase64)url=await root.CFGoogleUploads.upload(p.archivoNombre,p.archivoMime,p.archivoBase64,s);
  const obj={id:ident('REG'),requestId,fecha:now(),tipo:p.tipo==='Compra'?'Compra':'Facturación',tercero:p.tercero,concepto:p.concepto,base:num(p.base),ivaPorcentaje:num(p.ivaPorcentaje),iva:num(p.iva),total:num(p.total),facturaUrl:url,estadoCobro:p.tipo==='Compra'?'':(p.estadoCobro==='pagada'?'pagada':'pendiente')};
  await upsert(s,t,obj);return {ok:true,id:obj.id};
 }
 case 'crearFactura':{
  const key=String(p.requestId||ident('REQ'));
  const guard=s.id+':'+key;
  if(inflightDrafts.has(guard))return inflightDrafts.get(guard);
  const operation=(async()=>{
   const existing=(await all(s,['Facturas','Facturación'])).find(x=>x.requestId===key);
   if(existing)return {ok:true,numeroFactura:existing.numeroFactura||'',borrador:existing.estado==='BORRADOR',pdfGenerado:false,repetida:true};
   // Google Sheets no ofrece un contador fiscal atómico entre distintos dispositivos.
   // En ningún caso inventamos una numeración fiscal correlativa.
   const numeroFactura='BOR-'+new Date().getFullYear()+'-'+ident('ID').replace(/^ID-/,'').replace(/-/g,'').slice(0,20);
   const doc={id:ident('FAC'),fecha:now(),tipo:'Borrador',estado:'BORRADOR',requestId:key,numeroFactura,
    tercero:p.tercero||'',concepto:p.concepto||'',base:num(p.base),ivaPorcentaje:num(p.ivaPorcentaje),iva:num(p.iva),total:num(p.total),
    cliente:parseJSON(p.cliente),lineas:parseJSON(p.lineas,[]),emisor:parseJSON(p.emisor),descuento:num(p.descuento),observaciones:p.observaciones||''};
   await upsert(s,'Facturas',doc);
   return {ok:true,numeroFactura,pdfGenerado:false,borrador:true,facturaEmitida:false};
  })();
  inflightDrafts.set(guard,operation);
  try{return await operation;}finally{inflightDrafts.delete(guard);}
 }
 case 'emitirFactura':{
  const key=String(p.requestId||'');if(key.length<10)throw Error('Falta el identificador de emisión.');
  const validation=verifyEmissionDoc(p);
  const guard=s.id+':ISSUE:'+key;
  if(inflightIssues.has(guard))return inflightIssues.get(guard);
  const issue=(async()=>{
   const existing=(await issuedRecords(s)).find(x=>x.requestId===key);
   if(existing)return {ok:true,numeroFactura:existing.numeroFactura,fecha:existing.fecha,facturaEmitida:true,repetida:true};
   // Solo una fila anexada en una pestaña DEDICADA por emisión. El número
   // corresponde a la posición de la fila que confirma Google Sheets.
   // No se sobrescriben las facturas previas y la serie CF es independiente
   // de los libros antiguos. No equivale a certificación RRSIF/VeriFactu.
   const preferences=(await config(s)).cf_invoice_numbering_v1;
   const numbering=preferences?root.CFInvoiceNumbering?.normalize(preferences):null;
   if(preferences&&!numbering)throw Error('La configuración de numeración no es válida. Corrígela antes de emitir.');
   // Serie y número son decisiones anteriores a la emisión. Si el usuario pide
   // un número personalizado, debe pertenecer al patrón configurado.
   const issuedAt=now(),history=await all(s,['Facturas','Facturación']),already=await issuedRecords(s);
   const issuedRows=await maybeRead(s,ISSUED_TAB);
   const currentNumbering=numbering||root.CFInvoiceNumbering?.DEFAULT;
   let nextIndex=issuedRows.length+1;
   if(currentNumbering&&root.CFInvoiceNumbering?.parseIndex){
    for(const invoice of already){
     const parsed=root.CFInvoiceNumbering.parseIndex(currentNumbering,invoice.numeroFactura,issuedAt);
     if(parsed!==null)nextIndex=Math.max(nextIndex,parsed+1);
    }
   }
   const requested=String(p.numeroSolicitado||'').trim();
   if(requested&&!/^[A-Za-z0-9_\-/.]{1,64}$/.test(requested))throw Error('Número solicitado no válido. Usa letras, números, guion, barra o punto.');
   let manualIndex=null;
   if(requested){
    if(!currentNumbering||!root.CFInvoiceNumbering?.parseIndex)throw Error('Configura la numeración en Ajustes antes de elegir un número.');
    manualIndex=root.CFInvoiceNumbering.parseIndex(currentNumbering,requested,issuedAt);
    if(manualIndex===null)throw Error('El número '+requested+' no coincide con la serie configurada en Ajustes ni con el año actual.');
   }
   const selectedIndex=manualIndex||nextIndex;
   const candidate=requested|| (numbering?root.CFInvoiceNumbering.format(numbering,selectedIndex,issuedAt):'CF-'+String(selectedIndex).padStart(6,'0'));
   const conflict=[...history,...already].find(x=>String(x.numeroFactura||'').toUpperCase()===candidate.toUpperCase());
   if(conflict)throw Error('El número '+candidate+' ya existe y está asignado a otra factura: '+String(conflict.tercero||'cliente no indicado').slice(0,80)+' ('+String(conflict.fecha||'sin fecha').slice(0,10)+'). No se ha emitido una factura duplicada.');
   if(manualIndex!==null&&manualIndex<nextIndex)throw Error('El número '+requested+' retrocede respecto a la siguiente numeración de la serie. No se pueden reutilizar posiciones de la secuencia.');
   const doc={id:ident('ISS'),fecha:issuedAt,tipo:'Facturación',estado:'EMITIDA',requestId:key,numbering,
    numeroAsignado:candidate,sequenceIndex:selectedIndex,
    tercero:p.tercero||validation.client.nombre,concepto:p.concepto||'',
    base:num(p.base),ivaPorcentaje:num(p.ivaPorcentaje),iva:num(p.iva),total:num(p.total),
    cliente:validation.client,emisor:validation.issuer,lineas:validation.lines,descuento:num(p.descuento),observaciones:p.observaciones||'',estadoCobro:p.estadoCobro==='pagada'?'pagada':'pendiente'};
   const resp=await append(s,ISSUED_TAB,['CF_FACTURA_EMITIDA_1',key,JSON.stringify(doc)]);
   const matched=String(resp.updates?.updatedRange||'').match(/![A-Z]+(\d+)(?::|$)/);
   if(!matched){
    const reread=(await issuedRecords(s)).find(x=>x.requestId===key);
    if(!reread)throw Error('Google no devolvió la fila de la factura; comprueba el libro antes de reintentar para evitar duplicados.');
    return {ok:true,numeroFactura:reread.numeroFactura,fecha:reread.fecha,facturaEmitida:true};
   }
   const row=Number(matched[1]);
   if(!Number.isInteger(row)||row<1)throw Error('Fila de numeración no válida. Consulta el libro de Google.');
   try{const draft=(await items(s,'Facturas')).find(x=>x.requestId===key&&x.estado==='BORRADOR');if(draft)await revision(s,'Facturas',draft._key,{},true);}catch(e){console.warn('La factura está emitida, pero el borrador anterior sigue visible',e);}
   const invoiceNumber=doc.numeroAsignado;
   return {ok:true,numeroFactura:invoiceNumber,fecha:doc.fecha,facturaEmitida:true};
  })();
  inflightIssues.set(guard,issue);try{return await issue;}finally{inflightIssues.delete(guard);}
 }
 case 'listarFacturasEmitidas':return {ok:true,facturas:await issuedRecords(s)};
 case 'ocultarFacturaEmitida':case 'restaurarFacturaEmitida':{
  const requestId=String(p.requestId||'');
  if(!requestId)throw Error('No se puede identificar la factura.');
  const invoice=(await issuedRecords(s)).find(x=>x.requestId===requestId);
  if(!invoice)throw Error('Factura no encontrada en la cuenta actual.');
  const hide=a==='ocultarFacturaEmitida';
  if(!!invoice.archivada===hide)return {ok:true,repetido:true};
  await append(s,ISSUED_ARCHIVE_TAB,['CF_ISSUED_ARCHIVE_1',requestId,hide?'ocultar':'restaurar']);
  return {ok:true,archivada:hide};
 }
 case 'listarDocumentos':{
  return {ok:true,documentos:await items(s,'Documentos')};
 }
 case 'guardarDocumento':{
  const doc=typeof p.documento==='string'?parseJSON(p.documento):p.documento;
  if(!doc||!['carpeta','archivo'].includes(doc.tipo)||!String(doc.nombre||'').trim())throw Error('Nombre y tipo de documento obligatorios.');
  const nodes=await items(s,'Documentos');
  if(doc.parentId){const parent=nodes.find(x=>x.id===doc.parentId&&x.tipo==='carpeta');if(!parent)throw Error('La carpeta de destino ya no existe.');}
  if(doc.tipo==='archivo'&&!/^https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]{15,}\/view/.test(doc.url||''))throw Error('Adjunta un documento válido de tu Drive.');
  doc.id=String(doc.id||ident('DOC'));doc.nombre=String(doc.nombre).trim().slice(0,120);
  await upsert(s,'Documentos',doc);
  return {ok:true,id:doc.id};
 }
 case 'eliminarDocumento':{
  const id=String(p.id||''),nodes=await items(s,'Documentos');const target=nodes.find(x=>x.id===id);
  if(!target)return {ok:true,alreadyDeleted:true};
  if(nodes.some(x=>x.parentId===id))throw Error('Esta carpeta contiene elementos. Vacíala antes de eliminarla.');
  await revision(s,'Documentos',target._key,{},true);return {ok:true};
 }

 case 'ocultarFacturaEmitida':case 'restaurarFacturaEmitida':{
  const requestId=String(p.requestId||'');
  if(!requestId)throw Error('No se puede identificar la factura.');
  const invoice=(await issuedRecords(s)).find(x=>x.requestId===requestId);
  if(!invoice)throw Error('Factura no encontrada en la cuenta actual.');
  const hide=a==='ocultarFacturaEmitida';
  if(!!invoice.archivada===hide)return {ok:true,repetido:true};
  await append(s,ISSUED_ARCHIVE_TAB,['CF_ISSUED_ARCHIVE_1',requestId,hide?'ocultar':'restaurar']);
  return {ok:true,archivada:hide};
 }
 case 'listarDocumentos':{
  return {ok:true,documentos:await items(s,'Documentos')};
 }
 case 'guardarDocumento':{
  const doc=typeof p.documento==='string'?parseJSON(p.documento):p.documento;
  if(!doc||!['carpeta','archivo'].includes(doc.tipo)||!String(doc.nombre||'').trim())throw Error('Nombre y tipo de documento obligatorios.');
  const nodes=await items(s,'Documentos');
  if(doc.parentId){const parent=nodes.find(x=>x.id===doc.parentId&&x.tipo==='carpeta');if(!parent)throw Error('La carpeta de destino ya no existe.');}
  if(doc.tipo==='archivo'&&!/^https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]{15,}\/view/.test(doc.url||''))throw Error('Adjunta un documento válido de tu Drive.');
  doc.id=String(doc.id||ident('DOC'));doc.nombre=String(doc.nombre).trim().slice(0,120);
  await upsert(s,'Documentos',doc);
  return {ok:true,id:doc.id};
 }
 case 'eliminarDocumento':{
  const id=String(p.id||''),nodes=await items(s,'Documentos');const target=nodes.find(x=>x.id===id);
  if(!target)return {ok:true,alreadyDeleted:true};
  if(nodes.some(x=>x.parentId===id))throw Error('Esta carpeta contiene elementos. Vacíala antes de eliminarla.');
  await revision(s,'Documentos',target._key,{},true);return {ok:true};
 }

 case 'registrarDocumentoFactura':{
  const no=String(p.numeroFactura||'');const url=String(p.url||'');
  if(!/^[A-Za-z0-9_\-/.]{1,64}$/.test(no)||!/^https:\/\/(drive\.google\.com|docs\.google\.com)\//.test(url))throw Error('Número o URL de PDF no válidos.');
  const exists=(await issuedRecords(s)).some(x=>x.numeroFactura===no);
  if(!exists)throw Error('No se encontró la factura emitida para guardar su PDF.');
  await append(s,ISSUED_DOC_TAB,['CF_PDF_1',no,url]);return {ok:true};
 }

 case 'listarTiposInventario':{
  const cfg=await config(s);const arr=parseJSON(cfg.cf_inventory_categories,[]);
  return {ok:true,tipos:Array.isArray(arr)?arr:[]};
 }
 case 'guardarTipoInventario':{
  const tipo=String(p.tipo||'').trim();if(!tipo||tipo.length>65)throw Error('El tipo de material debe tener entre 1 y 65 caracteres.');
  const cfg=await config(s),list=parseJSON(cfg.cf_inventory_categories,[]);
  const out=[...new Set([...(Array.isArray(list)?list:[]),tipo])];
  await putConfig(s,{cf_inventory_categories:JSON.stringify(out)});
  return {ok:true,tipos:out};
 }
 case 'editar':{
  const tabs=p.tab?[p.tab]:(p.tipo==='Compra'?['Compras']:['Facturas','Facturación']);
  for(const tab of tabs){
   const old=(await items(s,tab)).find(x=>p.key?x._key===String(p.key):x._row===num(p.fila));if(!old)continue;
   const tipo=old.tipo||p.tipo,ivaPorcentaje=num(p.ivaPorcentaje||old.ivaPorcentaje);
   const base=tipo==='Compra'?num(p.total||old.total)/(1+ivaPorcentaje/100):num(p.base||old.base);
   const total=tipo==='Compra'?num(p.total||old.total):base*(1+ivaPorcentaje/100);
   const updated={...old,...p,tipo,base:Number(base.toFixed(2)),ivaPorcentaje,iva:Number((total-base).toFixed(2)),total:Number(total.toFixed(2))};
   ['accion','_row','_tab','_key','fila','tab'].forEach(k=>delete updated[k]);
   await revision(s,tab,old._key,updated);return {ok:true};
  }
  throw Error('No se encontró el registro para editar.');
 }
 case 'eliminar':{
  const tabs=p.tab?[p.tab]:(p.tipo==='Compra'?['Compras']:['Facturas','Facturación']);
  for(const tab of tabs){
   const old=(await items(s,tab)).find(x=>p.key?x._key===String(p.key):x._row===num(p.fila));
   if(old){await revision(s,tab,old._key,{},true);return {ok:true,key:old._key};}
  }
  // Un registro borrado previamente devuelve éxito idempotente si la tumba existe.
  if(p.key){const changes=await ledger(s);const gone=changes.get(String(p.key));if(gone?.deleted&&tabs.includes(gone.tab))return {ok:true,alreadyDeleted:true};}
  throw Error('El registro no aparece en este libro. Actualiza la lista antes de intentar borrarlo de nuevo.');
 }
 case 'listarClientes':return {ok:true,clientes:await items(s,'Clientes')};
 case 'guardarCliente':{
  const c=parseJSON(p.cliente);if(!c.nombre||!c.cif)throw Error('Indica nombre y CIF/NIF del cliente.');
  await upsert(s,'Clientes',c,'cif',x=>Boolean(x.cif)&&String(x.cif).toLowerCase()===String(c.cif).toLowerCase());
  return {ok:true,clientes:await items(s,'Clientes')};
 }
 case 'editarCliente':{
  const c=parseJSON(p.cliente);
  if(!c.nombre||!c.cif)throw Error('El cliente necesita nombre y NIF/CIF.');
  const clients=await items(s,'Clientes');
  const original=clients.find(x=>(p.originalKey&&x._key===p.originalKey)||(p.originalCif&&String(x.cif||'').toLocaleLowerCase('es')===String(p.originalCif).toLocaleLowerCase('es')));
  if(!original)throw Error('No se encontró el cliente original. Actualiza la lista antes de editar.');
  if(clients.some(x=>x._key!==original._key&&String(x.cif||'').toLocaleLowerCase('es')===String(c.cif).toLocaleLowerCase('es')))
    throw Error('Ya existe otro cliente con ese NIF/CIF.');
  await revision(s,'Clientes',original._key,{...original,...c});
  return {ok:true,clientes:await items(s,'Clientes')};
 }
 case 'eliminarCliente':return remove(s,'Clientes',x=>x.cif===p.cif||x.nombre===p.nombre);
 case 'listarInventario':return {ok:true,items:await items(s,'Inventario')};
 case 'guardarInventario':{
  const x=parseJSON(p.item);if(!x.articulo)throw Error('Indica un artículo.');if(!x.id)x.id=ident('INV');await upsert(s,'Inventario',x);return {ok:true,id:x.id};
 }
 case 'eliminarInventario':return remove(s,'Inventario',x=>String(x.id)===String(p.id));
 case 'listarAgenda':return {ok:true,eventos:await items(s,'Agenda')};
 case 'guardarEvento':{
  const x=parseJSON(p.evento);if(!x.evento||!x.fecha)throw Error('Indica evento y fecha.');if(!x.id)x.id=ident('EV');await upsert(s,'Agenda',x);return {ok:true,id:x.id};
 }
 case 'eliminarEvento':return remove(s,'Agenda',x=>String(x.id)===String(p.id));
 case 'listarFacturasMaterialProyecto':return {ok:true,facturas:await items(s,'CF_Material_Facturas')};
 case 'guardarFacturaMaterialProyecto':{
  const x=parseJSON(p.factura);
  if(!x.proyecto||!x.proveedor||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(String(x.fecha||'')))throw Error('Indica proyecto, proveedor y fecha válida.');
  if(!(num(x.importe)>0)||!/^https:\/\/drive\.google\.com\//.test(String(x.documentoUrl||'')))throw Error('Indica importe y adjunta una factura en Drive.');
  x.id=ident('MAT');x.creado=now();x.proyecto=String(x.proyecto).trim().slice(0,120);x.proveedor=String(x.proveedor).trim().slice(0,120);x.importe=num(x.importe);
  await upsert(s,'CF_Material_Facturas',x);return {ok:true,id:x.id};
 }
 case 'listarIngresosPendientes':{const [income,states]=await Promise.all([all(s,['Ingresos','Ingresos independientes','Ingresos pendientes']),paymentStates(s)]);return {ok:true,ingresos:income.map(x=>paymentAttach(x,states,'ingreso'))};}
 case 'guardarIngresoPendiente':{
  const x=parseJSON(p.ingreso);if(!x.persona||!x.servicio)throw Error('Indica persona y servicio.');if(!x.id)x.id=ident('IP');x.fecha=x.fecha||now();x.estadoCobro=x.estadoCobro==='pagada'?'pagada':'pendiente';x.importePrevisto=num(x.importePrevisto||x.cobrado);x.cobrado=x.estadoCobro==='pagada'?x.importePrevisto:0;x.beneficio=x.cobrado-num(x.material);await upsert(s,'Ingresos',x);return {ok:true,id:x.id};
 }
 case 'cambiarEstadoCobro':{
  const kind=p.clase==='ingreso'?'ingreso':'factura';
  const key=String(p.clave||'');
  const state=String(p.estadoCobro||'');
  const email=String(p.correo||'').trim().slice(0,180),phone=String(p.telefono||'').trim().slice(0,35);
  if(!['pendiente','pagada'].includes(state))throw Error('Estado de cobro no válido.');
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Correo del cliente no válido.');
  if(phone&&!/^[+\d() .-]{6,35}$/.test(phone))throw Error('Teléfono no válido.');
  let record=null,tab='';
  if(kind==='ingreso'){
   for(const name of ['Ingresos','Ingresos independientes','Ingresos pendientes']){
    record=(await items(s,name)).find(x=>paymentKey(x,'ingreso')===key);
    if(record){tab=name;break;}
   }
  } else {
    record=[...await all(s,['Facturas','Facturación']),...await issuedRecords(s)]
      .find(x=>paymentKey(x)===key&&x.tipo!=='Compra');
  }
  if(!record)throw Error('El documento no existe en tu cuenta Google actual.');
  if(kind==='ingreso'){
    // Para ingresos independientes, registrar realmente el ingreso cobrado (0 si pendiente).
    const due=num(record.importePrevisto||record.cobrado);
    if(!(due>0))throw Error('El importe previsto debe ser mayor que cero.');
    await revision(s,tab,record._key,{...record,importePrevisto:due,estadoCobro:state,
      cobrado:state==='pagada'?due:0,beneficio:(state==='pagada'?due:0)-num(record.material),
      correoCobro:email,telefonoCobro:phone});
  }
  await append(s,PAYMENT_TAB,[PAYMENT_MARK,key,JSON.stringify({estado:state,correo:email,telefono:phone,
    fechaCobro:state==='pagada'?now():'',actualizado:now()})]);
  return {ok:true,estadoCobro:state};
 }
 case 'eliminarIngresoPendiente':{
  for(const tab of ['Ingresos','Ingresos independientes','Ingresos pendientes']){
   const old=(await items(s,tab)).find(x=>String(x.id)===String(p.id));if(old){await revision(s,tab,old._key,{},true);return {ok:true};}
  }return {ok:true};
 }
 case 'obtenerConfiguracion':return {ok:true,configuracion:await config(s)};
 case 'guardarConfiguracion':{
  await putConfig(s,parseJSON(p.configuracion));return {ok:true,configuracion:await config(s)};
 }
 case 'listarTerceros':{
  const conf=await config(s);
  const tiendas=parseJSON(conf.cf_tiendas,[]),proveedores=parseJSON(conf.cf_proveedores,[]);
  const ocultos=parseJSON(conf.cf_distribuidores_ocultos_v1,[]);
  const hidden=new Set((Array.isArray(ocultos)?ocultos:[]).map(v=>String(v).trim().toLocaleLowerCase('es')));
  try{const rows=await maybeRead(s,'Listas');for(const r of rows.slice(1)){
   if(!r[0])continue;const cat=String(r[0]).toLowerCase(),name=String(r[1]||'').trim();
   if(name){if(cat.startsWith('prov'))proveedores.push(name);else tiendas.push(name);}
  }}catch(e){if(!missing(e))throw e;}
  const unique=arr=>[...new Map((Array.isArray(arr)?arr:[]).map(v=>String(v||'').trim()).filter(Boolean)
       .filter(v=>!hidden.has(v.toLocaleLowerCase('es'))).map(v=>[v.toLocaleLowerCase('es'),v])).values()];
  const detalles=parseJSON(conf.cf_distribuidores_detalles_v1,{});
  return {ok:true,tiendas:unique(tiendas),proveedores:unique(proveedores),detalles:detalles&&typeof detalles==='object'?detalles:{}};
 }
 case 'guardarTercero':case 'eliminarTercero':case 'editarTercero':{
  const conf=await config(s);
  const categories={cf_proveedores:[...(parseJSON(conf.cf_proveedores,[])||[])],cf_tiendas:[...(parseJSON(conf.cf_tiendas,[])||[])]};
  const hidden=new Set(parseJSON(conf.cf_distribuidores_ocultos_v1,[])||[]);
  const details=parseJSON(conf.cf_distribuidores_detalles_v1,{})||{};
  const value=String(p.nombre||'').trim(),original=String(p.original||'').trim();
  if(a!=='eliminarTercero'&&!value)throw Error('Escribe el nombre del distribuidor.');
  if(value.length>150)throw Error('Nombre demasiado largo.');
  const old= a==='editarTercero'?original:value;
  const target=/prov|distribu/i.test(String(p.categoria||''))?'cf_proveedores':'cf_tiendas';
  if(a==='editarTercero'&&!old)throw Error('Falta el distribuidor original.');
  if(a!=='guardarTercero'){
    for(const arr of Object.values(categories))for(let i=arr.length-1;i>=0;i--)if(String(arr[i]).toLocaleLowerCase('es')===old.toLocaleLowerCase('es'))arr.splice(i,1);
    // Compatibilidad con la antigua pestaña de Listas, que es de solo lectura.
    if(old)hidden.add(old);
    if(details[old])delete details[old];
  }
  if(a!=='eliminarTercero'){
    if([...categories.cf_proveedores,...categories.cf_tiendas].some(v=>String(v).toLocaleLowerCase('es')===value.toLocaleLowerCase('es'))&&a==='editarTercero')
      throw Error('Ya existe un distribuidor con ese nombre.');
    if(!categories[target].some(v=>String(v).toLocaleLowerCase('es')===value.toLocaleLowerCase('es')))categories[target].push(value);
    // Editar permite devolver a la lista un nombre anteriormente oculto.
    hidden.delete(value);
    if(p.detalles){const obj=typeof p.detalles==='string'?parseJSON(p.detalles,{}):p.detalles;
      if(obj&&typeof obj==='object')details[value]={nombre:value,cif:String(obj.cif||''),direccion:String(obj.direccion||''),telefono:String(obj.telefono||''),email:String(obj.email||'')};}
  }
  await putConfig(s,{
    cf_proveedores:JSON.stringify(categories.cf_proveedores),cf_tiendas:JSON.stringify(categories.cf_tiendas),
    cf_distribuidores_ocultos_v1:JSON.stringify([...hidden]),cf_distribuidores_detalles_v1:JSON.stringify(details)
  });
  return {ok:true,detalles:details};
 }
 case 'enviarFacturas':throw Error('Enviar documentación por correo no está disponible. No se ha enviado ningún correo.');
 default:throw Error('Operación no implementada: '+a);
 }
}
root.CFGoogleData=Object.freeze({action,read,items,objectRow,MARK,LEDGER});
})(window);
