/* Fase 8C: original V77 UI owns the navigation. Fiscal CRUD remains V78. */
(function(){'use strict';
const $=id=>document.getElementById(id);
const gate=$('cf-google-test-gate'),panel=gate?.querySelector('.panel'),nav=panel?.querySelector('.cf-p6-nav');
const original=$('home'),form=$('formPage');if(!gate||!panel||!nav||!original||!form)return;
const css=document.createElement('style');css.textContent=`
#accountGate{display:none!important}
#cf-google-test-gate{display:block!important;position:relative!important;min-height:100dvh!important;height:auto!important;max-height:none!important;overflow:auto!important}
#cf-google-test-gate.cf-original-entered{display:none!important}
#cf-google-test-gate .cf-functional-home,#cf-google-test-gate .cf-functional-back{display:none!important}
#cf-google-test-gate .cf-p6-nav{display:none!important}
#cf-original-modules{width:100%;min-height:100%;padding:10px 14px 120px;overflow:visible}
#cf-original-modules .panel{border:0!important;background:transparent!important;box-shadow:none!important;padding:0!important;max-width:none!important}
#cf-original-modules .cf-p6-head{display:none!important}
#cf-original-modules .cf-p6-context{display:none!important}
#cf-original-modules .cf-p6-section{background:#121a21;border:1px solid #3d4b56;border-radius:14px;padding:12px;margin:8px 0}
#cf-original-modules .cf-p8-settings{background:#121a21!important}
#cf-original-modules .cf-phase1,#cf-original-modules .cf-phase-primary{display:none!important}
#cf-original-modules .cf-p6-tools{display:none!important}
#cf-original-modules .cf-v77-buy-warning{display:none!important}
#cf-original-modules .cf-p6-section[hidden]{display:none!important}
#cf-google-test-gate .cf-original-start{display:block;width:100%;background:#ffdf18;color:#111;border:0;border-radius:12px;padding:15px;font-weight:900;margin:15px 0}
`;document.head.appendChild(css);
const start=document.createElement('button');start.className='cf-original-start';start.type='button';start.textContent='Entrar en Control Fiscal (menú original)';
const status=document.createElement('p');status.style.cssText='font-size:12px;color:#f5ca9d';
const context=panel.querySelector('.cf-p6-context');(context||panel).append(start,status);
const pane=document.createElement('div');pane.id='cf-original-modules';
const formBody=$('formBody');formBody.appendChild(pane);
const header=$('formHeader');

let entered=false;
// Restaurar realmente el acceso Google tras salir, sin recargar la interfaz antigua.
window.addEventListener('cf-google-session-ended',()=>{
 entered=false;
 // El panel de Google se trasladó al formulario al entrar. Debe volver al gate.
 gate.appendChild(panel);
 gate.classList.remove('cf-original-entered');
 pane.replaceChildren();
 // La V76 antigua NO es la pantalla de acceso Google.
 for(const id of ['home','formPage','summaryPage','recordsPage','settingsPage','agendaPage','inventoryPage']) $(id)?.classList.add('hidden');
 const lock=$('securityLock');if(lock)lock.classList.add('hidden');
 gate.scrollTop=0;
 window.scrollTo?.(0,0);
});
function activeGoogle(){return window.ControlFiscalV78Session?.()||null;}
start.addEventListener('click',()=>{
 const session=activeGoogle();const id=$('cf-existing-id')?.value?.trim();
 if(!session){status.textContent='Primero inicia sesión con Google y verifica la cuenta.';return;}
 if(!id){status.textContent='Primero busca o crea tu libro personal de Google Sheets.';return;}
 entered=true;pane.appendChild(panel);gate.classList.add('cf-original-entered');
 // Existing module listeners and inputs are preserved when moving the panel.
 showOriginal('home');
});
function showOriginal(key){
 if(!entered)return;
 ['home','formPage','summaryPage','recordsPage','settingsPage','agendaPage','inventoryPage'].forEach(id=>$(id)?.classList.toggle('hidden',id!==(key==='home'?'home':key==='settings'?'settingsPage':'formPage')));
 if(key==='home'){if(typeof window.nav==='function')window.nav('home');return;}
 if(key==='settings'){if(typeof window.nav==='function')window.nav('settings');return;}
 header.innerHTML='<button class="back" type="button" id="cf-original-back">‹</button><div><h2>'+({clientes:'CLIENTES',inventario:'INVENTARIO',compras:'COMPRAS',facturas:'FACTURACIÓN',agenda:'AGENDA'}[key]||'CONTROL FISCAL')+'</h2><p>Google Sheets personal</p></div>';
 $('cf-original-back')?.addEventListener('click',()=>showOriginal('home'));
 nav.querySelector('[data-section="'+key+'"]')?.click();
 const settings=panel.querySelector('.cf-p8-settings');if(settings)settings.hidden=true;
 panel.querySelector('.cf-p6-context')?.setAttribute('hidden','');
 const f=panel.querySelector('.cf-functional-home');if(f)f.hidden=true;
 const b=panel.querySelector('.cf-functional-back');if(b)b.hidden=true;
 if(typeof window.nav==='function')window.nav(({compras:'buy',facturas:'sale',inventario:'inventory',agenda:'agenda'})[key]||'home');
 formBody.scrollTop=0;
}
// Capture before inline V77 onclick handlers. This prevents old fiscal storage paths.
const actions={nh:'home',nb:'compras',ns:'facturas',na:'agenda',ni:'inventario',ng:'settings'};
Object.entries(actions).forEach(([id,key])=>$(id)?.addEventListener('click',e=>{if(!entered)return;e.preventDefault();e.stopImmediatePropagation();showOriginal(key);},true));
original.querySelectorAll('button.home').forEach(b=>b.addEventListener('click',e=>{
 if(!entered)return;e.preventDefault();e.stopImmediatePropagation();const old=b.getAttribute('onclick')||'';
 const key=/Compra/.test(old)?'compras':/Facturado/.test(old)?'facturas':/openAgenda/.test(old)?'agenda':/openInventory/.test(old)?'inventario':/openSummary/.test(old)?'home':null;
 if(key)showOriginal(key);
},true));
// Add clients access in the original visual style without changing existing original tiles.
const grid=original.querySelector('.homegrid');if(grid&&!grid.querySelector('#cf-original-clients')){
 const b=document.createElement('button');b.id='cf-original-clients';b.type='button';b.className='home full';b.innerHTML='<div class="icon">👥</div><div class="text"><b>CLIENTES</b><small>GESTIONA TUS CLIENTES</small></div><div class="chev">›</div>';b.addEventListener('click',()=>showOriginal('clientes'));grid.appendChild(b);
}
// Do not render original V77 records: they belonged to the disabled admin backend.
const latest=$('latest');if(latest)latest.innerHTML='<div style="padding:14px;color:#57636e;font-size:12px">Los registros se consultan en cada módulo conectado a Google Sheets.</div>';
})();