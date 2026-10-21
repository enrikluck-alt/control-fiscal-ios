/* V78: menú principal de V77 como punto de entrada a módulos V78 ya conectados.
   Nunca ejecuta los onclick originales V77: su backend anterior está deshabilitado. */
(function(){'use strict';
const gate=document.getElementById('cf-google-test-gate'),panel=gate?.querySelector('.panel');
const nav=panel?.querySelector('.cf-p6-nav'),original=document.querySelector('#home .homegrid');
if(!gate||!panel||!nav||!original)return;
const css=document.createElement('style');css.id='cf-functional-home-css';css.textContent=`
#cf-google-test-gate .cf-p6-nav{display:none!important}
#cf-google-test-gate .cf-functional-home{margin:0 0 20px}
#cf-google-test-gate .cf-functional-home .homegrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
#cf-google-test-gate .cf-functional-home .home{width:100%;display:flex;align-items:center;gap:10px;background:#172332!important;border:1px solid #53616d!important;border-radius:14px!important;color:#fff!important;text-align:left!important;padding:15px 12px!important;margin:0!important;min-height:94px!important}
#cf-google-test-gate .cf-functional-home .home.full{grid-column:1/-1}
#cf-google-test-gate .cf-functional-home .home .icon{flex:none;width:32px;height:32px;color:#f5d841}
#cf-google-test-gate .cf-functional-home .home .icon svg{width:30px;height:30px}
#cf-google-test-gate .cf-functional-home .home .text{min-width:0;display:block}
#cf-google-test-gate .cf-functional-home .home .text b{display:block;font-size:14px;color:#fff}
#cf-google-test-gate .cf-functional-home .home .text small{display:block;font-size:10px;color:#bac5d3;margin-top:5px}
#cf-google-test-gate .cf-functional-home .home .chev{margin-left:auto}
#cf-google-test-gate .cf-functional-home .cf-home-title{text-align:center;color:#f3d849;font-weight:900;font-size:23px;margin:10px 0 4px}
#cf-google-test-gate .cf-functional-home .cf-home-sub{text-align:center;color:#bfcddd;font-size:12px;margin:0 0 18px}
#cf-google-test-gate .cf-functional-back{background:#f3d849!important;color:#111!important;font-weight:800;margin:0 0 12px!important}
#cf-google-test-gate .cf-phase1,#cf-google-test-gate .cf-phase-primary,#cf-google-test-gate .cf-p6-tools{display:none!important}
#cf-google-test-gate .cf-p6-context[hidden],#cf-google-test-gate .cf-functional-home[hidden],#cf-google-test-gate .cf-functional-back[hidden]{display:none!important}
#cf-google-test-gate .cf-p8-settings .cf-p6-tools{display:block!important}
#cf-google-test-gate .cf-v77-buy-warning{display:none!important}
#cf-google-test-gate .cf-p6-head small{display:none!important}
`;document.head.appendChild(css);
const home=document.createElement('div');home.className='cf-functional-home';home.innerHTML='<div class="cf-home-title">CONTROL FISCAL</div><p class="cf-home-sub">REGISTRA · CONTROLA · SIMPLIFICA</p>';
const grid=original.cloneNode(true);grid.removeAttribute('id');home.appendChild(grid);
const context=panel.querySelector('.cf-p6-context');const back=document.createElement('button');back.type='button';back.className='cf-functional-back';back.textContent='‹ Inicio';back.hidden=true;
nav.before(back);nav.before(home);
const settings=panel.querySelector('.cf-p8-settings');
const allSections=()=>Array.from(panel.querySelectorAll('.cf-p6-section'));
function showHome(){allSections().forEach(x=>x.hidden=true);if(settings)settings.hidden=true;home.hidden=false;back.hidden=true;if(context)context.hidden=false;window.scrollTo?.(0,0);gate.scrollTop=0;}
function openSection(key){const target=nav.querySelector('[data-section="'+key+'"]');if(!target)return;home.hidden=true;back.hidden=false;if(context)context.hidden=key!=='ajustes';target.click();if(key!=='ajustes'&&settings)settings.hidden=true;gate.scrollTop=0;}
back.addEventListener('click',showHome);
const buttons=Array.from(grid.querySelectorAll('button'));
buttons.forEach(b=>{const old=b.getAttribute('onclick')||'';b.removeAttribute('onclick');let key='';if(/openForm\('Compra'\)/.test(old))key='compras';else if(/openForm\('Facturado'\)|openFacturacionPage/.test(old))key='facturas';else if(/openAgenda/.test(old))key='agenda';else if(/openInventory/.test(old))key='inventario';else if(/openSettings/.test(old))key='ajustes';else if(/open.*Client|cliente/i.test(old))key='clientes';if(key){b.addEventListener('click',()=>openSection(key));}else{b.hidden=true;}});
// Acceso explícito a Clientes cuando la portada V77 no lo incluía.
if(!buttons.some(b=>!b.hidden&&/CLIENTES/i.test(b.textContent))){const b=document.createElement('button');b.type='button';b.className='home full';b.innerHTML='<div class="icon">👥</div><div class="text"><b>CLIENTES</b><small>GESTIONA TUS CLIENTES</small></div><div class="chev">›</div>';b.addEventListener('click',()=>openSection('clientes'));grid.appendChild(b);}
// Evita que los módulos antiguos queden visibles al volver al inicio.
showHome();
})();
