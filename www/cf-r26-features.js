/* Control Fiscal R26 — unified private movement ledger, safe reminder preferences.
   Data comes exclusively from the active user's existing Sheets snapshots.
   This file does NOT send automated email or WhatsApp messages. */
(function(root){'use strict';
const $=id=>root.document.getElementById(id);
const text=v=>String(v??'').trim();
const n=v=>Number(v)||0;
const euro=v=>n(v).toLocaleString('es-ES',{style:'currency',currency:'EUR'});
const pad=v=>String(v).padStart(2,'0');
const day=v=>{if(!v)return '';const raw=String(v);if(/^\d{4}-\d{2}-\d{2}/.test(raw))return raw.slice(0,10);const d=new Date(raw);if(Number.isNaN(d.getTime()))return '';return [d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-');};
function data(){
 if(!root.CFGoogleAccount?.active()?.id)return [];
 const records=root.CFR20Data?.records?.()||[],incomes=root.CFR20Data?.incomes?.()||[];
 const all=[];
 for(const [index,r] of records.entries()){
  if(r.archivada)continue;
  const buy=r.tipo==='Compra',invoice=!buy;
  all.push({id:'record-'+index,kind:buy?'compra':'factura',record:r,fecha:day(r.fecha),title:text(r.tercero)||'Sin nombre',description:text(r.concepto),amount:n(r.total),pending:invoice&&r.estadoCobro==='pendiente'});
 }
 for(const r of incomes){
  const amount=n(r.importePrevisto||r.cobrado),paid=n(r.cobrado);
  all.push({id:'income-'+text(r.id),kind:'ingreso',record:r,fecha:day(r.fecha),title:text(r.persona)||'Sin nombre',description:text(r.servicio),amount,pending:Math.max(0,amount-paid)>0.005});
 }
 return all;
}
function isWithin(item,filter){
 if(!item.fecha)return filter.mode==='all';
 const today=new Date(),y=String(today.getFullYear()),m=pad(today.getMonth()+1),key=item.fecha;
 switch(filter.mode){
  case 'all':return true;
  case 'current-year':return key.slice(0,4)===y;
  case 'current-month':return key.slice(0,7)===y+'-'+m;
  case 'year':return key.slice(0,4)===String(filter.year);
  case 'month':return key.slice(0,7)===String(filter.year)+'-'+pad(filter.month);
  case 'custom':return (!filter.from||key>=filter.from)&&(!filter.to||key<=filter.to);
  default:return false;
 }
}
function viewFilters(){return {mode:$('cfR26Period')?.value||'current-month',year:$('cfR26Year')?.value,month:$('cfR26Month')?.value,from:$('cfR26From')?.value,to:$('cfR26To')?.value};}
function selectedRows(){
 const term=text($('cfR26Search')?.value).toLocaleLowerCase();
 const active={compra:$('cfR26TypeCompra')?.checked,factura:$('cfR26TypeFactura')?.checked,ingreso:$('cfR26TypeIngreso')?.checked};
 return data().filter(item=>active[item.kind]&&isWithin(item,viewFilters())&&(!term||[item.title,item.description,item.kind].join(' ').toLocaleLowerCase().includes(term)))
   .sort((a,b)=>b.fecha.localeCompare(a.fecha));
}
function element(tag,cls,label){const el=root.document.createElement(tag);if(cls)el.className=cls;if(label!==undefined)el.textContent=label;return el;}
function renderMovements(){
 updateReminderControls();
 const container=$('cfR26MovementItems'),counter=$('cfR26MovementCount');if(!container)return;
 const rows=selectedRows();container.replaceChildren();
 if(counter)counter.textContent=`${rows.length} movimientos · ${rows.filter(r=>r.kind==='compra').length} compras · ${rows.filter(r=>r.kind==='factura').length} facturas · ${rows.filter(r=>r.kind==='ingreso').length} ingresos independientes`;
 if(!rows.length){container.append(element('p','settingsHint','No hay registros con estos filtros.'));return;}
 for(const row of rows){
  const button=element('button','cfR26MovementRow'+(row.pending?' isUnpaid':''));button.type='button';button.setAttribute('aria-label','Ver '+row.kind+' de '+row.title);
  const dot=element('i','cfR26Dot '+(row.kind==='compra'?'buy':row.kind==='factura'?'invoice':'income'));dot.setAttribute('aria-hidden','true');
  const copy=element('span');copy.append(element('strong','',row.title));copy.append(element('small','',`${row.fecha||'Sin fecha'} · ${row.description||'Sin descripción'}${row.pending?' · Pendiente':''}`));
  button.append(dot,copy,element('b','',euro(row.amount)));
  button.addEventListener('click',()=>{if(row.kind==='ingreso')root.openPendingIncomeForm?.(row.record.id);else root.openRecordData?.(row.record);});
  container.append(button);
 }
}
function periodChanged(){
 const f=viewFilters(),yearMonth=$('cfR26YearMonth'),custom=$('cfR26CustomDates');
 if(yearMonth)yearMonth.hidden=!['year','month'].includes(f.mode);
 if(custom)custom.hidden=f.mode!=='custom';
 const month=$('cfR26Month');if(month?.parentElement)month.parentElement.hidden=f.mode!=='month';
 renderMovements();
}
function setupPeriods(){
 const year=$('cfR26Year'),month=$('cfR26Month');if(!year||!month)return;
 const now=new Date(),years=new Set([now.getFullYear()]);for(const x of data()){if(x.fecha)years.add(Number(x.fecha.slice(0,4)));}
 year.replaceChildren();for(const y of [...years].sort((a,b)=>b-a)){const opt=element('option','',y);opt.value=String(y);year.append(opt);}
 year.value=String(now.getFullYear());month.replaceChildren();
 const names=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
 names.forEach((name,i)=>{const opt=element('option','',name);opt.value=String(i+1);month.append(opt);});month.value=String(now.getMonth()+1);
}
function accountPrefKey(){const account=root.CFGoogleAccount?.active();return account?.id?'cf_r26_reminder_preferences_'+account.id:null;}
function updateReminderControls(){
 const invoices=!!$('cfR26TypeFactura')?.checked,incomes=!!$('cfR26TypeIngreso')?.checked;
 const card=$('cfR26ReminderCard');if(card)card.hidden=!(invoices||incomes);
 const invoiceLabel=$('cfR26RemindInvoicesWrap');if(invoiceLabel)invoiceLabel.hidden=!invoices;
 const incomeLabel=$('cfR26RemindIncomesWrap');if(incomeLabel)incomeLabel.hidden=!incomes;
 reminderFrequencyChanged();
}
function reminderFrequencyChanged(){
 const frequency=$('cfR26ReminderFrequency')?.value;
 const interval=$('cfR26ReminderIntervalRow'),month=$('cfR26ReminderMonthDayWrap');
 if(interval)interval.hidden=frequency!=='interval';
 if(month)month.hidden=frequency!=='monthly';
}
function loadReminderPreferences(){const key=accountPrefKey();if(!key)return;try{const v=JSON.parse(root.localStorage.getItem(key)||'{}');
  if(['daily','interval','weekly','monthly'].includes(v.frequency))$('cfR26ReminderFrequency').value=v.frequency;
  if(Number.isInteger(v.day)&&v.day>=1&&v.day<=28)$('cfR26ReminderDay').value=String(v.day);
  if(Number.isInteger(v.interval)&&v.interval>=1&&v.interval<=365)$('cfR26ReminderInterval').value=String(v.interval);
  $('cfR26ReminderEmail').checked=v.email!==false;$('cfR26ReminderWhatsApp').checked=!!v.whatsapp;
  $('cfR26RemindInvoices').checked=v.invoices!==false;$('cfR26RemindIncomes').checked=v.incomes!==false;
 }catch(_){}
 reminderFrequencyChanged();
}
function saveReminderPreferences(){
 const status=$('cfR26ReminderStatus'),key=accountPrefKey();if(!key){if(status)status.textContent='Inicia sesión antes de guardar preferencias.';return;}
 const data={frequency:$('cfR26ReminderFrequency').value,day:Math.max(1,Math.min(28,Number($('cfR26ReminderDay').value)||1)),interval:Math.max(1,Math.min(365,Number($('cfR26ReminderInterval').value)||7)),email:$('cfR26ReminderEmail').checked,whatsapp:$('cfR26ReminderWhatsApp').checked,invoices:$('cfR26RemindInvoices').checked,incomes:$('cfR26RemindIncomes').checked};
 root.localStorage.setItem(key,JSON.stringify(data));
 if(status)status.textContent='Preferencias guardadas solo en este dispositivo. NO hay envíos automáticos activos; falta configurar el servicio externo y el consentimiento de los destinatarios.';
}
function openMovements(){setupPeriods();loadReminderPreferences();root.only('cfR26MovementsPage');root.nav('home');periodChanged();}
// Optional, privacy-safe in-app inbox signal. Not a background push notification.
let adminNoticeKey='',seenSuggestions=null,noticeRunning=false;
const adminNoticeCheckbox=()=>$('cfR26AdminLocalNotices');
function adminIdentity(){
 const token=root.CFFirebaseAuth?.peek?.();
 const entry=$('cfR21AdminEntry');
 return token?.uid&&token.idToken&&entry&&!entry.hidden?token:null;
}
function updateAdminNoticeChoice(){
 const uid=adminIdentity()?.uid,box=adminNoticeCheckbox();
 if(!box)return;
 if(!uid){box.checked=false;adminNoticeKey='';seenSuggestions=null;return;}
 if(adminNoticeKey!==uid){adminNoticeKey=uid;seenSuggestions=null;}
 try{box.checked=root.localStorage.getItem('cf_r26_admin_notices_'+uid)==='1';}catch(_){box.checked=false;}
}
function setAdminLocalNotices(enabled){
 const auth=adminIdentity(),status=$('cfR26AdminNoticeStatus');
 if(!auth){if(status)status.textContent='Solo la cuenta administradora autorizada puede activar estos avisos.';return;}
 try{root.localStorage.setItem('cf_r26_admin_notices_'+auth.uid,enabled?'1':'0');}catch(_){if(status)status.textContent='No se pudo guardar la preferencia.';return;}
 seenSuggestions=null;
 if(status)status.textContent=enabled?'Activados mientras la aplicación esté abierta. No son notificaciones push con la app cerrada.':'Avisos desactivados.';
 if(enabled)void pollAdminInbox();
}
async function pollAdminInbox(){
 if(noticeRunning||root.document.hidden)return;
 updateAdminNoticeChoice();
 if(!adminNoticeCheckbox()?.checked)return;
 const auth=adminIdentity();if(!auth)return;
 noticeRunning=true;
 try{
  const url='https://firestore.googleapis.com/v1/projects/control-fiscal-511118/databases/(default)/documents/control_fiscal_sugerencias?pageSize=100';
  const response=await root.fetch(url,{headers:{Authorization:'Bearer '+auth.idToken}});
  if(!response.ok)return;
  const data=await response.json();if(adminIdentity()?.uid!==auth.uid)return;
  const names=new Set((data.documents||[]).map(doc=>String(doc.name||'')).filter(Boolean));
  if(seenSuggestions!==null){const count=[...names].filter(id=>!seenSuggestions.has(id)).length;
   if(count>0)root.showToastMessage?.('Nuevas sugerencias',count===1?'Has recibido una sugerencia. Abre Administración para revisarla.':`Has recibido ${count} sugerencias. Abre Administración para revisarlas.`);
  }
  seenSuggestions=names;
 }catch(_){/* offline; never disclose account data */}
 finally{noticeRunning=false;}
}
if(typeof root.setInterval==='function')root.setInterval(()=>{void pollAdminInbox();},120000);
root.addEventListener?.('cf:account-changed',()=>{adminNoticeKey='';seenSuggestions=null;updateAdminNoticeChoice();});
root.addEventListener?.('cf:firebase-ready',()=>{updateAdminNoticeChoice();void pollAdminInbox();});
root.document.addEventListener?.('visibilitychange',()=>{if(!root.document.hidden){updateAdminNoticeChoice();void pollAdminInbox();}});
root.CFR26=Object.freeze({openMovements,periodChanged,renderMovements,reminderFrequencyChanged,updateReminderControls,saveReminderPreferences,setAdminLocalNotices,pollAdminInbox,day,isWithin,selectedRows});
})(window);
