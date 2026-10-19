/* V78 fase 1: prueba aislada de Clientes e Inventario, sin activar backend V77. */
(function(){'use strict';
const KEY='CFV78_DEMO_PHASE1';
const modules=[{tab:'Clientes',record:{id:'CFV78-DEMO-CLIENTE-1',nombre:'Cliente de prueba V78',cif:'TEST-NO-REAL'}},{tab:'Inventario',record:{id:'CFV78-DEMO-ITEM-1',articulo:'Artículo de prueba V78',cantidad:1}}];
const gate=document.getElementById('cf-google-test-gate');if(!gate)return;
const pane=document.createElement('div');pane.style.cssText='margin-top:14px;padding:12px;border:1px solid #777;border-radius:9px';
pane.innerHTML='<strong>Fase 1 · Clientes e Inventario (datos de prueba)</strong><p>Utiliza la cuenta y el libro ya verificados. No activa todavía las pantallas fiscales de V77.</p><button id="cf-phase1-write">Guardar registros de prueba</button> <button id="cf-phase1-read">Leer registros de prueba</button><pre id="cf-phase1-result" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre>';
gate.querySelector('.panel')?.appendChild(pane);
const output=document.getElementById('cf-phase1-result');const btns=['cf-phase1-write','cf-phase1-read'].map(x=>document.getElementById(x));
function setBusy(v){btns.forEach(b=>b.disabled=v)}
function show(s){output.textContent=s}
async function call(t,path,method='GET',body){
 const http=window.CapacitorHttpNative;if(!http?.request)throw Error('HTTP nativo no disponible');
 const url='https://sheets.googleapis.com/v4/spreadsheets/'+path;
 const headers={Authorization:'Bearer '+t,Accept:'application/json'};
 if(body!==undefined)headers['Content-Type']='application/json';
 const r=await http.request({url,method,headers,...(body===undefined?{}:{data:body})});
 let d=r.data;if(typeof d==='string'){try{d=JSON.parse(d)}catch{d={}}}
 if(r.status<200||r.status>=300)throw Error('Sheets HTTP '+r.status+': '+String(d?.error?.message||'sin detalle').slice(0,170));
 return d||{};
}
async function session(){
 const get=window.ControlFiscalV78Session;
 if(typeof get!=='function')throw Error('No se ha verificado la sesión Google. Pulsa Iniciar sesión / elegir cuenta.');
 const s=get();if(!s?.token||!s?.email)throw Error('Inicia sesión con Google primero');
 const id=document.getElementById('cf-existing-id')?.value||'';
 const book=window.ControlFiscalDriveV78;
 const parsed=book.parseId(id);
 await book.inspect(s.token,parsed); // Acceso al documento con el token de la cuenta activa.
 return {token:s.token,id:parsed,email:s.email};
}
async function rows(t,id,tab){
 const r=await call(t,encodeURIComponent(id)+'/values/'+encodeURIComponent("'"+tab+"'!A:C"));
 return r.values||[];
}
async function verify(t,id,mod){
 const list=await rows(t,id,mod.tab);const matches=list.filter(r=>r[0]===KEY&&r[1]===mod.record.id);
 if(matches.length>1)throw Error('Hay duplicados en '+mod.tab+'; no se escribirá nada más');
 if(matches.length===1){let value;try{value=JSON.parse(matches[0][2])}catch{throw Error('JSON inválido en '+mod.tab)}
 if(value.id!==mod.record.id)throw Error('Registro inconsistente en '+mod.tab);
 return {found:true,value};}
 return {found:false};
}
async function run(write){setBusy(true);show('Comprobando sesión y libro…');
 try{const {token,id,email}=await session();const lines=['Cuenta: '+email,'Libro: '+id];
 for(const mod of modules){let v=await verify(token,id,mod);
  if(write&&!v.found){
   const active=window.ControlFiscalV78Session?.();
   if(!active||active.token!==token||active.email!==email)throw Error('La cuenta Google cambió durante la prueba; escritura cancelada');
   await call(token,encodeURIComponent(id)+'/values/'+encodeURIComponent("'"+mod.tab+"'!A:C")+':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS','POST',{values:[[KEY,mod.record.id,JSON.stringify(mod.record)]]});
   v=await verify(token,id,mod);if(!v.found)throw Error('No se pudo verificar '+mod.tab+'; no repitas la escritura automáticamente');
  }
  lines.push(mod.tab+': '+(v.found?'LECTURA CORRECTA · '+v.value.id:'sin registro de prueba'));
 }
 show(lines.join('\n'));
 }catch(e){show('Error: '+String(e?.message||e))}finally{setBusy(false)}
}
btns[0].addEventListener('click',()=>run(true));btns[1].addEventListener('click',()=>run(false));
})();
