/* Control Fiscal R28 · utilidades puras del importador de compras web.
   Sin acceso a Firebase, Drive ni datos privados. */
export const MARK = 'CFV76_GOOGLE_2';
export const LEDGER = 'CF_Registros_v2';
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const FILE_TYPES = new Map([['pdf','application/pdf'],['jpg','image/jpeg'],['jpeg','image/jpeg'],['png','image/png']]);

export function normalizeDate(raw) {
  const value=String(raw??'').trim();
  if(!value)return '';
  let year, month, day;
  let m=value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/);
  if(m){[,year,month,day]=m;}
  else {m=value.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);if(!m)return '';[,day,month,year]=m;}
  const y=Number(year),mo=Number(month),d=Number(day);
  const dt=new Date(Date.UTC(y,mo-1,d));
  return dt.getUTCFullYear()===y&&dt.getUTCMonth()===mo-1&&dt.getUTCDate()===d
    ? `${year.padStart(4,'0')}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}` : '';
}
export function euroAmount(value){
  if(typeof value==='number')return Number.isFinite(value)?value:NaN;
  const s=String(value??'').replace(/\s|€|EUR/gi,'');
  if(!s)return NaN;
  if(!/^[+-]?[\d.,]+$/.test(s))return NaN;
  const comma=s.lastIndexOf(','),dot=s.lastIndexOf('.');
  let normalized=s;
  if(comma!==-1&&dot!==-1){normalized=comma>dot?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');}
  else if(comma!==-1){normalized=s.replace(',', '.');}
  else if(dot!==-1&&/^\d{1,3}(\.\d{3})+$/.test(s)){normalized=s.replace(/\./g,'');}
  const num=Number(normalized);return Number.isFinite(num)?num:NaN;
}
export function taxParts(grossValue,rateValue){
  const gross=euroAmount(grossValue),rate=euroAmount(rateValue);
  if(!Number.isFinite(gross)||gross<=0)throw Error('Introduce un importe total superior a 0.');
  if(!Number.isFinite(rate)||rate<0||rate>100)throw Error('El IVA debe estar entre el 0 % y el 100 %.');
  const round=v=>Math.round((v+Number.EPSILON)*100)/100;
  const total=round(gross),base=round(total/(1+rate/100));
  return {total,base,iva:round(total-base),ivaPorcentaje:rate};
}
export function sniffFile(file){
  const name=String(file?.name||'');const ext=name.split('.').pop().toLowerCase();
  const mime=FILE_TYPES.get(ext)||'';
  if(!mime)return null;
  if(file.size<=0||file.size>MAX_FILE_BYTES)throw Error(`${name}: solo PDF, JPG o PNG de hasta 5 MB.`);
  if(file.type && file.type!=='application/octet-stream' && file.type!==mime && !(mime==='image/jpeg'&&file.type==='image/jpg'))throw Error(`${name}: formato de archivo no válido.`);
  return mime;
}
export function parseCsv(text){
  let source=String(text||'').replace(/^\ufeff/,'');
  if(source.length>6_000_000)throw Error('El CSV es demasiado grande. Divide la importación en varios archivos.');
  const first=source.split(/\r?\n/,1)[0],delim=(first.match(/;/g)||[]).length>=(first.match(/,/g)||[]).length?';':',';
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<source.length;i++){
    const c=source[i];
    if(c==='"'){
      if(quoted&&source[i+1]==='"'){cell+='"';i++;}else if(!quoted&&!cell){quoted=true;}else if(quoted){quoted=false;}else{cell+=c;}
    }else if(c===delim&&!quoted){row.push(cell);cell='';}
    else if((c==='\r'||c==='\n')&&!quoted){if(c==='\r'&&source[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(quoted)throw Error('El CSV tiene comillas sin cerrar.');
  row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
  if(!rows.length)return [];
  const headers=rows.shift().map(x=>x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,''));
  const aliases={fecha:['fecha','fechacompra','date'],tercero:['proveedor','distribuidor','tienda','tercero','empresa','comercio'],concepto:['concepto','descripcion','detalle','producto','servicio'],total:['total','importe','importetotal','preciototal'],ivaPorcentaje:['iva','ivaporcentaje','tipoiva','porcentajeiva'],archivo:['archivo','factura','nombrefichero','nombredocumento','nombrearchivo']};
  function get(r,key){const idx=headers.findIndex(h=>aliases[key].includes(h));return idx<0?'':String(r[idx]||'').trim();}
  if(!aliases.total.some(h=>headers.includes(h)))throw Error('El CSV necesita una columna "total" o "importe".');
  if(!aliases.fecha.some(h=>headers.includes(h)))throw Error('El CSV necesita una columna "fecha".');
  return rows.map((r,i)=>({fecha:normalizeDate(get(r,'fecha')),fechaOriginal:get(r,'fecha'),tercero:get(r,'tercero'),concepto:get(r,'concepto'),total:get(r,'total'),ivaPorcentaje:get(r,'ivaPorcentaje')||'21',archivoNombre:get(r,'archivo'),linea:i+2}));
}
export function normalizeName(name){return String(name||'').split(/[\\/]/).pop().trim().toLocaleLowerCase('es-ES');}
export function ledgerRecord(fields,uuid){
  const date=normalizeDate(fields.fecha);
  if(!date)throw Error('La fecha debe ser una fecha real (AAAA-MM-DD).');
  const tercero=String(fields.tercero||'').trim();
  const concepto=String(fields.concepto||'').trim();
  if(!tercero||!concepto)throw Error('Faltan proveedor o concepto.');
  if(tercero.length>160||concepto.length>500)throw Error('Proveedor o concepto demasiado largo.');
  const amount=taxParts(fields.total,fields.ivaPorcentaje);
  const id='REG-'+uuid();
  const requestId=String(fields.requestId||'IMPORT-PC-'+uuid());
  const data={id,requestId,fecha:date,tipo:'Compra',tercero,concepto,...amount,
    facturaUrl:fields.facturaUrl||'',estadoCobro:'',origen:'importador_pc_r28'};
  if(fields.importacionPcHash)data.importacionPcHash=String(fields.importacionPcHash);
  return {key:'new-'+uuid(),tab:'Compras',data};
}
export function ledgerRow(record,isoTime){
  return [MARK,record.key,JSON.stringify({...record,deleted:false,at:isoTime})];
}
export function existingPurchases(ledgerRows){
  const requests=new Set(),hashes=new Set();
  for(const r of ledgerRows){if(r[0]!==MARK||!r[2])continue;
    let entry;try{entry=JSON.parse(r[2]);}catch{continue;}
    if(entry?.tab!=='Compras'||entry.deleted||!entry.data)continue;
    if(entry.data.requestId)requests.add(String(entry.data.requestId));
    if(entry.data.importacionPcHash)hashes.add(String(entry.data.importacionPcHash));
  }
  return {requests,hashes};
}
