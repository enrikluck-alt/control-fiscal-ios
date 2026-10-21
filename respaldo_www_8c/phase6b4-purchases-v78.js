/* Fase 6B.4: presentación de Compras inspirada en la pantalla original V77.
   Conserva íntegramente el CRUD validado de phase3-v78.js y su semántica de BASE sin IVA.
   No activa sendRecord() de V77, Apps Script ni subida de justificantes. */
(function(){'use strict';
const gate=document.getElementById('cf-google-test-gate');
const panel=gate?.querySelector('.panel'),nav=panel?.querySelector('.cf-p6-nav');
const section=panel?.querySelector('.cf-phase3'),form=section?.querySelector('#cf-p3-form');
if(!panel||!nav||!section||!form)return;
section.classList.add('cf-v77-purchases');
const h=section.querySelector('h3');if(h)h.hidden=true;
const note=h?.nextElementSibling;if(note?.tagName==='P')note.hidden=true;
const header=document.createElement('div');header.className='cf-v77-buy-header';
header.innerHTML='<span class="cf-v77-buy-icon" aria-hidden="true">🛒</span><div><h2>COMPRAS</h2><p>Registra tus gastos de forma rápida</p></div>';
section.insertBefore(header,section.firstChild);
const warning=document.createElement('p');warning.className='cf-v77-buy-warning';warning.textContent='Modo de prueba · Importe introducido SIN IVA. El justificante no se adjunta en esta fase.';
header.after(warning);
const provider=form.elements.proveedor;
if(provider){provider.placeholder='Ej. MadridHifi, proveedor habitual';provider.autocomplete='organization';}
const concept=form.elements.concepto;if(concept)concept.placeholder='Ej. Cable DMX, estructura, etc.';
const base=form.elements.base;if(base)base.placeholder='0,00';
const labels=Array.from(form.querySelectorAll('label'));
for(const label of labels){if(label.contains(base))label.firstChild.textContent='Base imponible (SIN IVA) (€)';}
const totals=section.querySelector('#cf-p3-totals');
if(totals){const calc=document.createElement('div');calc.className='cf-v77-buy-calc';calc.innerHTML='<div><small>BASE IMPONIBLE</small><strong id="cf-v77-buy-base">0,00 €</strong></div><div><small>IVA SOPORTADO</small><strong id="cf-v77-buy-tax">0,00 €</strong></div><div><small>TOTAL</small><strong id="cf-v77-buy-total">0,00 €</strong></div>';totals.after(calc);totals.hidden=true;
 const euro=c=>(c/100).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
 function update(){const n=String(base?.value||'').trim().replace(',','.');const rate=Number(form.elements.iva?.value||0);if(!/^\d+(?:\.\d{1,2})?$/.test(n)||!Number.isFinite(rate)){for(const el of calc.querySelectorAll('strong'))el.textContent='—';return;}
 const b=Math.round(Number(n)*100),t=Math.round(b*rate/100);calc.querySelector('#cf-v77-buy-base').textContent=euro(b);calc.querySelector('#cf-v77-buy-tax').textContent=euro(t);calc.querySelector('#cf-v77-buy-total').textContent=euro(b+t);}
 form.addEventListener('input',update);form.addEventListener('change',update);section.querySelector('#cf-p3-new')?.addEventListener('click',()=>queueMicrotask(update));section.querySelector('#cf-p3-list')?.addEventListener('click',()=>queueMicrotask(update));update();
}
const list=section.querySelector('#cf-p3-list');if(list){const heading=document.createElement('h3');heading.className='cf-v77-buy-list-heading';heading.textContent='HISTORIAL DE COMPRAS';list.before(heading);}
const menu=nav.querySelector('[data-section="compras"]');menu?.addEventListener('click',()=>{section.hidden=false;section.scrollIntoView({block:'nearest'});},true);
const css=document.createElement('style');css.id='cf-v77-buy-css';css.textContent=`
#cf-google-test-gate .cf-v77-purchases{background:#080e13;border:1px solid #3d4b56;border-radius:14px;padding:16px 12px;color:#f4f7fa}
#cf-google-test-gate .cf-v77-buy-header{display:flex;gap:12px;align-items:center;margin:0 0 12px}
#cf-google-test-gate .cf-v77-buy-header h2{color:#ffdf18;margin:0;font-size:23px;font-weight:900}
#cf-google-test-gate .cf-v77-buy-header p{color:#c5d0d9;margin:4px 0;font-size:13px}
#cf-google-test-gate .cf-v77-buy-icon{display:grid;place-items:center;font-size:27px;background:#2d2c16;border:1px solid #766a27;width:55px;height:55px;border-radius:13px;flex:none}
#cf-google-test-gate .cf-v77-buy-warning{background:#2e2916;color:#ffdf90;padding:11px;border-radius:9px;font-size:12px;line-height:1.5}
#cf-google-test-gate .cf-v77-purchases #cf-p3-form{background:transparent}
#cf-google-test-gate .cf-v77-purchases #cf-p3-form label{color:#e5edf3;font-weight:600}
#cf-google-test-gate .cf-v77-purchases #cf-p3-form input,#cf-google-test-gate .cf-v77-purchases #cf-p3-form select{background:#17212e;color:#fff;border:1px solid #647587;border-radius:9px}
#cf-google-test-gate .cf-v77-buy-calc{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:14px 0}
#cf-google-test-gate .cf-v77-buy-calc>div{padding:10px 5px;text-align:center;border-radius:9px;background:#1c2937;min-width:0}
#cf-google-test-gate .cf-v77-buy-calc>div:last-child{background:#4b420e}
#cf-google-test-gate .cf-v77-buy-calc small{display:block;font-size:9px;color:#c5d2de}
#cf-google-test-gate .cf-v77-buy-calc strong{display:block;font-size:14px;color:#ffdf18;overflow-wrap:anywhere;margin-top:5px}
#cf-google-test-gate .cf-v77-purchases button[type=submit]{background:#ffdf18;color:#101820;font-weight:800}
#cf-google-test-gate .cf-v77-buy-list-heading{font-size:17px;color:#ffdf18;margin:24px 0 10px}
`;document.head.appendChild(css);
})();
