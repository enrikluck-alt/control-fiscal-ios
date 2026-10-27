'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=name=>fs.readFileSync(name,'utf8');
const html=src('www/index.html');
function stub(tag='div'){
 return {tagName:tag,hidden:true,className:'',children:[],attrs:{},dataset:{},classList:{contains:()=>true},
  replaceChildren(...items){this.children=[...items]},appendChild(item){this.children.push(item)},append(...items){this.children.push(...items)},
  setAttribute(k,v){this.attrs[k]=v},addEventListener(){},querySelector(){return null}};
}
function adminHarness(code){
 let account={id:'BOOK_A',email:'a@example.com',token:'ACCESS_GOOGLE_A'};
 let auth={uid:'ADMIN_UID',idToken:'FIREBASE_TOKEN_A'};
 let calls=0;const entry=stub(),cards=stub(),adminPage=stub();
 const el={'cfR21AdminEntry':entry,'cfR21AdminCards':cards,'cfR21AdminPage':adminPage};
 const events=new Map();
 const root={document:{getElementById:id=>el[id]||null,addEventListener(){},querySelectorAll:()=>[],createElement:stub},
  CFGoogleAccount:{active:()=>account},CFFirebaseAuth:{peek:()=>auth,ensureSignedIn:async()=>auth},
  addEventListener:(name,fn)=>events.set(name,fn),fetch:async()=>{calls++;return{ok:code===200,status:code,json:async()=>({})}}};
 root.window=root;
 vm.runInNewContext(src('www/cf-r21-features.js'),{window:root,console,AbortController,setTimeout,clearTimeout});
 return {root,entry,calls:()=>calls,change:(newAccount,newAuth)=>{account=newAccount;auth=newAuth},dispatch:name=>events.get(name)?.()};
}
test('R23: el usuario normal no ve comprobación ni administración; Firebase 403 queda oculto',async()=>{
 assert.doesNotMatch(html,/COMPROBAR MI ACCESO DE ADMINISTRADOR/);
 assert.doesNotMatch(html,/cfR22AdminHint/);
 assert.match(html,/<div id="cfR21AdminEntry" hidden>/);
 const h=adminHarness(403);
 assert.equal(await h.root.CFR21Admin.check(),false);
 assert.equal(h.entry.hidden,true);
 assert.ok(h.calls()>0,'Se consulta permiso real de Firestore');
});
test('R23: usuario autorizado obtiene enlace automáticamente y se revoca al cambiar cuenta',async()=>{
 const h=adminHarness(200);assert.equal(await h.root.CFR21Admin.check(),true);
 assert.equal(h.entry.hidden,false);
 h.change({id:'BOOK_B',email:'b@example.com',token:'GOOGLE_B'},null);
 h.dispatch('cf:account-changed');
 assert.equal(h.entry.hidden,true,'La opción desaparece antes de comprobar al nuevo usuario');
 assert.equal(await h.root.CFR21Admin.check(),false);
});
test('R23: sin token Firebase listo no se intenta autenticar ni se muestra spinner',async()=>{
 const h=adminHarness(200);h.change({id:'BOOK_A',email:'a@example.com',token:'T'},null);
 h.root.CFR21Admin.reset();
 const previous=h.calls();assert.equal(await h.root.CFR21Admin.check(),false);
 assert.equal(h.calls(),previous);assert.equal(h.entry.hidden,true);
});
function calendarHarness(){
 const strip=stub(); const cell=stub();cell.dataset.date='2026-10-27';cell.querySelector=selector=>selector==='.cfR23CalendarMarkers'?strip:null;
 const grid={querySelectorAll:()=>[cell]}; const checked=['compras','facturas','ingresos'].map(value=>({value}));
 const elements={'agendaGrid':grid};
 const document={getElementById:id=>elements[id]||null,
  querySelectorAll:query=>query==='#cfR22AgendaLegend input:checked'?checked:[],createElement:stub,addEventListener(){}};
 const incomes=Array.from({length:10},(_,i)=>({id:'I'+i,fecha:'2026-10-27',persona:'Cliente',servicio:'Servicio '+i,importePrevisto:500,estadoCobro:'parcial'}));
 const root={document,navigator:{language:'es-ES',languages:['es-ES']},CFGoogleAccount:{active:()=>({id:'BOOK_A',email:'a@example.com',token:'T'})},
  CFR20Data:{records:()=>[],incomes:()=>incomes},CFR21Materials:{items:()=>[],load:async()=>{}},loadPendingIncome:async()=>{},
  CFR23CalendarEvents:()=>[{id:'E1',fecha:'2026-10-27',evento:'Evento privado'}]};
 root.window=root;
 vm.runInNewContext(src('www/cf-r22-features.js'),{window:root,Date,Number,console,Intl});
 return {root,strip};
}
test('R23: once movimientos se condensan en dos globos y contador +9, sin añadir alturas',async()=>{
 const {root,strip}=calendarHarness();await root.CFR22Agenda.refresh();
 assert.equal(strip.children.length,3);
 assert.equal(strip.children[2].className,'cfR23More');
 assert.equal(strip.children[2].textContent,'+9');
 assert.match(strip.children[0].className,/isEvent/);
});
test('R23: calendario, inputs y fecha adaptable mantienen ancho y alto constante',()=>{
 assert.match(html,/grid-auto-rows:82px/);
 assert.match(html,/\.calDay\{height:82px;min-height:0!important;min-width:0;max-width:100%;overflow:hidden/);
 assert.match(html,/\.emailGrid:has\(input\[type="date"\]\)/);
 assert.match(html,/\.two:has\(input\[type="date"\]\)/);
 assert.match(html,/\.agendaFormGrid:has\(input\[type="date"\]\)/);
 assert.match(html,/webkit-datetime-edit/);
});
