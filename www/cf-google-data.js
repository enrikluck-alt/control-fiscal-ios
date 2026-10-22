/* Control Fiscal V76 — datos personales en Google Sheets.
   V2: diario de cambios APEND-ONLY en CF_Registros_v2.
   NO reescribe, limpia ni cambia el esquema de ninguna hoja antigua.
   Las facturas nuevas pueden guardarse como BORRADORES o registrarse como EMITIDAS
   en pestañas nuevas separadas. La app NO certifica cumplimiento de sistemas de facturación. */
(function(root){
'use strict';
const MARK='CFV76_GOOGLE_2', OLD_MARK='CFV76_GOOGLE_1', LEDGER='CF_Registros_v2';
const API='https://sheets.googleapis.com/v4/spreadsheets/';
const ISSUED_TAB='CF_Facturas_Emitidas',ISSUED_DOC_TAB='CF_Facturas_Documentos';
const has=v=>v!==undefined&&v!==null&&String(v)!=='';
const num=v=>Number(v)||0;
const now=()=>new Date().toISOString();
const ident=p=>p+'-'+(root.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2));
const parseJSON=(s,f={})=>{try{return typeof s==='string'?JSON.parse(s):s??f;}catch{return f;}};
const quote=t=>"'"+String(t).replace(/'/g,"''")+"'";
const range=(t,addr='A:U')=>encodeURIComponent(quote(t)+'!'+addr);
function session(){const s=root.CFGoogleAccount?.active();if(!s?.token||!s.id)throw Error('Inicia sesión con Google y selecciona un libro.');return s;}
function check(s){const current=root.CFGoogleAccount?.active();if(!current||current.email!==s.email||current.id!==s.id||current.token!==s.token)throw Error('La cuenta ha cambiado. No se aplicaron los datos de otra sesión.');}
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
 const [rows,files]=await Promise.all([maybeRead(s,ISSUED_TAB),maybeRead(s,ISSUED_DOC_TAB)]);
 const pdfs=new Map();for(const f of files)if(f[0]==='CF_PDF_1'&&f[1]&&/^https:\/\//.test(f[2]||''))pdfs.set(f[1],f[2]);
 return rows.map((r,index)=>{
  if(r[0]!=='CF_FACTURA_EMITIDA_1'||!r[1])return null;
  const doc=parseJSON(r[2],null);if(!doc||typeof doc!=='object')return null;
  const invoiceNumber='CF-'+String(index+1).padStart(6,'0');
  return {...doc,numeroFactura:invoiceNumber, facturaUrl:pdfs.get(invoiceNumber)||'',fila:index+1,emitida:true,tipo:'Facturación',estado:'EMITIDA',requestId:r[1],_tab:ISSUED_TAB};
 }).filter(Boolean);
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
  const result=[...await all(s,['Compras','Facturas','Facturación']),...await issuedRecords(s)];
  const normalized=result.map(x=>({...x,fila:x._row,fecha:x.fecha||now(),tipo:x.tipo||((x._tab==='Compras')?'Compra':'Facturación')}));
  return {ok:true,compras:normalized.filter(x=>x.tipo==='Compra'),facturacion:normalized.filter(x=>x.tipo!=='Compra')};
 }
 case 'guardarRegistro':{
  const t=p.tipo==='Compra'?'Compras':'Facturas';
  let url='';if(p.archivoBase64)url=await root.CFGoogleUploads.upload(p.archivoNombre,p.archivoMime,p.archivoBase64,s);
  const obj={id:ident('REG'),fecha:now(),tipo:p.tipo==='Compra'?'Compra':'Facturación',tercero:p.tercero,concepto:p.concepto,base:num(p.base),ivaPorcentaje:num(p.ivaPorcentaje),iva:num(p.iva),total:num(p.total),facturaUrl:url};
  await upsert(s,t,obj);return {ok:true};
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
   const doc={id:ident('ISS'),fecha:now(),tipo:'Facturación',estado:'EMITIDA',requestId:key,
    tercero:p.tercero||validation.client.nombre,concepto:p.concepto||'',
    base:num(p.base),ivaPorcentaje:num(p.ivaPorcentaje),iva:num(p.iva),total:num(p.total),
    cliente:validation.client,emisor:validation.issuer,lineas:validation.lines,descuento:num(p.descuento),observaciones:p.observaciones||''};
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
   return {ok:true,numeroFactura:'CF-'+String(row).padStart(6,'0'),fecha:doc.fecha,facturaEmitida:true};
  })();
  inflightIssues.set(guard,issue);try{return await issue;}finally{inflightIssues.delete(guard);}
 }
 case 'listarFacturasEmitidas':return {ok:true,facturas:await issuedRecords(s)};
 case 'registrarDocumentoFactura':{
  const no=String(p.numeroFactura||'');const url=String(p.url||'');
  if(!/^CF-\d{6,}$/.test(no)||!/^https:\/\/(drive\.google\.com|docs\.google\.com)\//.test(url))throw Error('Número o URL de PDF no válidos.');
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
   const old=(await items(s,tab)).find(x=>x._row===num(p.fila));if(!old)continue;
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
  for(const tab of tabs){const old=(await items(s,tab)).find(x=>x._row===num(p.fila));if(old){await revision(s,tab,old._key,{},true);return {ok:true};}}
  throw Error('El registro ya no existe.');
 }
 case 'listarClientes':return {ok:true,clientes:await items(s,'Clientes')};
 case 'guardarCliente':{
  const c=parseJSON(p.cliente);if(!c.nombre||!c.cif)throw Error('Indica nombre y CIF/NIF del cliente.');
  await upsert(s,'Clientes',c,'cif',x=>Boolean(x.cif)&&String(x.cif).toLowerCase()===String(c.cif).toLowerCase());
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
 case 'listarIngresosPendientes':return {ok:true,ingresos:await all(s,['Ingresos','Ingresos independientes','Ingresos pendientes'])};
 case 'guardarIngresoPendiente':{
  const x=parseJSON(p.ingreso);if(!x.persona||!x.servicio)throw Error('Indica persona y servicio.');if(!x.id)x.id=ident('IP');x.fecha=x.fecha||now();await upsert(s,'Ingresos',x);return {ok:true,id:x.id};
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
  const conf=await config(s),tiendas=parseJSON(conf.cf_tiendas,[]),proveedores=parseJSON(conf.cf_proveedores,[]);
  try{const rows=await maybeRead(s,'Listas');for(const r of rows.slice(1)){
   if(!r[0])continue;const cat=String(r[0]).toLowerCase(),name=String(r[1]||'').trim();
   if(name){if(cat.startsWith('prov'))proveedores.push(name);else tiendas.push(name);}
  }}catch(e){if(!missing(e))throw e;}
  return {ok:true,tiendas:[...new Set(tiendas)],proveedores:[...new Set(proveedores)]};
 }
 case 'guardarTercero':case 'eliminarTercero':{
  const cat=/prov/i.test(String(p.categoria))?'cf_proveedores':'cf_tiendas',conf=await config(s);let arr=parseJSON(conf[cat],[]);
  if(a==='guardarTercero')arr=[...new Set([...arr,p.nombre])];else arr=arr.filter(x=>x!==p.nombre);
  await putConfig(s,{[cat]:JSON.stringify(arr)});return {ok:true};
 }
 case 'enviarFacturas':throw Error('Enviar documentación por correo no está disponible. No se ha enviado ningún correo.');
 default:throw Error('Operación no implementada: '+a);
 }
}
root.CFGoogleData=Object.freeze({action,read,items,objectRow,MARK,LEDGER});
})(window);
