/* V76 original UI + Google: explicit access screen, no exposed modules before login. */
(function(){'use strict';
const $=id=>document.getElementById(id);
const gate=$('cf-google-test-gate'),panel=gate?.querySelector('.panel'),nav=panel?.querySelector('.cf-p6-nav');
const original=$('home'),form=$('formPage'),formBody=$('formBody'),header=$('formHeader');
if(!gate||!panel||!nav||!original||!form||!formBody)return;
const style=document.createElement('style');style.id='cf-original-login-ui';style.textContent=`
#accountGate{display:none!important}
body.cf-google-locked #home,body.cf-google-locked #formPage,body.cf-google-locked #summaryPage,body.cf-google-locked #recordsPage,body.cf-google-locked #settingsPage,body.cf-google-locked #agendaPage,body.cf-google-locked #inventoryPage,body.cf-google-locked .bottom{display:none!important}
#cf-google-test-gate{box-sizing:border-box!important;display:block!important;position:fixed!important;inset:0!important;z-index:100002!important;height:100dvh!important;max-height:100dvh!important;overflow:auto!important;padding:calc(24px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))!important;background:#091118!important}
#cf-google-test-gate .panel{max-width:450px!important;margin:auto!important}
#cf-google-test-gate .cf-p6-head{justify-content:center}
#cf-google-test-gate .cf-p6-context{display:block!important}
#cf-google-test-gate .cf-p6-nav,#cf-google-test-gate .cf-p6-section,#cf-google-test-gate .cf-p8-settings,#cf-google-test-gate .cf-phase1,#cf-google-test-gate .cf-phase-primary,#cf-google-test-gate .cf-p6-tools,#cf-google-test-gate .cf-v77-buy-warning,#cf-google-test-gate .cf-functional-home,#cf-google-test-gate .cf-functional-back{display:none!important}
#cf-google-test-gate .cf-original-start{display:block;width:100%;background:#ffdf18;color:#111;border:0;border-radius:13px;padding:16px;font-weight:900;margin:16px 0}
#cf-google-test-gate.cf-original-entered{display:block!important;position:static!important;inset:auto!important;z-index:auto!important;height:auto!important;max-height:none!important;min-height:0!important;overflow:visible!important;padding:0!important;background:transparent!important}
#cf-google-test-gate.cf-original-entered .panel{max-width:none!important;margin:0!important;border:0!important;background:transparent!important;box-shadow:none!important;padding:0!important}
#cf-google-test-gate.cf-original-entered .cf-p6-section:not([hidden]){display:block!important;background:#121a21;border:1px solid #3d4b56;border-radius:14px;padding:12px;margin:8px 0}
#cf-google-test-gate.cf-original-entered .cf-p6-context{display:none!important}
#cf-google-test-gate.cf-original-entered .cf-p6-head{display:none!important}
#cf-google-test-gate.cf-original-entered .cf-p8-settings{display:none!important}
`;document.head.appendChild(style);
const context=panel.querySelector('.cf-p6-context');
const start=document.createElement('button');start.className='cf-original-start';start.type='button';start.textContent='Entrar en Control Fiscal';
const status=document.createElement('p');status.style.cssText='font-size:13px;color:#ffe19a;white-space:pre-wrap';
context.append(start,status);
const originalParent=gate.parentElement;
let entered=false;
function hidePages(){['home','formPage','summaryPage','recordsPage','settingsPage','agendaPage','inventoryPage'].forEach(id=>$(id)?.classList.add('hidden'));}
function show(key){
 if(!entered)return;
 const dest=key==='home'?'home':key==='settings'?'settingsPage':'formPage';
 ['home','formPage','summaryPage','recordsPage','settingsPage','agendaPage','inventoryPage'].forEach(id=>$(id)?.classList.toggle('hidden',id!==dest));
 if(key==='home'){window.nav?.('home');return;}
 if(key==='settings'){window.nav?.('settings');return;}
 const labels={clientes:'CLIENTES',inventario:'INVENTARIO',compras:'COMPRAS',facturas:'FACTURACIÓN',agenda:'AGENDA'};
 if(header)header.innerHTML='<button class="back" type="button" id="cf-original-back">‹</button><div><h2>'+labels[key]+'</h2><p>Google Sheets personal</p></div>';
 $('cf-original-back')?.addEventListener('click',()=>show('home'));
 nav.querySelector('[data-section="'+key+'"]')?.click();
 const s=panel.querySelector('.cf-p8-settings');if(s)s.hidden=true;
 window.nav?.(({compras:'buy',facturas:'sale',inventario:'inventory',agenda:'agenda'})[key]||'home');
}
function leave(){
 entered=false;
 gate.classList.remove('cf-original-entered');
 originalParent.appendChild(gate);
 document.body.classList.add('cf-google-locked');
 hidePages();
 $('securityLock')?.classList.add('hidden');
 status.textContent='';gate.scrollTop=0;
}
start.addEventListener('click',()=>{
 const session=window.ControlFiscalV78Session?.();const book=$('cf-existing-id')?.value?.trim();
 if(!session){status.textContent='Inicia sesión con Google y verifica tu cuenta.';return;}
 if(!book){status.textContent='Primero busca o crea tu libro personal de Google Sheets.';return;}
 entered=true;
 document.body.classList.remove('cf-google-locked');
 formBody.appendChild(gate);gate.classList.add('cf-original-entered');
 show('home');
});
window.addEventListener('cf-google-session-ended',leave);
const actions={nh:'home',nb:'compras',ns:'facturas',na:'agenda',ni:'inventario',ng:'settings'};
Object.entries(actions).forEach(([id,key])=>$(id)?.addEventListener('click',e=>{if(!entered)return;e.preventDefault();e.stopImmediatePropagation();show(key);},true));
original.querySelectorAll('button.home').forEach(b=>b.addEventListener('click',e=>{
 if(!entered)return;const old=b.getAttribute('onclick')||'';
 const key=/Compra/.test(old)?'compras':/Facturado/.test(old)?'facturas':/openAgenda/.test(old)?'agenda':/openInventory/.test(old)?'inventario':/openSummary/.test(old)?'home':null;
 if(key){e.preventDefault();e.stopImmediatePropagation();show(key);}
},true));
const grid=original.querySelector('.homegrid');if(grid&&!$('cf-original-clients')){
 const b=document.createElement('button');b.id='cf-original-clients';b.type='button';b.className='home full';b.innerHTML='<div class="icon">👥</div><div class="text"><b>CLIENTES</b><small>GESTIONA TUS CLIENTES</small></div><div class="chev">›</div>';b.addEventListener('click',()=>show('clientes'));grid.appendChild(b);
}
const latest=$('latest');if(latest)latest.innerHTML='<div style="padding:14px;color:#9ca7ae;font-size:12px">Consulta los registros en cada módulo de Google Sheets.</div>';
leave();
})();
