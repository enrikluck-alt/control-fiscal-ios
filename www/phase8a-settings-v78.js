/* Fase 8A: Ajustes y limpieza visual. Sin cambios en autenticación ni CRUD. */
(function(){'use strict';
const gate=document.getElementById('cf-google-test-gate');
const panel=gate?.querySelector('.panel');
const nav=panel?.querySelector('.cf-p6-nav');
if(!gate||!panel||!nav)return;
const style=document.createElement('style');style.id='cf-phase8a-css';style.textContent=`
#cf-google-test-gate .cf-p8-settings[hidden]{display:none!important}
#cf-google-test-gate .cf-p8-settings{padding:16px 12px;margin:12px 0;border:1px solid #637a98;border-radius:14px;background:#17273c}
#cf-google-test-gate .cf-p8-settings h3{margin:0 0 8px;color:#fff}
#cf-google-test-gate .cf-p8-settings p{font-size:13px;color:#cbd7e8;line-height:1.5}
#cf-google-test-gate .cf-p8-settings .cf-p6-tools{margin:14px 0}
#cf-google-test-gate .cf-p8-settings .cf-p6-tools button{font-size:14px}
#cf-google-test-gate .cf-p8-settings .cf-p8-lock{width:100%;background:#f3d849!important;color:#161b21!important}
#cf-google-test-gate .cf-p8-settings .cf-p8-status{font-size:12px;color:#b6d1ee}
#cf-google-test-gate .cf-p6-head small{font-size:12px}
`;document.head.appendChild(style);
const head=panel.querySelector('.cf-p6-head small');if(head)head.textContent='Área personal · Datos en tu Google Drive';
const button=document.createElement('button');button.type='button';button.dataset.section='ajustes';button.textContent='Ajustes';nav.appendChild(button);
const settings=document.createElement('section');settings.className='cf-p8-settings';settings.hidden=true;
settings.innerHTML='<h3>Ajustes y privacidad</h3><p>Tu información fiscal se guarda en el libro de la cuenta Google conectada. El PIN y Face ID bloquean el acceso local a la aplicación.</p><button type="button" class="cf-p8-lock">Bloquear aplicación ahora</button><p class="cf-p8-status" role="status"></p><p>Las herramientas avanzadas de Drive permanecen disponibles a continuación para diagnóstico.</p>';
nav.after(settings);
const tools=panel.querySelector('.cf-p6-tools');if(tools){tools.open=false;settings.appendChild(tools);}
const status=settings.querySelector('.cf-p8-status');
settings.querySelector('.cf-p8-lock').addEventListener('click',()=>{
 if(typeof window.lockSecurity==='function'){window.lockSecurity();status.textContent='Aplicación bloqueada.';}
 else{status.textContent='El bloqueo manual no está disponible; cierra y vuelve a abrir la aplicación para activar PIN o Face ID.';}
});
const oldButtons=Array.from(nav.querySelectorAll('button:not([data-section="ajustes"])'));
const oldPanes=Array.from(panel.querySelectorAll('.cf-p6-section'));
function showSettings(){oldPanes.forEach(p=>p.hidden=true);settings.hidden=false;nav.querySelectorAll('button').forEach(b=>b.removeAttribute('aria-current'));button.setAttribute('aria-current','page');settings.scrollIntoView({block:'nearest'});}
button.addEventListener('click',showSettings);
// Original navigation still owns its own listeners; this listener only closes Ajustes.
oldButtons.forEach(b=>b.addEventListener('click',()=>{settings.hidden=true;button.removeAttribute('aria-current');}));
})();
