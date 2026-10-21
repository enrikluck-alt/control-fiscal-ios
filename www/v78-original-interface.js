/* Fase 8D: V77 is the sole application shell. V78 only supplies private Sheets modules. */
(function(){'use strict';
const $=id=>document.getElementById(id);
const gate=$('cf-google-test-gate'),panel=gate?.querySelector('.panel');
const home=$('home'),form=$('formPage'),body=$('formBody'),settings=$('settingsPage');
if(!gate||!panel||!home||!form||!body||!settings)return;
const style=document.createElement('style');style.id='cf-v78-original-shell-fix';style.textContent=`
#accountGate{display:none!important}
#cf-google-test-gate{position:static!important;inset:auto!important;z-index:auto!important;display:block!important;width:100%!important;height:auto!important;max-height:none!important;min-height:0!important;overflow:visible!important;background:transparent!important;padding:0!important;margin:0!important;transform:none!important}
#cf-google-test-gate .panel{max-width:none!important;width:100%!important;min-height:0!important;height:auto!important;margin:0!important;box-sizing:border-box!important;overflow:visible!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;padding:8px 4px 110px!important}
#cf-google-test-gate .cf-p6-head,#cf-google-test-gate .cf-p6-nav,#cf-google-test-gate .cf-p6-context,#cf-google-test-gate .cf-functional-home,#cf-google-test-gate .cf-functional-back,#cf-google-test-gate .cf-phase1,#cf-google-test-gate .cf-phase-primary,#cf-google-test-gate .cf-p6-tools{display:none!important}
#cf-google-test-gate .cf-p6-section{background:#121a21;border:1px solid #3d4b56;border-radius:14px;padding:12px;margin:8px 0}
#cf-google-test-gate .cf-p6-section[hidden]{display:none!important}
#cf-google-test-gate .cf-p6-section input,#cf-google-test-gate .cf-p6-section select,#cf-google-test-gate .cf-p6-section textarea{max-width:100%;box-sizing:border-box}
#cf-v78-google-settings{background:#121a21;border:1px solid #3d4b56;border-radius:16px;padding:15px;margin:14px 0 26px;color:#f6f8fa}
#cf-v78-google-settings h3{margin:0 0 8px;font-size:16px}
#cf-v78-google-settings p{font-size:12px;line-height:1.45}
#cf-v78-google-settings button{min-height:42px;margin:5px 3px 5px 0;padding:9px 12px;border:1px solid #556879;border-radius:10px;background:#ffdf18;color:#111;font-weight:750}
#cf-v78-google-settings .cf-p6-context{display:block!important;background:transparent!important;padding:0!important}
#cf-v78-google-settings .cf-p6-context button{background:#ffdf18!important;color:#111!important}
#cf-v78-google-settings details{margin-top:12px;border:1px solid #45515e;padding:10px;border-radius:10px}
#cf-v78-google-settings input{max-width:100%;width:100%;box-sizing:border-box}
`;document.head.appendChild(style);
// Put the V78 backend widgets inside the original V77 content, never above the home screen.
body.appendChild(gate);
const nav=panel.querySelector('.cf-p6-nav');
const context=panel.querySelector('.cf-p6-context');
const settingsPage=settings.querySelector('.page');
const authBox=document.createElement('div');authBox.id='cf-v78-google-settings';
authBox.innerHTML='<h3>Cuenta Google y almacenamiento personal</h3><p>Conecta tu cuenta y recupera tu libro para utilizar los módulos fiscales. Los datos se guardan en tu propio Google Sheets.</p>';
if(context)authBox.appendChild(context);
const tools=panel.querySelector('.cf-p6-tools');if(tools){tools.classList.remove('cf-p6-tools');tools.innerHTML=tools.innerHTML.replace('Herramientas de Drive y diagnóstico','Diagnóstico avanzado de Google Drive');authBox.appendChild(tools);}
settingsPage.appendChild(authBox);
const panes=['clientes','inventario','compras','facturas','agenda'];
function sessionReady(){return !!window.ControlFiscalV78Session?.() && !!$('cf-existing-id')?.value?.trim();}
function showSection(key){
 if(!sessionReady()){showSettings();$('cf-v78-google-settings')?.scrollIntoView({block:'start'});return;}
 document.querySelectorAll('.app > section').forEach(s=>s.classList.toggle('hidden',s!==form));
 const names={clientes:'CLIENTES',inventario:'INVENTARIO',compras:'COMPRAS',facturas:'FACTURACIÓN',agenda:'AGENDA'};
 $('formHeader').innerHTML='<button class="back" type="button" id="cf-back-original">‹</button><div><h2>'+names[key]+'</h2><p>Google Sheets personal</p></div>';
 $('cf-back-original').addEventListener('click',showHome);
 nav?.querySelector('[data-section="'+key+'"]')?.click();
 const panels=panel.querySelectorAll('.cf-p6-section');
 panels.forEach(p=>{const section=p.dataset.section;const isP2=p.classList.contains('cf-phase2');p.hidden=isP2?!['clientes','inventario'].includes(key):section!==key;});
 if(['clientes','inventario'].includes(key))panel.querySelector('.cf-phase2 [data-tab="'+(key==='clientes'?'Clientes':'Inventario')+'"]')?.click();
 if(typeof window.nav==='function')window.nav(({compras:'buy',facturas:'sale',inventario:'inventory',agenda:'agenda'})[key]||'home');
 body.scrollTop=0;
}
function showHome(){document.querySelectorAll('.app > section').forEach(s=>s.classList.toggle('hidden',s!==home));if(typeof window.nav==='function')window.nav('home');}
function showSettings(){document.querySelectorAll('.app > section').forEach(s=>s.classList.toggle('hidden',s!==settings));if(typeof window.nav==='function')window.nav('settings');}
const actions={nh:'home',nb:'compras',ns:'facturas',na:'agenda',ni:'inventario',ng:'settings'};
Object.entries(actions).forEach(([id,key])=>$(id)?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();key==='home'?showHome():key==='settings'?showSettings():showSection(key);},true));
settings.querySelectorAll('.back').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();showHome();},true));
home.querySelectorAll('button.home').forEach(b=>b.addEventListener('click',e=>{
 e.preventDefault();e.stopImmediatePropagation();const old=b.getAttribute('onclick')||'';
 const key=/Compra/i.test(old)?'compras':/Facturad|openInvoice/i.test(old)?'facturas':/openAgenda/i.test(old)?'agenda':/openInventory/i.test(old)?'inventario':/openSummary/i.test(old)?'summary':null;
 if(key==='summary'){showSection('facturas');}else if(key)showSection(key);
},true));
const grid=home.querySelector('.homegrid');if(grid&&!grid.querySelector('#cf-original-clients')){
 const b=document.createElement('button');b.id='cf-original-clients';b.type='button';b.className='home full';b.innerHTML='<div class="icon">👥</div><div class="text"><b>CLIENTES</b><small>GESTIONA TUS CLIENTES</small></div><div class="chev">›</div>';b.addEventListener('click',()=>showSection('clientes'));grid.appendChild(b);
}
// Do not present historical V77 records from the old admin-owned storage as current data.
const latest=$('latest');if(latest)latest.innerHTML='<div style="padding:14px;color:#57636e;font-size:12px">Consulta los registros actuales en cada módulo conectado a Google Sheets.</div>';
showHome();
})();
