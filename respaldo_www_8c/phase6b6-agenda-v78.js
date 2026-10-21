/* Fase 6B.6: presentación de Agenda inspirada en V77. Conserva sin cambios el CRUD validado de phase5-v78.js. */
(function(){'use strict';
const gate=document.getElementById('cf-google-test-gate');
const section=gate?.querySelector('.cf-phase5');
if(!section||!section.querySelector('#cf-p5-form'))return;
section.classList.add('cf-v77-agenda');
const oldTitle=section.querySelector('h3');if(oldTitle)oldTitle.hidden=true;
const oldDescription=oldTitle?.nextElementSibling;if(oldDescription?.tagName==='P')oldDescription.hidden=true;
const header=document.createElement('header');header.className='cf-v77-agenda-head';
header.innerHTML='<div class="cf-v77-agenda-icon" aria-hidden="true">📅</div><div><h2>AGENDA</h2><p>Eventos y compromisos · Google Drive personal</p></div>';
section.insertBefore(header,section.firstChild);
const note=document.createElement('p');note.className='cf-v77-agenda-note';note.textContent='AGENDA PERSONAL · Los eventos se guardan en tu Google Sheets. No hay sincronización con Google Calendar ni avisos automáticos.';header.after(note);
const form=section.querySelector('#cf-p5-form');form.classList.add('cf-v77-agenda-form');
const actions=section.querySelector('.cf-p5-actions');if(actions)actions.classList.add('cf-v77-agenda-actions');
const list=section.querySelector('#cf-p5-list');if(list){const title=document.createElement('h3');title.className='cf-v77-agenda-list-title';title.textContent='PRÓXIMOS EVENTOS Y REGISTROS';list.before(title);list.classList.add('cf-v77-agenda-list');}
const fields=form.elements; if(fields.titulo)fields.titulo.placeholder='Ej. Montaje de sonido e iluminación';if(fields.ubicacion)fields.ubicacion.placeholder='Lugar del evento';if(fields.notas)fields.notas.placeholder='Información adicional';
const css=document.createElement('style');css.id='cf-v77-agenda-css';css.textContent=`
#cf-google-test-gate .cf-v77-agenda{background:#0c1319;color:#f3f5f7;border:1px solid #41515e;border-radius:14px;padding:16px 12px}
#cf-google-test-gate .cf-v77-agenda-head{display:flex;align-items:center;gap:12px;margin:0 0 10px}
#cf-google-test-gate .cf-v77-agenda-icon{display:grid;place-items:center;flex:none;width:52px;height:52px;font-size:26px;background:#172e38;border:1px solid #436777;border-radius:12px}
#cf-google-test-gate .cf-v77-agenda-head h2{font-size:22px;letter-spacing:.06em;margin:0;color:#fff}
#cf-google-test-gate .cf-v77-agenda-head p{font-size:12px;color:#c5d0d7;margin:5px 0 0}
#cf-google-test-gate .cf-v77-agenda-note{padding:10px 12px;background:#16232c;border-left:3px solid #57a9ba;border-radius:6px;color:#d1e3e8;font-size:12px;line-height:1.5}
#cf-google-test-gate .cf-v77-agenda-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px 12px;margin-top:14px}
#cf-google-test-gate .cf-v77-agenda-form label{font-size:13px;font-weight:600;color:#d6e0e7;margin:5px 0}
#cf-google-test-gate .cf-v77-agenda-form label:first-child,#cf-google-test-gate .cf-v77-agenda-form label:nth-child(4),#cf-google-test-gate .cf-v77-agenda-form label:nth-child(6){grid-column:1/-1}
#cf-google-test-gate .cf-v77-agenda-form input,#cf-google-test-gate .cf-v77-agenda-form select,#cf-google-test-gate .cf-v77-agenda-form textarea{background:#121d25!important;color:#fff!important;border:1px solid #526372!important;border-radius:9px!important;min-height:43px!important;margin-top:6px!important}
#cf-google-test-gate .cf-v77-agenda-form input::placeholder,#cf-google-test-gate .cf-v77-agenda-form textarea::placeholder{color:#aab7c1}
#cf-google-test-gate .cf-v77-agenda-actions{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}
#cf-google-test-gate .cf-v77-agenda-actions button{background:#203846!important;border:1px solid #4d7589!important;color:#fff!important;border-radius:9px!important;flex:1 1 125px}
#cf-google-test-gate .cf-v77-agenda-actions button[type=submit]{background:#20677a!important;border-color:#68a5b3!important}
#cf-google-test-gate .cf-v77-agenda-list-title{font-size:13px;letter-spacing:.06em;margin:22px 0 8px;color:#e0ebef}
#cf-google-test-gate .cf-v77-agenda-list .cf-p5-item{background:#111c24;border:1px solid #3c505e;border-radius:11px;padding:12px;margin:9px 0}
#cf-google-test-gate .cf-v77-agenda-list .cf-p5-item strong{font-size:15px;color:#fff}
#cf-google-test-gate .cf-v77-agenda-list .cf-p5-item small{color:#cad8df}
#cf-google-test-gate .cf-v77-agenda #cf-p5-message{color:#d7e9ef}
@media(max-width:370px){#cf-google-test-gate .cf-v77-agenda-form{grid-template-columns:1fr}#cf-google-test-gate .cf-v77-agenda-form label{grid-column:1/-1}}
`;document.head.appendChild(css);
})();
