/* Fase 6B.2: usa la pantalla REAL de Inventario V77, sin Apps Script.
   Solo las acciones del inventario se adaptan a Sheets personal. */
(function(){'use strict';
const gate=document.getElementById('cf-google-test-gate');
const panel=gate?.querySelector('.panel');
const page=document.getElementById('inventoryPage');
const modal=document.getElementById('inventoryModal');
const menu=panel?.querySelector('.cf-p6-nav');
if(!gate||!panel||!page||!modal||!menu)return;
const MARK='CFV78_FORM_V1';
const activeKey=()=>{const a=window.ControlFiscalV78Session?.();const raw=document.getElementById('cf-existing-id')?.value||'';
 if(!a?.token||!a?.email)throw Error('Inicia sesión con Google.');
 if(!raw.trim())throw Error('Recupera primero tu libro personal.');
 return {...a,id:window.ControlFiscalDriveV78.parseId(raw)};};
function check(s){const now=activeKey();if(now.email!==s.email||now.token!==s.token||now.id!==s.id)throw Error('La cuenta Google o el libro cambiaron: operación cancelada.');}
async function api(s,path,method='GET',data){check(s);const h=window.CapacitorHttpNative;if(!h?.request)throw Error('HTTP nativo no disponible');
 const headers={Authorization:'Bearer '+s.token,Accept:'application/json'};if(data!==undefined)headers['Content-Type']='application/json';
 const res=await h.request({url:'https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(s.id)+path,method,headers,...(data===undefined?{}:{data})});
 let d=res.data;if(typeof d==='string'){try{d=JSON.parse(d)}catch{d={}}}
 if(res.status<200||res.status>=300)throw Error('Google Sheets HTTP '+res.status+': '+String(d?.error?.message||'error').slice(0,160));check(s);return d||{};}
const range=()=>'/values/'+encodeURIComponent("'Inventario'!A:D");
async function rows(s){const d=await api(s,range());const found=[];for(const [i,r] of (d.values||[]).entries()){
 if(r[0]!==MARK)continue;let obj;try{obj=JSON.parse(r[2]||'{}')}catch{throw Error('JSON inválido en fila '+(i+1));}
 if(!obj?.id||obj.id!==r[1])throw Error('ID inconsistente en fila '+(i+1));
 if(found.some(x=>x.id===obj.id))throw Error('ID duplicado; operación bloqueada');found.push({...obj,_row:i+1});}return found;}
let busy=false;
async function bridge(payload){const action=String(payload?.accion||'');
 if(!['listarInventario','guardarInventario','eliminarInventario'].includes(action))throw Error('Operación V77 bloqueada: '+action);
 if(busy)throw Error('Espera a que termine la operación anterior.');busy=true;
 try{const s=activeKey();const all=await rows(s);
 if(action==='listarInventario')return {ok:true,items:all.map(({_row,...x})=>x)};
 if(action==='guardarInventario'){
 let obj=typeof payload.item==='string'?JSON.parse(payload.item):payload.item;
 if(!obj||typeof obj!=='object'||!String(obj.id||'').trim()||!String(obj.articulo||'').trim())throw Error('Material sin ID o nombre');
 const old=all.find(x=>x.id===obj.id);const data={values:[[MARK,obj.id,JSON.stringify(obj),'']]};
 if(old)await api(s,'/values/'+encodeURIComponent("'Inventario'!A"+old._row+':D'+old._row)+'?valueInputOption=RAW','PUT',data);
 else await api(s,range()+':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS','POST',data);
 const after=await rows(s);if(after.filter(x=>x.id===obj.id).length!==1)throw Error('No se pudo verificar el guardado único');return {ok:true,item:obj};
 }
 const old=all.find(x=>x.id===String(payload.id));if(!old)throw Error('Material no encontrado; actualiza antes de eliminar');
 await api(s,'/values/'+encodeURIComponent("'Inventario'!A"+old._row+':D'+old._row)+':clear','POST',{});
 if((await rows(s)).some(x=>x.id===old.id))throw Error('No se confirmó la eliminación');return {ok:true};
 }finally{busy=false;}}
// The original V77 callAction remains disabled for everything except this explicit bridge.
window.callAction=bridge;
const placeholder=document.createComment('Inventario V77 original');page.parentNode.insertBefore(placeholder,page);
panel.appendChild(page);panel.appendChild(modal);
const back=document.createElement('button');back.type='button';back.id='cf-v77-inv-back';back.textContent='‹ Volver a módulos V78';
back.style.cssText='display:none;position:sticky;top:0;z-index:20;width:100%;margin:8px 0 12px;background:#ffdf18;color:#101820;border:0;border-radius:10px;padding:14px;font-size:16px;font-weight:700';
page.before(back);
const note=document.createElement('p');note.textContent='Inventario original V77 · conectado exclusivamente al Google Sheets de la cuenta activa.';
note.style.cssText='font-size:12px;color:#aeb7bf;padding:0 12px';page.prepend(note);
const originalInventoryButton=menu.querySelector('[data-section="inventario"]');
function showInventory(){try{activeKey()}catch(e){alert(e.message);return;}
 panel.querySelectorAll('.cf-p6-section').forEach(p=>p.hidden=true);
 back.style.display='block';page.classList.remove('hidden');
 menu.querySelectorAll('button').forEach(b=>b.removeAttribute('aria-current'));originalInventoryButton?.setAttribute('aria-current','page');
 window.openInventory();page.classList.remove('hidden');back.scrollIntoView({block:'start'});}
function leave(){page.classList.add('hidden');modal.classList.add('hidden');back.style.display='none';
 const p2=panel.querySelector('.cf-phase2');if(p2)p2.hidden=false;menu.querySelector('[data-section="clientes"]')?.click();}
originalInventoryButton?.addEventListener('click',e=>{e.stopImmediatePropagation();showInventory()},true);
back.addEventListener('click',leave);
// Do not allow the original V77 header's Back button to open its inactive home screen.
page.querySelector('.header .back')?.addEventListener('click',e=>{e.stopImmediatePropagation();leave()},true);
// Hide the native inventory when another V78 module is selected.
menu.querySelectorAll('button:not([data-section="inventario"])').forEach(b=>b.addEventListener('click',()=>{page.classList.add('hidden');modal.classList.add('hidden');back.style.display='none'},true));
for(const id of ['cf-login-account','cf-logout-account','cf-auto-find','cf-auto-create']){
 document.getElementById(id)?.addEventListener('click',()=>{page.classList.add('hidden');modal.classList.add('hidden');back.style.display='none';
 try{localStorage.removeItem('cf_inventory');localStorage.removeItem('cf_clients')}catch{};},true);}
const style=document.createElement('style');style.textContent=`
#cf-google-test-gate #inventoryPage{width:100%;max-width:100%;text-align:left;background:#080e13;border:1px solid #3d4b56;border-radius:14px;overflow:visible;margin-top:8px}
#cf-google-test-gate #inventoryPage.hidden,#cf-google-test-gate #inventoryModal.hidden{display:none!important}
#cf-google-test-gate #inventoryPage .page{padding:14px}
#cf-google-test-gate #inventoryPage .header{padding:16px 12px}
#cf-google-test-gate #inventoryModal{z-index:2147483647}
#cf-google-test-gate #inventoryPage button{background:#ffdf18;color:#101820}
#cf-google-test-gate #inventoryPage input,#cf-google-test-gate #inventoryPage select,#cf-google-test-gate #inventoryModal input,#cf-google-test-gate #inventoryModal select,#cf-google-test-gate #inventoryModal textarea{font-size:16px}
`;document.head.appendChild(style);
})();
