/* Fase 7A: calendario mensual para la Agenda personal V78. Solo muestra datos
   recibidos del CRUD ya validado; no hace peticiones nuevas ni guarda tokens. */
(function(){'use strict';
const section=document.querySelector('#cf-google-test-gate .cf-phase5');
const list=section?.querySelector('#cf-p5-list');if(!section||!list)return;
const shell=document.createElement('section');shell.className='cf-calendar';shell.setAttribute('aria-label','Calendario mensual');
shell.innerHTML='<div class="cf-calendar-head"><button type="button" id="cf-cal-prev" aria-label="Mes anterior">‹</button><h3 id="cf-cal-month"></h3><button type="button" id="cf-cal-next" aria-label="Mes siguiente">›</button><button type="button" id="cf-cal-today">Hoy</button></div><div class="cf-calendar-weekdays" aria-hidden="true"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div><div class="cf-calendar-grid" id="cf-cal-grid" role="group" aria-label="Días del mes"></div><div class="cf-calendar-day-events" id="cf-cal-day-events" aria-live="polite"></div><p class="cf-calendar-tip">Pulsa «Actualizar lista» para cargar los eventos del Google Sheets personal. El calendario no se sincroniza con Google Calendar.</p>';
const form=section.querySelector('#cf-p5-form');section.insertBefore(shell,form||list);
const $=id=>shell.querySelector('#'+id),fmt=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
let view=new Date(),selected=fmt(new Date()),events=[],loaded=false,context='';view=new Date(view.getFullYear(),view.getMonth(),1);
const dayName=new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric'});
function dayEvents(){const daily=events.filter(e=>e.fecha===selected).sort((a,b)=>(a.hora||'').localeCompare(b.hora||''));const target=$('cf-cal-day-events');target.replaceChildren();const h=document.createElement('h4');h.textContent='Eventos del '+selected.split('-').reverse().join('/');target.append(h);
if(!loaded){const p=document.createElement('p');p.textContent='Actualiza la lista para mostrar los eventos de tu cuenta.';target.append(p);return;}
if(!daily.length){const p=document.createElement('p');p.textContent='No hay eventos registrados este día.';target.append(p);return;}
for(const e of daily){const item=document.createElement('div');item.className='cf-calendar-event';const title=document.createElement('strong');title.textContent=(e.hora||'')+' · '+(e.titulo||'Evento');const detail=document.createElement('small');detail.textContent=[e.estado,e.ubicacion].filter(Boolean).join(' · ');const edit=document.createElement('button');edit.type='button';edit.textContent='Editar';edit.addEventListener('click',()=>{const original=Array.from(list.querySelectorAll('button[data-edit]')).find(b=>b.dataset.edit===e.id);if(original)original.click();else alert('Actualiza la lista antes de editar este evento.');});item.append(title,detail,edit);target.append(item);}}
function draw(){const y=view.getFullYear(),m=view.getMonth(),first=(new Date(y,m,1).getDay()+6)%7,days=new Date(y,m+1,0).getDate();$('cf-cal-month').textContent=dayName.format(view);const grid=$('cf-cal-grid');grid.replaceChildren();for(let i=0;i<first;i++){const spacer=document.createElement('span');spacer.className='cf-calendar-blank';grid.append(spacer);}for(let d=1;d<=days;d++){const date=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');const count=events.filter(e=>e.fecha===date).length;const b=document.createElement('button');b.type='button';b.className='cf-calendar-date';if(date===selected)b.classList.add('selected');if(date===fmt(new Date()))b.classList.add('today');b.setAttribute('aria-label',d+' de '+dayName.format(view)+(count?' · '+count+' eventos':''));b.setAttribute('aria-pressed',String(date===selected));const n=document.createElement('span');n.textContent=d;b.append(n);if(count){const dot=document.createElement('small');dot.textContent=count+' ●';b.append(dot);}b.addEventListener('click',()=>{selected=date;draw();});grid.append(b);}dayEvents();}
$('cf-cal-prev').addEventListener('click',()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);selected=fmt(view);draw();});$('cf-cal-next').addEventListener('click',()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);selected=fmt(view);draw();});$('cf-cal-today').addEventListener('click',()=>{const now=new Date();view=new Date(now.getFullYear(),now.getMonth(),1);selected=fmt(now);draw();});
section.addEventListener('cf-agenda-records',e=>{const d=e.detail||{};events=Array.isArray(d.records)?d.records:[];context=d.context||'';loaded=!!context;draw();});
const style=document.createElement('style');style.textContent=`
#cf-google-test-gate .cf-calendar{background:#101c26;border:1px solid #3c5364;border-radius:12px;padding:12px;margin:15px 0;color:#eaf4fa}
#cf-google-test-gate .cf-calendar-head{display:flex;align-items:center;gap:7px;margin-bottom:12px}
#cf-google-test-gate .cf-calendar-head h3{flex:1;margin:0;text-transform:capitalize;font-size:17px;text-align:center}
#cf-google-test-gate .cf-calendar-head button{background:#203e50;color:white;border:1px solid #55758a;border-radius:7px;padding:7px 10px;min-width:35px}
#cf-google-test-gate .cf-calendar-weekdays,#cf-google-test-gate .cf-calendar-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;text-align:center}
#cf-google-test-gate .cf-calendar-weekdays{color:#a9c4d2;font-weight:700;font-size:12px;margin-bottom:6px}
#cf-google-test-gate .cf-calendar-date{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:0;min-height:45px;padding:3px 0;background:#1a2a36;color:#f5faff;border:1px solid #304858;border-radius:7px;font-size:13px}
#cf-google-test-gate .cf-calendar-date small{font-size:10px;color:#81d5e9}
#cf-google-test-gate .cf-calendar-date.selected{background:#1e7188;border:2px solid #b3edff}
#cf-google-test-gate .cf-calendar-date.today:not(.selected){border-color:#e0b867}
#cf-google-test-gate .cf-calendar-day-events{margin-top:15px}
#cf-google-test-gate .cf-calendar-day-events h4{margin:0 0 9px;font-size:14px}
#cf-google-test-gate .cf-calendar-event{background:#192c38;padding:9px;border-radius:8px;margin:7px 0;display:flex;flex-direction:column;gap:5px}
#cf-google-test-gate .cf-calendar-event small{color:#bfd3de}
#cf-google-test-gate .cf-calendar-event button{align-self:flex-start;background:#2b566c;color:white;border:1px solid #7198aa;border-radius:7px;padding:6px 14px}
#cf-google-test-gate .cf-calendar-tip{color:#b3c7d1;font-size:11px;line-height:1.5;margin:12px 0 0}
`;document.head.append(style);draw();
})();
