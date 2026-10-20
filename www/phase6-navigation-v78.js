/* V78 Fase 6A: navegación unificada. Mantiene el bloqueo de las llamadas V77
   al backend anterior. Los formularios existentes siguen usando Sheets personal. */
(function(){'use strict';
const gate=document.getElementById('cf-google-test-gate');const panel=gate?.querySelector('.panel');if(!panel)return;
const sections=[['clientes','Clientes','cf-phase2'],['compras','Compras','cf-phase3'],['facturas','Facturas e ingresos','cf-phase4'],['agenda','Agenda','cf-phase5']];
const css=document.createElement('style');css.id='cf-v78-phase6-nav-css';css.textContent=`
#cf-google-test-gate{background:#0b1220!important;padding:calc(12px + env(safe-area-inset-top)) 12px calc(22px + env(safe-area-inset-bottom))!important}
#cf-google-test-gate .panel{background:#142035!important;max-width:660px!important;border:1px solid #32445c;border-radius:20px!important;padding:16px!important;text-align:left!important}
#cf-google-test-gate .cf-p6-head{display:flex;align-items:center;gap:12px;margin-bottom:12px}
#cf-google-test-gate .cf-p6-head img{width:48px;height:48px;object-fit:contain}
#cf-google-test-gate .cf-p6-head strong{font-size:21px;display:block}
#cf-google-test-gate .cf-p6-head small{color:#b9cce3;display:block;font-size:12px}
#cf-google-test-gate .cf-p6-nav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:16px 0}
#cf-google-test-gate .cf-p6-nav button{background:#263c58!important;color:#fff!important;border:1px solid #546a86!important;padding:13px 6px!important;margin:0!important;font-size:14px!important}
#cf-google-test-gate .cf-p6-nav button[aria-current=page]{background:#e4f0ff!important;color:#0d2543!important}
#cf-google-test-gate .cf-p6-section[hidden]{display:none!important}
#cf-google-test-gate .cf-p6-context{background:#22334a;border-radius:12px;padding:12px;margin:10px 0}
#cf-google-test-gate .cf-p6-context button{background:#dcecff;color:#142035}
#cf-google-test-gate .cf-p6-tools{margin:14px 0;text-align:left;border:1px solid #60718a;border-radius:10px;padding:12px}
#cf-google-test-gate .cf-p6-tools summary{cursor:pointer;font-weight:600}
#cf-google-test-gate .cf-p6-banner{font-size:12px;color:#c4d4e6;line-height:1.5}
`;document.head.appendChild(css);
const head=document.createElement('div');head.className='cf-p6-head';head.innerHTML='<img src="chispas-logo.png" alt=""><div><strong>Control Fiscal</strong><small>V78 · Área personal de Google Drive</small></div>';panel.prepend(head);
const title=panel.querySelector('h2');if(title)title.hidden=true;const subtitle=title?.nextElementSibling;if(subtitle?.tagName==='P')subtitle.hidden=true;
const nav=document.createElement('nav');nav.className='cf-p6-nav';nav.setAttribute('aria-label','Módulos fiscales');
const buttons=sections.map(([key,label])=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.section=key;nav.appendChild(b);return b;});
const context=document.createElement('div');context.className='cf-p6-context';context.innerHTML='<strong>Cuenta y libro personal</strong><p class="cf-p6-banner">Inicia sesión con Google y pulsa «Buscar mi libro automáticamente» antes de abrir los formularios.</p>';
const account=document.getElementById('cf-active-account')?.parentElement;
const find=document.getElementById('cf-auto-find');const create=document.getElementById('cf-auto-create');
if(account)context.appendChild(account);if(find)context.appendChild(find);if(create)context.appendChild(create);
const result=document.getElementById('cf-google-result');if(result)context.appendChild(result);
panel.insertBefore(context,head.nextSibling);panel.insertBefore(nav,context.nextSibling);
const panes=sections.map(([key,label,cls])=>{const p=panel.querySelector('.'+cls);if(p){p.classList.add('cf-p6-section');p.dataset.section=key;}return p;});
const tools=document.createElement('details');tools.className='cf-p6-tools';tools.innerHTML='<summary>Herramientas de Drive y diagnóstico</summary>';
const ids=['cf-existing-id','cf-inspect','cf-repair','cf-write-test','cf-read-test'];
for(const id of ids){const el=document.getElementById(id);if(!el)continue;if(id==='cf-existing-id'&&el.previousElementSibling?.tagName==='LABEL')tools.appendChild(el.previousElementSibling);tools.appendChild(el);}
const advanced=panel.querySelector('.cf-v78-advanced');if(advanced)tools.appendChild(advanced);
nav.after(tools);
function show(key){panes.forEach((p,i)=>{if(p)p.hidden=sections[i][0]!==key});buttons.forEach(b=>{if(b.dataset.section===key)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});const p=panes[sections.findIndex(x=>x[0]===key)];if(p)p.scrollIntoView({block:'nearest'});}
buttons.forEach(b=>b.addEventListener('click',()=>show(b.dataset.section)));
show('clientes');
})();
