/* Fase 6B.5: interfaz de Facturas e Ingresos inspirada en V77.
   Conserva íntegro el CRUD de phase4-v78.js; no activa Apps Script,
   numeración fiscal, PDF, ni registro de cobros automáticos. */
(function(){'use strict';
const gate=document.getElementById('cf-google-test-gate');
const section=gate?.querySelector('.cf-phase4');
const nav=gate?.querySelector('.cf-p6-nav');
const form=section?.querySelector('#cf-p4-form');
if(!section||!nav||!form)return;
section.classList.add('cf-v77-billing');
const oldHeading=section.querySelector('h3');if(oldHeading)oldHeading.hidden=true;
const oldNote=oldHeading?.nextElementSibling;if(oldNote?.tagName==='P')oldNote.hidden=true;
const header=document.createElement('header');header.className='cf-v77-billing-head';
header.innerHTML='<div class="cf-v77-billing-icon" aria-hidden="true">🧾</div><div><h2 id="cf-v77-billing-title">FACTURACIÓN</h2><p id="cf-v77-billing-subtitle">Borradores y conceptos · Google Drive personal</p></div>';
section.insertBefore(header,section.firstChild);
const warning=document.createElement('p');warning.className='cf-v77-billing-warning';warning.textContent='MODO DE PRUEBA · Los borradores no son facturas emitidas. No se asigna numeración fiscal, no se genera PDF y no se registran cobros automáticamente.';header.after(warning);
const switches=section.querySelector('.cf-p4-actions');
if(switches){switches.classList.add('cf-v77-billing-tabs');for(const b of switches.querySelectorAll('[data-switch]'))b.setAttribute('aria-pressed',String(b.dataset.switch==='Facturas'));}
const list=section.querySelector('#cf-p4-list');if(list){const h=document.createElement('h3');h.className='cf-v77-billing-list-title';h.id='cf-v77-billing-list-title';h.textContent='BORRADORES GUARDADOS';list.before(h);}
const totals=section.querySelector('#cf-p4-totals');
if(totals){totals.classList.add('cf-v77-billing-totals');totals.setAttribute('aria-live','polite');}
function update(){const selected=section.querySelector('.cf-v77-billing-tabs [data-switch="Ingresos"]')?.getAttribute('aria-pressed')==='true'?'Ingresos':'Facturas';
 const income=selected==='Ingresos';
 const title=section.querySelector('#cf-v77-billing-title');if(title)title.textContent=income?'INGRESOS':'FACTURACIÓN';
 const subtitle=section.querySelector('#cf-v77-billing-subtitle');if(subtitle)subtitle.textContent=income?'Registro de cobros de prueba · Google Drive personal':'Borradores y conceptos · Google Drive personal';
 const listTitle=section.querySelector('#cf-v77-billing-list-title');if(listTitle)listTitle.textContent=income?'HISTORIAL DE INGRESOS':'BORRADORES GUARDADOS';
 section.classList.toggle('cf-v77-billing-income',income);
}
if(switches)switches.addEventListener('click',e=>{const b=e.target.closest('[data-switch]');if(!b)return;for(const x of switches.querySelectorAll('[data-switch]'))x.setAttribute('aria-pressed',String(x===b));update();});
const menu=nav.querySelector('[data-section="facturas"]');if(menu){menu.textContent='Facturas e ingresos';menu.addEventListener('click',()=>{section.hidden=false;update();},true);}
for(const [name,placeholder] of [['concepto','Ej. Servicio de sonido e iluminación'],['referencia','Ej. Transferencia / referencia bancaria']]){const el=form.elements[name];if(el)el.placeholder=placeholder;}
const css=document.createElement('style');css.id='cf-v77-billing-css';css.textContent=`
#cf-google-test-gate .cf-v77-billing{background:#090f17;color:#f4f7fa;border:1px solid #3d4b56;border-radius:14px;padding:16px 12px}
#cf-google-test-gate .cf-v77-billing-head{display:flex;align-items:center;gap:12px;margin:0 0 12px}
#cf-google-test-gate .cf-v77-billing-icon{display:grid;place-items:center;flex:none;width:54px;height:54px;font-size:26px;background:#302918;border:1px solid #877030;border-radius:12px}
#cf-google-test-gate .cf-v77-billing-head h2{margin:0;color:#ffdf18;font-size:23px;font-weight:900;letter-spacing:.3px}
#cf-google-test-gate .cf-v77-billing-head p{margin:5px 0 0;font-size:12px;color:#c6d3e0}
#cf-google-test-gate .cf-v77-billing-warning{background:#302919;color:#ffe4a0;padding:11px;border-radius:9px;font-size:12px;line-height:1.5}
#cf-google-test-gate .cf-v77-billing-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0}
#cf-google-test-gate .cf-v77-billing-tabs button{background:#243247;color:#fff;border:1px solid #6a7c90;border-radius:10px;font-weight:700}
#cf-google-test-gate .cf-v77-billing-tabs button[aria-pressed="true"]{background:#ffdf18;color:#101820;border-color:#ffdf18}
#cf-google-test-gate .cf-v77-billing #cf-p4-form label{color:#e6edf6;font-weight:600}
#cf-google-test-gate .cf-v77-billing #cf-p4-form input,#cf-google-test-gate .cf-v77-billing #cf-p4-form select{background:#172332;color:#fff;border:1px solid #718198;border-radius:9px;min-height:43px}
#cf-google-test-gate .cf-v77-billing #cf-p4-form option{background:#172332;color:#fff}
#cf-google-test-gate .cf-v77-billing-totals{background:#273345;border:1px solid #5b6e87;color:#ffdf18;border-radius:10px;padding:14px 10px;font-weight:800;line-height:1.6;margin:14px 0}
#cf-google-test-gate .cf-v77-billing button[type="submit"]{background:#ffdf18;color:#101820;font-weight:800;border-radius:9px}
#cf-google-test-gate .cf-v77-billing-list-title{font-size:17px;color:#ffdf18;margin:24px 0 12px}
#cf-google-test-gate .cf-v77-billing .cf-p4-item{background:#152234;border:1px solid #4a5e76;border-radius:10px;margin:9px 0;padding:12px}
#cf-google-test-gate .cf-v77-billing .cf-p4-item small{overflow-wrap:anywhere;color:#b4c4d6}
#cf-google-test-gate .cf-v77-billing #cf-p4-context{color:#c4d5e6;font-size:12px;overflow-wrap:anywhere}
#cf-google-test-gate .cf-v77-billing #cf-p4-msg{color:#dcecff}
#cf-google-test-gate .cf-v77-billing-income .cf-v77-billing-head h2{color:#83e5c0}
#cf-google-test-gate .cf-v77-billing-income .cf-v77-billing-totals{color:#83e5c0}
@media(max-width:380px){#cf-google-test-gate .cf-v77-billing-head h2{font-size:20px}#cf-google-test-gate .cf-v77-billing .cf-p4-actions button{padding:9px 7px;font-size:13px}}
`;document.head.appendChild(css);
update();
})();
