/* R31 · Presupuestos privados y desgloses de cobro.
 * No persiste ni sube documentos al previsualizar o compartir; solamente al pulsar Guardar.
 * El coste real NO se incluye en documentos ni mensajes para el cliente.
 */
(function(root){'use strict';
const $=id=>root.document.getElementById(id),round=n=>Math.round((Number(n)||0)*100)/100;
const eur=n=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(round(n));
const txt=x=>String(x??'').trim();
const finite=(n,label)=>{const value=Number(n);if(!Number.isFinite(value)||value<0||value>100000000)throw Error('Revisa '+label+'.');return round(value);};
const calc=(materials=[],labor=0,vatPct=0)=>{
 if(!Array.isArray(materials)||materials.length>70)throw Error('Máximo de 70 materiales.');
 const lines=materials.map(r=>({nombre:txt(r.nombre).slice(0,160),cantidad:finite(r.cantidad,'cantidad'),costeReal:finite(r.costeReal,'coste real'),precioCliente:finite(r.precioCliente,'precio de venta')}));
 if(lines.some(r=>!r.nombre||r.cantidad<=0||r.cantidad>10000))throw Error('Cada material necesita nombre y cantidad válida.');
 const laborValue=finite(labor,'mano de obra'),vat=finite(vatPct,'IVA');if(vat>30)throw Error('IVA fuera de rango.');
 const cost=round(lines.reduce((a,r)=>a+r.cantidad*r.costeReal,0));
 const sale=round(lines.reduce((a,r)=>a+r.cantidad*r.precioCliente,0));
 const base=round(sale+laborValue),tax=round(base*vat/100),total=round(base+tax);
 return {lines,realCost:cost,saleMaterials:sale,labor:laborValue,base,vat,iva:tax,total, totalSale:base,hasBreakdown:lines.length>0||laborValue>0};
};
function safeError(e){return txt(e?.message||e).slice(0,260);}
function materialRow(container,entry={},onChanged=()=>{},namePrefix='r31'){
 const card=root.document.createElement('div');card.className='cfR31MaterialRow';
 card.innerHTML=`<div class="field full"><label>Material / descripción</label><input class="input cfR31Name" maxlength="160" placeholder="Artículo o servicio"></div>
  <div class="field"><label>Cantidad</label><input class="input cfR31Qty" type="number" min="0.01" step="0.01" value="1"></div>
  <div class="field"><label>Coste real unitario (€) · privado</label><input class="input cfR31Cost" type="number" min="0" step="0.01" value="0"></div>
  <div class="field"><label>Precio al cliente unitario (€)</label><input class="input cfR31Sale" type="number" min="0" step="0.01" value="0"></div>
  <button class="guideBtn cfR31Remove" type="button">Eliminar línea</button>`;
 card.querySelector('.cfR31Name').value=entry.nombre||'';
 card.querySelector('.cfR31Qty').value=entry.cantidad??1;
 card.querySelector('.cfR31Cost').value=entry.costeReal??0;
 card.querySelector('.cfR31Sale').value=entry.precioCliente??0;
 card.querySelectorAll('input').forEach(el=>el.addEventListener('input',onChanged));
 card.querySelector('button').onclick=()=>{card.remove();onChanged();};
 container.appendChild(card);return card;
}
function readRows(hostId){return Array.from($(hostId)?.querySelectorAll('.cfR31MaterialRow')||[]).map(row=>({
 nombre:txt(row.querySelector('.cfR31Name')?.value),
 cantidad:row.querySelector('.cfR31Qty')?.value||0,
 costeReal:row.querySelector('.cfR31Cost')?.value||0,
 precioCliente:row.querySelector('.cfR31Sale')?.value||0
 }));}
// Edición de ingresos independientes existentes. No borra un importe antiguo si no hay líneas.
function addIncomeMaterial(item){const host=$('cfR31IncomeMaterials');if(!host)return;
 materialRow(host,item||{},incomeChanged);incomeChanged();}
function loadIncomeMaterials(record){
 const host=$('cfR31IncomeMaterials');if(!host)return;host.replaceChildren();
 let records=Array.isArray(record?.materialesDetalle)?record.materialesDetalle:[];
 const warning=$('cfR32LegacyWarning');
 // Conservación explícita de ingresos antiguos: no se deduce un material que nunca fue registrado.
 const legacy=!!record && !records.length && !(Number(record?.manoObra)>0) && Number(record?.importePrevisto)>0;
 if(legacy){records=[{nombre:'PENDIENTE DE DESGLOSAR - EDITAR',cantidad:1,costeReal:Number(record.material)||0,precioCliente:Number(record.importePrevisto)||0}];}
 if(warning){warning.hidden=!legacy;warning.textContent=legacy?'Este ingreso se creó sin desglose. Se muestran sus importes antiguos en una línea provisional: sustituye esa descripción y separa los materiales y mano de obra reales antes de guardar o generar un presupuesto.':'';}
 records.forEach(r=>materialRow(host,r,incomeChanged));
 if($('cfR31IncomeLabor'))$('cfR31IncomeLabor').value=String(Number(record?.manoObra)||0);
 if($('cfR32IncomeVAT'))$('cfR32IncomeVAT').value=String(Number(record?.ivaPorcentaje)||0);
 incomeChanged();
}
function incomeTotals(){
 const rows=readRows('cfR31IncomeMaterials'),labor=$('cfR31IncomeLabor')?.value||0,vat=$('cfR32IncomeVAT')?.value||0;
 try{
  if(rows.some(r=>r.nombre==='PENDIENTE DE DESGLOSAR - EDITAR'))throw Error('Desglosa el ingreso antiguo antes de guardarlo o generar su presupuesto.');
  const totals=calc(rows,labor,vat);
  return {...totals,invalid:false};
 }catch(e){return {invalid:true,error:safeError(e),hasBreakdown:rows.length>0||Number(labor)>0,lines:rows,labor:Number(labor)||0};}
}
function incomeChanged(){
 const summary=$('cfR31IncomeBreakdown'),data=incomeTotals();
 if(summary)summary.textContent=data.invalid?'Revisa el desglose: '+data.error:data.hasBreakdown?`Venta de materiales: ${eur(data.saleMaterials)} · Mano de obra: ${eur(data.labor)} · IVA (${data.vat}%): ${eur(data.iva)} · Total: ${eur(data.total)} · Coste de materiales privado: ${eur(data.realCost)}`:'Añade materiales y/o mano de obra; el importe se calculará automáticamente.';
 try{root.recalcPendingIncome?.();}catch(e){if(summary)summary.textContent='Revisa el desglose: '+safeError(e);}
}
// Construcción de mensajes a clientes. Nunca incluir el campo costeReal.
function breakdownText(record,amount,paid){
 const materials=Array.isArray(record?.materialesDetalle)?record.materialesDetalle:[];
 const labor=round(record?.manoObra||0);
 if(!materials.length&&!labor)return '';
 const lines=[];
 if(materials.length){lines.push('Materiales:');for(const item of materials){
  const qty=Number(item.cantidad)||0,price=Number(item.precioCliente)||0;
  lines.push('• '+txt(item.nombre)+' — '+qty+' × '+eur(price)+' = '+eur(qty*price));
 }lines.push('Total materiales: '+eur(materials.reduce((n,v)=>n+Number(v.cantidad||0)*Number(v.precioCliente||0),0)));}
 if(labor>0)lines.push('Mano de obra: '+eur(labor));
 const vat=Number(record?.ivaPorcentaje)||0;
 if(vat>0){const sums=calc(materials,labor,vat);lines.push('Base imponible: '+eur(sums.base));lines.push('IVA ('+vat+'%): '+eur(sums.iva));}
 lines.push('Total acordado: '+eur(amount));
 lines.push('Ya recibido: '+eur(paid));
 lines.push('Pendiente: '+eur(Math.max(0,amount-paid)));
 return lines.join('\n');
}
function reminderText({record,amount,paid,remaining,reference,name}){
 const table=breakdownText(record,amount,paid);
 return `Hola, ${name}.\n\nTe enviamos el desglose del servicio ${reference}:\n\n`+(table||`Importe acordado: ${eur(amount)}\nYa recibido: ${eur(paid)}\nPendiente: ${eur(remaining)}`)+
  '\n\nSi ya has realizado el pago, por favor indícanoslo. Gracias.';
}
function invoiceLikePayload({client,issuer,materials,labor,vatPct,reference,notes}){
 const sums=calc(materials,labor,vatPct);
 const lineas=sums.lines.map(r=>({concepto:r.nombre,cantidad:r.cantidad,precio:r.precioCliente}));
 if(sums.labor>0)lineas.push({concepto:'Mano de obra',cantidad:1,precio:sums.labor});
 return {emisor:issuer,cliente:client,lineas,referencia:reference||'',observaciones:notes||'',base:sums.base,ivaPorcentaje:sums.vat,iva:sums.iva,total:sums.total};
}
let quoteId='',quoteList=[],quoteBook='';
function active(){const a=root.CFGoogleAccount?.active?.();if(!a?.id||!a?.email||!a?.token)throw Error('Inicia sesión con Google y selecciona tu libro de Control Fiscal.');return a;}
function same(a){const current=active();if(current.id!==a.id||current.email!==a.email)throw Error('Ha cambiado la cuenta durante el guardado.');}
function quoteStatus(message,error=false){const el=$('cfR31Status');if(el){el.className='msg'+(error?' err':' ok');el.textContent=message;}}
function fillClient(client={}){
 const map={cfR31ClientName:'nombre',cfR31ClientTax:'cif',cfR31ClientAddress:'direccion',cfR31ClientPostal:'cp',cfR31ClientCity:'ciudad',cfR31ClientProvince:'provincia',cfR31ClientPhone:'telefono',cfR31ClientEmail:'email'};
 for(const [id,key] of Object.entries(map))if($(id))$(id).value=client[key]||'';
}
function getClient(){return {nombre:txt($('cfR31ClientName')?.value),cif:txt($('cfR31ClientTax')?.value),direccion:txt($('cfR31ClientAddress')?.value),cp:txt($('cfR31ClientPostal')?.value),ciudad:txt($('cfR31ClientCity')?.value),provincia:txt($('cfR31ClientProvince')?.value),telefono:txt($('cfR31ClientPhone')?.value),email:txt($('cfR31ClientEmail')?.value)};}
async function fillClients(){try{await root.loadClients?.(false);}catch(_){/* readonly snapshot */}
 const sel=$('cfR31ClientChoice');if(!sel)return;const arr=root.CFR22ClientsSnapshot?.()||[];
 sel.replaceChildren();const blank=root.document.createElement('option');blank.value='';blank.textContent='Introducir cliente manualmente';sel.appendChild(blank);
 arr.forEach((x,i)=>{const opt=root.document.createElement('option');opt.value=String(i);opt.textContent=txt(x.nombre);sel.appendChild(opt);});
 sel.onchange=()=>{if(sel.value!=='')fillClient(arr[Number(sel.value)]||{});};
}
function quoteSummary(){try{
 const t=calc(readRows('cfR31QuoteMaterials'),$('cfR31QuoteLabor')?.value||0,$('cfR31QuoteVAT')?.value||0);
 const el=$('cfR31Totals');if(el)el.textContent=`Materiales (venta): ${eur(t.saleMaterials)} · Mano de obra: ${eur(t.labor)} · Base: ${eur(t.base)} · IVA (${t.vat}%): ${eur(t.iva)} · Total: ${eur(t.total)}`;
 return t;
 }catch(e){const el=$('cfR31Totals');if(el)el.textContent='Revisa el presupuesto: '+safeError(e);return null;}
}
function addQuoteMaterial(v){const host=$('cfR31QuoteMaterials');if(!host)return;materialRow(host,v||{},quoteSummary);quoteSummary();}
function getQuote(){const sums=calc(readRows('cfR31QuoteMaterials'),$('cfR31QuoteLabor')?.value||0,$('cfR31QuoteVAT')?.value||0);
 const client=getClient(),issuer=root.getInvoiceConfig?.()||{},date=$('cfR31QuoteDate')?.value;
 if(!client.nombre)throw Error('Indica un cliente o selecciónalo de tu directorio.');
 if(!issuer.name)throw Error('Configura antes tus datos del emisor en Ajustes → Datos de facturación.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Indica la fecha del presupuesto.');
 if(sums.total<=0)throw Error('Añade materiales o mano de obra con precio positivo.');
 return {id:quoteId,fecha:date,cliente:client,emisor:issuer,referencia:txt($('cfR31Reference')?.value).slice(0,140),materiales:sums.lines,manoObra:sums.labor,ivaPorcentaje:sums.vat,observaciones:txt($('cfR31QuoteNotes')?.value).slice(0,2000),base:sums.base,iva:sums.iva,total:sums.total};
}
function toPDFData(q,provisional=false){return {presupuesto:true,numero:provisional?'SIN GUARDAR':q.id,fecha:q.fecha,
 payload:invoiceLikePayload({client:q.cliente,issuer:q.emisor,materials:q.materiales,labor:q.manoObra,vatPct:q.ivaPorcentaje,reference:q.referencia,notes:q.observaciones})};}
async function shareQuote(){try{
 const q=getQuote();quoteStatus('Generando PDF local para compartir. No se guardará en la nube…');
 await root.CFInvoiceShare.share(toPDFData(q,true));quoteStatus('PDF generado y compartido localmente. No se ha guardado ningún presupuesto en Google Drive ni Sheets.');
 }catch(e){quoteStatus(safeError(e),true);}}
async function saveQuote(){const btn=$('cfR31QuoteSave');if(btn?.disabled)return;btn.disabled=true;
 try{
 const a=active(),q=getQuote();same(a);quoteStatus('Guardando presupuesto en tu Google Sheets privado…');
 const out=await root.CFGoogleData.action({accion:'guardarPresupuesto',presupuesto:JSON.stringify(q)});same(a);
 if(!out?.ok||!out.id)throw Error('Google Sheets no confirmó el presupuesto.');
 quoteId=out.id;quoteStatus('Presupuesto guardado. Generando el PDF para tu Drive…');
 try{const pdf=await root.CFInvoiceShare.generate(toPDFData({...q,id:out.id}));same(a);
  const url=await root.CFGoogleUploads.upload(pdf.filename,'application/pdf',pdf.base64,root.CFGoogleAccount.active());same(a);
  await root.CFGoogleData.action({accion:'vincularPDFPresupuesto',id:out.id,url});same(a);
  quoteStatus('Presupuesto guardado en Sheets y PDF almacenado en tu Drive privado.');
 }catch(e){quoteStatus('Presupuesto guardado en Sheets, pero NO se pudo vincular el PDF: '+safeError(e),true);}
 await listSaved();
 }catch(e){quoteStatus('No guardado: '+safeError(e),true);}finally{if(btn)btn.disabled=false;}}
function selectQuote(record){if(!record)return;quoteId=String(record.id||'');
 fillClient(record.cliente||{});$('cfR31QuoteDate').value=String(record.fecha||'').slice(0,10);
 $('cfR31Reference').value=record.referencia||'';$('cfR31QuoteNotes').value=record.observaciones||'';
 $('cfR31QuoteLabor').value=Number(record.manoObra)||0;$('cfR31QuoteVAT').value=Number(record.ivaPorcentaje)||0;
 $('cfR31QuoteMaterials').replaceChildren();(record.materiales||[]).forEach(addQuoteMaterial);quoteSummary();
 quoteStatus('Editando presupuesto '+quoteId+'. Los cambios no se guardarán hasta pulsar Guardar presupuesto.');}
async function listSaved(){const host=$('cfR31SavedQuotes');if(!host)return;
 try{const a=active(),out=await root.CFGoogleData.action({accion:'listarPresupuestos'});same(a);quoteList=out.presupuestos||[];quoteBook=a.email+':'+a.id;
  host.replaceChildren();if(!quoteList.length){host.textContent='Todavía no tienes presupuestos guardados.';return;}
  for(const q of quoteList){const card=root.document.createElement('div');card.className='cfR31SavedQuote';
   const summary=root.document.createElement('div');summary.textContent=[q.fecha,q.cliente?.nombre,q.referencia||'Presupuesto',eur(q.total)].filter(Boolean).join(' · ');card.appendChild(summary);
   const edit=root.document.createElement('button');edit.type='button';edit.className='guideBtn';edit.textContent='✏️ Editar';edit.onclick=()=>selectQuote(q);card.appendChild(edit);
   if(/^https:\/\/drive\.google\.com\//.test(q.documentoUrl||'')){
    const view=root.document.createElement('button');view.type='button';view.className='guideBtn';view.textContent='📄 Ver PDF';view.onclick=()=>root.openCFDocumentViewer?.(q.documentoUrl);card.appendChild(view);
   }host.appendChild(card);
  }
 }catch(e){host.textContent='No se pudieron consultar los presupuestos: '+safeError(e);}}
function newQuote(){quoteId='';fillClient({});const date=new Date();$('cfR31QuoteDate').value=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
 $('cfR31Reference').value='';$('cfR31QuoteNotes').value='';$('cfR31QuoteMaterials').replaceChildren();$('cfR31QuoteLabor').value='0';$('cfR31QuoteVAT').value='21';quoteSummary();quoteStatus('Nuevo presupuesto sin guardar: nada se enviará a Google hasta pulsar Guardar presupuesto.');}
let quoteIncomeDraft=null;
function incomeDraft(){
 const totals=incomeTotals();if(totals.invalid)throw Error(totals.error);
 if(totals.total<=0)throw Error('Añade materiales y/o mano de obra con precio de venta positivo.');
 const d={id:txt(root.CFR32IncomeEditingId?.()||''),fecha:txt($('pendingDate')?.value),cliente:{nombre:txt($('pendingPerson')?.value),telefono:txt($('pendingPhone')?.value),email:txt($('pendingEmail')?.value)},servicio:txt($('pendingService')?.value),proyecto:txt($('pendingProject')?.value),materiales:totals.lines,manoObra:totals.labor,ivaPorcentaje:totals.vat,cobrado:txt($('pendingPaidPart')?.value),total:totals.total};
 if(!d.cliente.nombre)throw Error('Indica el cliente del ingreso antes de generar un presupuesto.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(d.fecha))throw Error('Indica la fecha del servicio.');
 return d;
}
function statusIncome(message,error=false){const el=$('pendingIncomeMsg');if(el){el.className='msg '+(error?'err':'ok');el.textContent=message;}}
async function shareIncomeQuote(){
 try{
  const draft=incomeDraft();const issuer=root.getInvoiceConfig?.()||{};
  if(!issuer.name)throw Error('Configura los datos del emisor en Ajustes → Datos de facturación.');
  statusIncome('Generando presupuesto PDF en el dispositivo (sin guardarlo)…');
  const stored=(root.CFR22ClientsSnapshot?.()||[]).find(x=>txt(x.nombre).toLocaleLowerCase()===draft.cliente.nombre.toLocaleLowerCase())||{};
  const client={...stored,...Object.fromEntries(Object.entries(draft.cliente).filter(([,v])=>txt(v)))};
  const info={presupuesto:true,numero:'SIN GUARDAR',fecha:draft.fecha,payload:invoiceLikePayload({issuer,client,materials:draft.materiales,labor:draft.manoObra,vatPct:draft.ivaPorcentaje,reference:draft.proyecto||draft.servicio,notes:'Presupuesto comercial. No constituye una factura fiscal.'})};
  await root.CFInvoiceShare.share(info);
  statusIncome('Presupuesto PDF generado sin subir el archivo ni registrar un presupuesto en Google.');
 }catch(e){statusIncome(safeError(e),true);}
}
function openFromIncome(){
 try{
  const draft=incomeDraft();quoteIncomeDraft=draft;open(true);
  const saved=(root.CFR22ClientsSnapshot?.()||[]).find(x=>txt(x.nombre).toLocaleLowerCase()===draft.cliente.nombre.toLocaleLowerCase());
  fillClient({...saved,...Object.fromEntries(Object.entries(draft.cliente).filter(([,v])=>txt(v)))});
  $('cfR31QuoteDate').value=draft.fecha;
  $('cfR31Reference').value=draft.proyecto||draft.servicio;
  $('cfR31QuoteLabor').value=draft.manoObra;
  $('cfR31QuoteVAT').value=draft.ivaPorcentaje;
  $('cfR31QuoteMaterials').replaceChildren();draft.materiales.forEach(addQuoteMaterial);
  quoteSummary();quoteStatus('Presupuesto preparado con el desglose del ingreso. Revisa los datos fiscales del cliente. Nada se guarda hasta pulsar Guardar presupuesto.');
 }catch(e){statusIncome(safeError(e),true);}
}
function returnToIncome(){
 if(!quoteIncomeDraft){root.openFacturacionPage?.();return;}
 const draft=quoteIncomeDraft;
 if(typeof root.openPendingIncomeForm!=='function'){root.openFacturacionPage?.();return;}
 root.openPendingIncomeForm(draft.id||'');
 const inputs={pendingPerson:draft.cliente.nombre,pendingDate:draft.fecha,pendingService:draft.servicio,pendingProject:draft.proyecto,pendingEmail:draft.cliente.email,pendingPhone:draft.cliente.telefono,pendingPaidPart:draft.cobrado};
 Object.entries(inputs).forEach(([id,value])=>{if($(id))$(id).value=value||'';});
 loadIncomeMaterials({materialesDetalle:draft.materiales,manoObra:draft.manoObra,ivaPorcentaje:draft.ivaPorcentaje});
 root.recalcPendingIncome?.();
 quoteIncomeDraft=null;
}
function open(fromIncome=false){if(typeof root.only!=='function'||typeof root.nav!=='function')throw Error('No se ha cargado la navegación.');
 root.only('formPage');root.nav('sale');$('formBody')?.classList.remove('cfR25CompactBilling');
 const header=$('formHeader'),body=$('formBody');header.dataset.tipo='Presupuesto';
 header.innerHTML='<button class="back" onclick="'+(fromIncome?'CFR31Budget.returnToIncome()':'openFacturacionPage()')+'">‹</button><div class="headericon">📋</div><div><h2>PRESUPUESTOS</h2><p>Materiales, mano de obra, IVA y PDF</p></div>';
 body.innerHTML=`<div class="cfR31Budget">
  <div class="invoiceSection"><h3>CLIENTE</h3><div class="field"><label>Elegir un cliente guardado</label><select class="select" id="cfR31ClientChoice"></select></div>
   <div class="field"><label>Nombre / empresa</label><input class="input" id="cfR31ClientName" placeholder="Nombre de la persona o empresa"></div>
   <div class="two"><div class="field"><label>NIF / CIF</label><input class="input" id="cfR31ClientTax" placeholder="Identificación fiscal"></div><div class="field"><label>Correo</label><input class="input" type="email" id="cfR31ClientEmail" placeholder="correo@ejemplo.com"></div></div>
   <div class="field"><label>Dirección</label><input class="input" id="cfR31ClientAddress" placeholder="Dirección del cliente"></div>
   <div class="two"><div class="field"><label>Código postal</label><input class="input" id="cfR31ClientPostal" placeholder="00000"></div><div class="field"><label>Ciudad</label><input class="input" id="cfR31ClientCity" placeholder="Localidad"></div></div>
   <div class="two"><div class="field"><label>Provincia</label><input class="input" id="cfR31ClientProvince" placeholder="Provincia"></div><div class="field"><label>Teléfono</label><input class="input" id="cfR31ClientPhone" placeholder="Teléfono"></div></div>
   <p class="settingsHint">Los datos de tu empresa y el logotipo se toman de Ajustes → Datos de facturación.</p>
  </div>
  <div class="invoiceSection"><h3>DETALLES DEL PRESUPUESTO</h3>
   <div class="two"><div class="field"><label>Fecha</label><input class="input" type="date" id="cfR31QuoteDate"></div><div class="field"><label>Referencia / proyecto</label><input class="input" id="cfR31Reference" placeholder="Referencia del trabajo"></div></div>
   <h4>Materiales</h4><div id="cfR31QuoteMaterials" class="cfR31MaterialRows"></div>
   <button type="button" class="guideBtn cfR31Wide" onclick="CFR31Budget.addQuoteMaterial()">＋ AÑADIR MATERIAL</button>
   <div class="two"><div class="field"><label>Mano de obra (€)</label><input type="number" class="input" id="cfR31QuoteLabor" min="0" step=".01" value="0" oninput="CFR31Budget.quoteSummary()"></div>
   <div class="field"><label>IVA (%)</label><input type="number" class="input" id="cfR31QuoteVAT" min="0" max="30" step=".01" value="21" oninput="CFR31Budget.quoteSummary()"></div></div>
   <p class="settingsHint">El coste real del material es confidencial: no aparece en el PDF que recibe el cliente.</p>
   <div id="cfR31Totals" class="cfR31Totals" aria-live="polite"></div>
   <div class="field"><label>Condiciones / observaciones</label><textarea class="input" id="cfR31QuoteNotes" rows="3" placeholder="Plazo, forma de pago, condiciones de validez…"></textarea></div>
  </div>
  <button type="button" class="guideBtn cfR31Wide" onclick="CFR31Budget.shareQuote()">📄 GENERAR / COMPARTIR PDF SIN GUARDAR</button>
  <button type="button" class="save" id="cfR31QuoteSave" onclick="CFR31Budget.saveQuote()">💾 GUARDAR PRESUPUESTO EN MI DRIVE</button>
  <div id="cfR31Status" class="msg" role="status" aria-live="polite"></div>
  <div class="invoiceSection"><h3>MIS PRESUPUESTOS GUARDADOS</h3><button type="button" class="guideBtn cfR31Wide" onclick="CFR31Budget.newQuote()">＋ NUEVO PRESUPUESTO SIN GUARDAR</button><button type="button" class="guideBtn cfR31Wide" onclick="CFR31Budget.listSaved()">↻ ACTUALIZAR LISTADO</button><div id="cfR31SavedQuotes"></div></div>
 </div>`;
 newQuote();fillClients();listSaved();body.scrollTop=0;
}
// Desglose del ingreso para presupuestos rápidos sin escritura en la nube.
function incomeDocument(record){const materials=Array.isArray(record?.materialesDetalle)?record.materialesDetalle:[],labor=Number(record?.manoObra)||0;
 const fallback=!materials.length&&!labor;const amount=Number(record.importePrevisto)||0;
 const rows=fallback?[{nombre:txt(record.servicio)||'Servicio',cantidad:1,costeReal:0,precioCliente:amount}]:materials;
 const supplemental=fallback?0:labor;
 const issuer=root.getInvoiceConfig?.()||{};
 const client={nombre:txt(record.persona),email:txt(record.correoCobro)};
 return {presupuesto:true,tipoDocumento:'desglose',numero:txt(record.id)||'INGRESO',fecha:record.fecha,
   recibido:round(record.cobrado),pendiente:Math.max(0,round(amount-Number(record.cobrado||0))),
   payload:invoiceLikePayload({issuer,client,materials:rows,labor:supplemental,vatPct:Number(record?.ivaPorcentaje)||0,reference:txt(record.proyecto||record.servicio),notes:'Desglose comercial del importe acordado. No es una factura fiscal.'})};
}
function currentPaymentIncome(){const item=root.CFR20Payments?.current?.();return item?.kind==='ingreso'?item.record:null;}
async function shareIncomeBreakdown(){const rec=currentPaymentIncome();if(!rec)return;
 const status=$('cfR20PaymentStatus');try{if(status)status.textContent='Generando el desglose PDF en este dispositivo…';await root.CFInvoiceShare.share(incomeDocument(rec));if(status){status.className='msg ok';status.textContent='PDF compartido localmente. No se guardó en Google Drive.';}}
 catch(e){if(status){status.className='msg err';status.textContent=safeError(e);}}}
// Botón añadido al DOM, sin reescribir el Home original V76.
function installQuoteMenu(){const grid=root.document.querySelector?.('#home .homegrid');if(!grid||root.document.getElementById('cfR31HomeEntry'))return;
 const button=root.document.createElement('button');button.id='cfR31HomeEntry';button.type='button';button.className='home full';
 button.innerHTML='<div class="icon"><span style="font-size:28px">📋</span></div><div class="text"><b>PRESUPUESTOS</b><small>MATERIALES · MANO DE OBRA · IVA · PDF</small></div><div class="chev">›</div>';
 button.onclick=()=>open();
 const fact=grid.querySelector('button.home.p');if(fact)fact.insertAdjacentElement('afterend',button);else grid.appendChild(button);
}
installQuoteMenu();
root.addEventListener?.('cf:account-changed',()=>{quoteId='';quoteList=[];quoteBook='';const list=$('cfR31SavedQuotes');if(list)list.replaceChildren();});
root.CFR31Budget=Object.freeze({calc,incomeTotals,incomeChanged,addIncomeMaterial,loadIncomeMaterials,breakdownText,reminderText,incomeDocument,invoiceLikePayload,open,newQuote,addQuoteMaterial,quoteSummary,shareQuote,saveQuote,listSaved,shareIncomeBreakdown,shareIncomeQuote,openFromIncome,returnToIncome,readRows});
})(window);
