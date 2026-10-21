/* Fase 8E: minimal V77 shell, no DOM moves and no native requests on entry. */
(function(){'use strict';
const $=id=>document.getElementById(id);
const gate=$('cf-google-test-gate'),home=$('home'),settings=$('settingsPage');
if(!gate||!home||!settings)return;
const css=document.createElement('style');css.id='cf-safe-shell-css';css.textContent=`
#accountGate{display:none!important}
body.cf-shell-v77 #cf-google-test-gate{display:none!important;visibility:hidden!important;pointer-events:none!important}
body.cf-shell-v78 #cf-google-test-gate{display:block!important;visibility:visible!important;pointer-events:auto!important;z-index:999!important}
#cf-safe-back{position:sticky;top:0;z-index:1001;width:100%;padding:13px 15px;border:0;border-radius:10px;background:#ffdf18;color:#111;font-size:16px;font-weight:800;margin-bottom:12px}
#cf-safe-account{display:block;width:100%;padding:13px;border:0;border-radius:12px;background:#ffdf18;color:#111;font-weight:800;margin:16px 0}
`;document.head.appendChild(css);
const back=document.createElement('button');back.id='cf-safe-back';back.type='button';back.textContent='‹ Volver al menú original';gate.querySelector('.panel')?.prepend(back);
function showHome(){document.body.classList.remove('cf-shell-v78');document.body.classList.add('cf-shell-v77');if(typeof window.only==='function')window.only('home');else{home.classList.remove('hidden');settings.classList.add('hidden');}if(typeof window.nav==='function')window.nav('home');}
function showSettings(){showHome();if(typeof window.only==='function')window.only('settingsPage');else{home.classList.add('hidden');settings.classList.remove('hidden');}if(typeof window.nav==='function')window.nav('settings');}
function showModule(key){
 if(!window.ControlFiscalV78Session?.()||!$('cf-existing-id')?.value?.trim()){showSettings();$('cf-safe-account')?.scrollIntoView({block:'center'});return;}
 document.body.classList.remove('cf-shell-v77');document.body.classList.add('cf-shell-v78');
 gate.querySelector('.cf-p6-nav [data-section="'+key+'"]')?.click();
}
function showAccount(){document.body.classList.remove('cf-shell-v77');document.body.classList.add('cf-shell-v78');gate.querySelector('.cf-p6-context')?.scrollIntoView({block:'start'});}
back.addEventListener('click',showHome);
const accountBtn=document.createElement('button');accountBtn.type='button';accountBtn.id='cf-safe-account';accountBtn.textContent='Conectar cuenta Google y Google Sheets';accountBtn.addEventListener('click',showAccount);settings.querySelector('.page')?.append(accountBtn);
const actions={nh:'home',nb:'compras',ns:'facturas',na:'agenda',ni:'inventario',ng:'settings'};
Object.entries(actions).forEach(([id,key])=>$(id)?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(key==='home')showHome();else if(key==='settings')showSettings();else showModule(key);},true));
home.querySelectorAll('button.home').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const old=b.getAttribute('onclick')||'';const key=/Compra/i.test(old)?'compras':/Facturad|Invoice/i.test(old)?'facturas':/openAgenda/i.test(old)?'agenda':/openInventory/i.test(old)?'inventario':/openSummary/i.test(old)?'facturas':null;if(key)showModule(key);},true));
const grid=home.querySelector('.homegrid');if(grid&&!$('cf-original-clients')){const b=document.createElement('button');b.id='cf-original-clients';b.type='button';b.className='home full';b.innerHTML='<div class="icon">👥</div><div class="text"><b>CLIENTES</b><small>GESTIONA TUS CLIENTES</small></div><div class="chev">›</div>';b.addEventListener('click',()=>showModule('clientes'));grid.append(b);}
const latest=$('latest');if(latest)latest.innerHTML='<div style="padding:14px;color:#57636e;font-size:12px">Consulta los registros actuales en cada módulo de Google Sheets.</div>';
showHome();
})();