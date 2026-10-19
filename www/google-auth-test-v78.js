/* Recuperación V78 sin crear archivos nuevos. */
(function(){'use strict';
const clientId='429272495544-72rmbs21hjds0fqb2hjlskbojr6gmi4g.apps.googleusercontent.com';
const scopes=['openid','email','profile','https://www.googleapis.com/auth/drive.file'];
const gate=document.createElement('div');gate.id='cf-google-test-gate';
gate.innerHTML='<div class="panel"><h2>Control Fiscal V78</h2><p>Lectura y escritura de prueba (no crea otro libro)</p><label for="cf-existing-id">ID o enlace de la hoja existente</label><input id="cf-existing-id" type="text" autocomplete="off" spellcheck="false" placeholder="Pega aquí la URL de Google Sheets" style="display:block;width:100%;box-sizing:border-box;margin:12px 0;padding:12px;color:#111;background:#fff;border-radius:8px"><button id="cf-auto-find">Buscar mi libro automáticamente</button> <button id="cf-auto-create">Crear solo si no existe</button><div style="margin-top:12px"><button id="cf-inspect">Comprobar libro</button> <button id="cf-repair">Configurar 7 pestañas</button></div><div style="margin-top:14px"><button id="cf-write-test">Guardar y leer prueba</button> <button id="cf-read-test">Verificar lectura</button></div><p class="small" id="cf-google-result">Primero pulsa Comprobar libro. Solo después configura las pestañas.</p></div>';
document.body.appendChild(gate);
const input=document.getElementById('cf-existing-id');const msg=document.getElementById('cf-google-result');
const buttons=['cf-inspect','cf-repair','cf-write-test','cf-read-test','cf-auto-find','cf-auto-create'].map(id=>document.getElementById(id));
const show=s=>{msg.textContent=s;};
let token=null;let verifiedId=null;
async function auth(){if(token)return token;
 if(!window.Capacitor||window.Capacitor.getPlatform()!=='ios')throw Error('Requiere iOS');
 const social=window.ControlFiscalSocialLogin;if(!social||!window.ControlFiscalDriveV78)throw Error('Falta módulo SocialLogin/Drive');
 await social.initialize({google:{iOSClientId:clientId,mode:'online'}});
 const response=await social.login({provider:'google',options:{scopes}});
 const raw=response?.result?.accessToken;const t=typeof raw==='string'?raw:raw?.token;
 if(typeof t!=='string'||t.length<20)throw Error('No se recibió token OAuth');token=t;return token;
}
async function action(repair){buttons.forEach(b=>b.disabled=true);show('Conectando con Google…');
 try{const id=window.ControlFiscalDriveV78.parseId(input.value);const t=await auth();
 if(repair&&verifiedId!==id)throw Error('Primero pulsa Comprobar libro con este mismo ID');
 if(repair){const r=await window.ControlFiscalDriveV78.repair(t,id);show('LIBRO CONFIGURADO\n'+r.name+'\nID: '+r.id+'\nOperaciones: '+r.changed+'\nPestañas: '+r.tabs.join(', ')+'\nNo se han escrito datos fiscales.');}
 else{const r=await window.ControlFiscalDriveV78.inspect(t,id);verifiedId=id;show('LIBRO ENCONTRADO\n'+r.drive.name+'\nID: '+r.id+'\nPestañas actuales: '+(r.sheet.sheets||[]).map(s=>s.properties?.title).join(', ')+'\nPuedes pulsar Configurar 7 pestañas.');}
 }catch(e){show('Error: '+String(e?.message||e).slice(0,650));}finally{buttons.forEach(b=>b.disabled=false);}
}
async function testAction(write){buttons.forEach(b=>b.disabled=true);show('Comprobando Google Sheets…');
 try{const id=window.ControlFiscalDriveV78.parseId(input.value);const t=await auth();
  const r=write?await window.ControlFiscalDriveV78.writeAndVerifyTest(t,id):await window.ControlFiscalDriveV78.verifyTest(t,id);
  if(!r.found){show('SIN REGISTRO DE PRUEBA\nEl libro existe y la lectura funciona. Pulsa Guardar y leer prueba.');return;}
  show((r.created?'PRUEBA GUARDADA Y LEÍDA': 'LECTURA CORRECTA')+'\nID del libro: '+r.id+'\nPestaña: Configuracion\nFila: '+r.row+'\nMarcador: '+r.marker+'\nValor: '+r.value+'\nCoincidencia: correcta\nNo se han escrito datos fiscales reales.');
 }catch(e){show('Error: '+String(e?.message||e).slice(0,650));}finally{buttons.forEach(b=>b.disabled=false);}
}
async function automatic(allowCreate){buttons.forEach(b=>b.disabled=true);show('Buscando tu libro en Google Drive…');
 try{
  const t=await auth();const r=await window.ControlFiscalDriveV78.automaticBook(t,{allowCreate});
  if(!r.found){show('No se encontró ningún libro accesible para esta aplicación. Si ya tienes uno, pega su enlace y pulsa Comprobar libro. Si es tu primera instalación, pulsa Crear solo si no existe.');return;}
  input.value=r.id;verifiedId=r.id;
  show((r.created?'LIBRO CREADO Y CONFIGURADO':'LIBRO RECUPERADO Y CONFIGURADO')+'\nID: '+r.id+'\nPestañas: '+r.tabs.join(', ')+'\nCambios: '+r.changed+'\nPuedes usar Verificar lectura.');
 }catch(e){show('Error: '+String(e?.message||e).slice(0,850));}
 finally{buttons.forEach(b=>b.disabled=false);}
}
document.getElementById('cf-auto-find').addEventListener('click',()=>automatic(false));
document.getElementById('cf-auto-create').addEventListener('click',()=>automatic(true));
buttons[0].addEventListener('click',()=>action(false));buttons[1].addEventListener('click',()=>action(true));
buttons[2].addEventListener('click',()=>testAction(true));buttons[3].addEventListener('click',()=>testAction(false));
})();
