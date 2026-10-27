'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('www/index.html','utf8');
const r22=fs.readFileSync('www/cf-r22-features.js','utf8');
const r21=fs.readFileSync('www/cf-r21-features.js','utf8');
function node(tag='div'){
 const obj={tagName:tag,textContent:'',hidden:true,style:{},children:[],dataset:{},className:'',attrs:{},isConnected:true,
  classList:{contains:()=>false,add(){},remove(){}},appendChild(x){this.children.push(x);return x;},
  append(...xs){this.children.push(...xs)},replaceChildren(...xs){this.children=[...xs]},
  setAttribute(k,v){this.attrs[k]=v},addEventListener(type,fn){(this.listeners||={})[type]=fn},
  querySelector(){return null},getBoundingClientRect(){return {left:40,top:100,right:160,bottom:145,width:120,height:45}}};
 return obj;
}
function fixture(){
 const cells={agendaGrid:node(),cfR22OperationModal:node(),cfR22OperationTitle:node(),cfR22OperationBody:node(),
  cfR24DayAdd:node(),cfR24ReturnToDay:node(),cfR22OperationView:node()};
 cells.cfR22OperationModal.classList.remove=()=>{};
 cells.agendaGrid.querySelectorAll=()=>[];
 const root={document:{getElementById:id=>cells[id]||null,querySelectorAll:s=>s==='#cfR22AgendaLegend input:checked'?['compras','facturas','ingresos'].map(value=>({value})):[],createElement:node,createTextNode:text=>({textContent:text}),addEventListener(){}},
   navigator:{language:'es-ES',languages:['es-ES']},CFGoogleAccount:{active:()=>({email:'a@ejemplo.es',id:'BOOK',token:'T'})},
   CFR20Data:{records:()=>[{fecha:'2026-10-27',tipo:'Compra',tercero:'Tienda',concepto:'Suministros',total:50,id:'C1'},
   {fecha:'2026-10-27',tipo:'Facturado',tercero:'Cliente',concepto:'Trabajo',total:400,estadoCobro:'parcial',id:'F1'}],
   incomes:()=>[{id:'I1',fecha:'2026-10-27',persona:'Cliente',servicio:'Servicio',importePrevisto:300,estadoCobro:'pendiente'}]},
   CFR21Materials:{items:()=>[],load:async()=>{}},loadPendingIncome:async()=>{},
   CFR23CalendarEvents:()=>[{id:'E2',evento:'Segundo',fecha:'2026-10-27',horaInicio:'19:00'},
      {id:'E1',evento:'Primero',fecha:'2026-10-27',horaInicio:'10:00'}]};
 let opened=null;root.openAgendaEventModal=(id,date)=>opened={id,date};root.window=root;
 vm.runInNewContext(r22,{window:root,Intl,Number,Date,console});
 return {root,cells,opened:()=>opened};
}
test('R24: tocar día abre detalle, primero TODOS los eventos ordenados y después globos de compras/facturas/ingresos',async()=>{
 const {root,cells}=fixture();await root.CFR22Agenda.refresh();root.CFR22Agenda.openDay('2026-10-27');
 const contents=cells.cfR22OperationBody.children;
 const titles=contents.map(c=>c.textContent||'');
 assert.equal(titles[0],'EVENTOS · 2');
 assert.equal(contents[1].children[0].children[1].children[0].textContent,'Primero');
 assert.equal(contents[2].children[0].children[1].children[0].textContent,'Segundo');
 assert.equal(titles[3],'COMPRAS, FACTURAS E INGRESOS · 3');
 assert.equal(contents.length,7);
 assert.equal(contents[4].children[0].children[0].className,'cfR24DayDot isPurchase');
 assert.equal(contents[5].children[0].children[0].className,'cfR24DayDot isUnpaid');
 assert.equal(contents[6].children[0].children[0].className,'cfR24DayDot isUnpaid');
 assert.equal(cells.cfR24DayAdd.hidden,false);
 assert.equal(cells.cfR22OperationView.hidden,true);
});
test('R24: el botón añadir conserva el día seleccionado para el nuevo evento',async()=>{
 const {root,opened}=fixture();await root.CFR22Agenda.refresh();root.CFR22Agenda.openDay('2026-10-27');root.CFR22Agenda.createEventForDay();
 assert.equal(opened().date,'2026-10-27');assert.equal(opened().id,null);
});
test('R24: importe recibido parcial está siempre visible y no depende de un selector oculto',()=>{
 assert.match(html,/id="pendingPartWrap"(?! hidden)/);
 assert.match(html,/id="pendingPaidPart"[^>]*oninput="recalcPendingIncome\('amount'\)"/);
 assert.match(html,/const state=collected<=0\?'pendiente':charged>0&&collected>=charged\?'pagada':'parcial'/);
 assert.match(html,/estadoCobro:calc\.state/);
});
test('R24: tutorial tiene elemento real de foco y cuatro máscaras que rodean exactamente al objetivo',()=>{
 assert.match(html,/id="cfTourSpotlight"/);
 assert.match(html,/\.cfTourMask\{position:fixed/);
 assert.match(r21,/for\(let i=0;i<4;i\+\+\)/);
 assert.match(r21,/\[right,top,Math\.max\(0,width-right\),bottom-top\]/);
 assert.match(html,/step\._activeElement=groups\[index\]/);
 assert.match(html,/cfSettingsShow\(index\)/);
});
test('R24: fecha siempre ocupa su propia anchura y textos de ejemplo independientes de profesiones',()=>{
 for(const id of ['pendingDate','cfR22RecordDate','cfR21MaterialDate','agendaEventDate','emailDesde','emailHasta'])
  assert.ok(html.includes(`id="${id}"`),id);
 assert.match(html,/#formBody input\[type="date"\]/);
 assert.match(html,/#cfR21MaterialPage input\[type="date"\]/);
 for(const named of ['Ej. Juan Pérez','Ej. Reparación de iPhone','Ej. Fiesta de verano','Ej. MadridHifi','Ej. Event 28A, cable DMX'])
  assert.ok(!html.includes(named),'Ejemplo demasiado específico: '+named);
});

test('R24: spotlight coloca máscaras reales de 4 lados y mueve la ventana explicativa',()=>{
 const start=r21.indexOf('const tour=(function(){let observed=null,masks=[];');
 const end=r21.indexOf('root.CFR21Tour=tour;',start)+'root.CFR21Tour=tour;'.length;
 assert.ok(start>=0);
 const masks=[];const overlay=node();overlay.classList.contains=()=>false;
 overlay.insertBefore=mask=>{masks.push(mask);return mask};
 const card=node();card.scrollHeight=220;card.getBoundingClientRect=()=>({top:580,bottom:800});
 overlay.querySelector=selector=>selector==='.cfTutorialCard'?card:null;
 const spotlight=node();const el={'cfTutorialOverlay':overlay,'cfTourSpotlight':spotlight};
 const root={innerWidth:390,innerHeight:844,addEventListener(){},document:{getElementById:id=>el[id],createElement:node}};
 const $=id=>el[id],text=v=>String(v||'').trim();
 vm.runInNewContext(r21.slice(start,end),{root,$,text});
 const target=node();target.getBoundingClientRect=()=>({left:20,top:200,right:370,bottom:270,width:350,height:70});
 root.CFR21Tour.spotlight(target);
 assert.equal(masks.length,4);
 assert.equal(spotlight.style.display,'block');
 assert.equal(masks[0].style.height,'194px');
 assert.equal(masks[1].style.top,'276px');
 assert.equal(masks[2].style.width,'14px');
 assert.equal(masks[3].style.width,'14px');
 assert.equal(card.style.top,'288px');
});
