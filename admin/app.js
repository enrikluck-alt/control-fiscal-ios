/* Control Fiscal R20 · panel privado en Firebase Hosting.
   Seguridad real: firestore.rules autoriza únicamente al UID administrador;
   este Javascript público no otorga permisos por sí mismo. */
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,collection,query,orderBy,limit,getDocs,updateDoc,doc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const firebaseConfig={
 apiKey:'AIzaSyAsxoyGelj8nuzuVcc0bDfqXFUZbY6wGMw',
 authDomain:'control-fiscal-511118.firebaseapp.com',
 projectId:'control-fiscal-511118',
 appId:'1:429272495544:web:04878cb97369290a30cb4d'
};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const $=id=>document.getElementById(id), collectionName='control_fiscal_sugerencias';
let messages=[];
function status(text){$('status').textContent=text||'';}
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formatDate=t=>{try{return t?.toDate?.().toLocaleString('es-ES',{dateStyle:'medium',timeStyle:'short'})||'Sin fecha';}catch{return 'Sin fecha';}};
function render(){
 const filter=$('filter').value,term=$('search').value.trim().toLocaleLowerCase('es');
 $('total').textContent=messages.length;
 $('pending').textContent=messages.filter(x=>x.estado==='pendiente').length;
 $('answered').textContent=messages.filter(x=>x.estado==='respondida').length;
 const shown=messages.filter(x=>(filter==='all'||x.estado===filter)&&[x.nombre,x.tipo,x.mensaje,x.uid].join(' ').toLocaleLowerCase('es').includes(term));
 const holder=$('cards');holder.replaceChildren();
 if(!shown.length){holder.innerHTML='<div class="empty">No hay mensajes con estos filtros.</div>';return;}
 for(const item of shown){
  const article=document.createElement('article');article.className='card';
  // Never inject message content as HTML without escaping.
  const emailVisible=item.permiteRespuesta===true&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.correoRespuesta||'');
  article.innerHTML=`<div class="head"><div><span class="pill">${esc(item.tipo)}</span> <span class="pill ${item.estado==='pendiente'?'orange':item.estado==='respondida'?'green':''}">${esc(item.estado)}</span></div><small>${esc(formatDate(item.fecha))}</small></div>
   <p class="message">${esc(item.mensaje)}</p>
   <div class="info"><strong>Remitente:</strong> ${esc(item.nombre||'Usuario')}<br><strong>Usuario Firebase:</strong> ${esc(String(item.uid||'').slice(0,26))}<br><strong>Correo:</strong> ${emailVisible?esc(item.correoRespuesta):'No autorizado para respuestas por email'}<br><strong>Aplicación:</strong> ${esc(item.version||'Sin versión')} · ${esc(item.plataforma||'')}</div>`;
  const actions=document.createElement('div');actions.className='controls';
  if(emailVisible){
   const a=document.createElement('a');a.className='link email';a.textContent='✉️ Responder por correo';
   const subject='Respuesta de Control Fiscal · '+item.tipo;
   const body='Hola,\n\nGracias por enviarnos tu mensaje.\n\nSobre tu '+String(item.tipo||'consulta').toLowerCase()+':\n\n';
   a.href='mailto:'+encodeURIComponent(item.correoRespuesta)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
   actions.appendChild(a);
  }
  for(const [value,label] of [['leida','Marcar leída'],['respondida','Marcar respondida']]){
   if(item.estado===value)continue;
   const b=document.createElement('button');b.textContent=label;
   b.addEventListener('click',async()=>{
    b.disabled=true;status('Guardando cambio…');
    try{await updateDoc(doc(db,collectionName,item.id),{estado:value,revisadoEn:serverTimestamp()});item.estado=value;render();status('Estado actualizado.');}
    catch(e){status('No se pudo guardar: '+String(e.message||e));b.disabled=false;}
   });actions.appendChild(b);
  }
  article.appendChild(actions);holder.appendChild(article);
 }
}
async function load(){
 if(!auth.currentUser)return;
 status('Cargando sugerencias…');
 try{
  const snapshot=await getDocs(query(collection(db,collectionName),orderBy('fecha','desc'),limit(100)));
  messages=snapshot.docs.map(x=>({id:x.id,...x.data()}));render();status('Buzón actualizado (últimas 100 sugerencias).');
 }catch(e){messages=[];render();status('Acceso denegado o error de red. Verifica que el UID administrador esté en las reglas publicadas. Detalle: '+String(e.message||e));}
}
$('signin').addEventListener('click',async()=>{
 try{status('Abriendo Google…');await signInWithPopup(auth,new GoogleAuthProvider());}
 catch(e){status('No se pudo iniciar sesión: '+String(e.message||e));}
});
$('logout').addEventListener('click',()=>signOut(auth));
$('refresh').addEventListener('click',load);
$('filter').addEventListener('change',render);
$('search').addEventListener('input',render);
onAuthStateChanged(auth,user=>{
 $('login').classList.toggle('hidden',!!user);$('dashboard').classList.toggle('hidden',!user);
 $('logout').classList.toggle('hidden',!user);$('signed').classList.toggle('hidden',!user);
 $('signed').textContent=user?user.email:'';
 if(user)load();else{messages=[];status('');}
});
