/* Pantalla de acceso definitiva; no muestra herramientas de diagnóstico. */
(function(){'use strict';
const gate=document.getElementById('cf-google-test-gate');
if(!gate)return;
const style=document.createElement('style');style.textContent=`
body.cf-google-locked #cf-google-test-gate>.panel{display:none!important}
#cf-google-test-gate.cf-original-entered #cf-production-login{display:none!important}
#cf-production-login{box-sizing:border-box;max-width:440px;margin:5vh auto 0;padding:30px 22px;background:#182235;border:1px solid #3b4d68;border-radius:22px;color:#fff;font-family:system-ui,-apple-system,sans-serif;text-align:center}
#cf-production-login img{width:100px;height:100px;object-fit:contain;margin-bottom:10px}
#cf-production-login h1{font-size:25px;margin:4px 0 6px}
#cf-production-login p{font-size:14px;color:#c3d2e5;line-height:1.5}
#cf-production-login button{display:block;width:100%;min-height:52px;margin-top:14px;padding:13px 12px;background:#f7db2d;color:#171c27;border:0;border-radius:13px;font-weight:800;font-size:16px;white-space:normal}
#cf-production-login button.secondary{background:#dbe7fa}
#cf-production-login button[hidden]{display:none!important}
#cf-production-login button:disabled{opacity:.5}
#cf-production-login .cf-account{font-size:13px;color:#9fe7b5;overflow-wrap:anywhere}
#cf-production-login .cf-message{font-size:13px;white-space:pre-wrap;overflow-wrap:anywhere;text-align:left;margin-top:18px;color:#f6d78c}
`;document.head.appendChild(style);
const shell=document.createElement('section');shell.id='cf-production-login';
shell.innerHTML='<img src="chispas-logo.png" alt="Chispas Sound"><h1>Control Fiscal</h1><p>Accede con tu cuenta de Google para trabajar con tu libro personal.</p><div class="cf-account" id="cf-production-account"></div><button type="button" id="cf-production-signin">Iniciar sesión con Google</button><button type="button" id="cf-production-create" class="secondary" hidden>Crear mi libro personal</button><button type="button" id="cf-production-enter" class="secondary" hidden>Entrar en Control Fiscal</button><div id="cf-production-message" class="cf-message" role="status" aria-live="polite"></div>';
gate.prepend(shell);
const signin=shell.querySelector('#cf-production-signin'),create=shell.querySelector('#cf-production-create'),enter=shell.querySelector('#cf-production-enter'),message=shell.querySelector('#cf-production-message'),account=shell.querySelector('#cf-production-account');
let busy=false;
function setBusy(value){busy=value;[signin,create,enter].forEach(b=>b.disabled=value);}
async function run(fn){if(busy)return;setBusy(true);try{await fn();}catch(e){message.textContent='No se pudo completar la operación: '+String(e?.message||e); }finally{setBusy(false);}}
async function prepare(createBook){
 message.textContent=createBook?'Creando libro en tu Google Drive…':'Buscando tu libro personal…';
 const result=await window.ControlFiscalGoogleFindBook(createBook);
 if(!result?.found){message.textContent='No se encontró un libro creado por esta aplicación para esta cuenta. Puedes crear uno nuevo o contactar con soporte si ya tenías datos.';create.hidden=false;enter.hidden=true;return;}
 create.hidden=true;enter.hidden=false;
 message.textContent='Libro personal conectado correctamente. Puedes entrar en Control Fiscal.';
}
signin.addEventListener('click',()=>run(async()=>{
 message.textContent='Verificando tu cuenta de Google…';
 const user=await window.ControlFiscalGoogleLogin();
 account.textContent=user.email;signin.textContent='Cambiar cuenta de Google';
 await prepare(false);
}));
create.addEventListener('click',()=>run(()=>prepare(true)));
enter.addEventListener('click',()=>{
 const start=gate.querySelector('.cf-original-start');
 if(!window.ControlFiscalV78Session?.()||!window.ControlFiscalGoogleBookId?.()){message.textContent='Inicia sesión y conecta tu libro antes de continuar.';return;}
 if(start)start.click();else message.textContent='No se ha inicializado el menú principal.';
});
window.addEventListener('cf-google-session-ended',()=>{account.textContent='';message.textContent='';signin.textContent='Iniciar sesión con Google';create.hidden=true;enter.hidden=true;});
})();
