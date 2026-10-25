'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('www/cf-r18-features.js','utf8');
const html=fs.readFileSync('www/index.html','utf8');
const docs=fs.readFileSync('www/cf-documents.js','utf8');
const pdf=fs.readFileSync('www/cf-pdf-viewer.js','utf8');
const makeAccount=()=>({id:'BOOK_A',email:'a@example.invalid',token:'A_TEST'});
function setup({stock=4,otherCount=0,state='Disponible',eventDate='2026-11-08',start='17:00',end='22:00'}={}){
 const inventory=[{id:'M1',articulo:'Altavoz',cantidad:stock,estado:state,unidad:'unidades'}];
 const others=otherCount?[{id:'OTHER',fecha:eventDate,horaInicio:'18:00',horaFin:'20:00',materiales:[{id:'M1',cantidad:otherCount}]}]:[];
 const inputs={agendaEventDate:{value:eventDate},agendaEventStart:{value:start},agendaEventEnd:{value:end},agendaEventLocation:{value:'Plaza Mayor, Cuenca'}};
 const launched=[];
 const root={CFGoogleAccount:{active:makeAccount},CFR18InventorySnapshot:()=>inventory,
  CFR18AgendaSnapshot:()=>others,CFR18EditingEvent:()=>null,
  CFR18ReplaceInventory:()=>{},CFi18n:{t:x=>x},
  CFAppLauncher:{canOpenUrl:async()=>({value:true}),openUrl:async ({url})=>{launched.push(url);return {completed:true}}},
  callAction:async ({accion})=>accion==='listarInventario'?{items:inventory}:accion==='listarAgenda'?{eventos:others}:null
 };
 const document={getElementById:id=>inputs[id]||null,addEventListener:()=>{}};
 const context=vm.createContext({window:root,document,console,Date,Math,Number,Set,String,Array,Object,Promise,encodeURIComponent});
 vm.runInContext(source,context);
 return {root,inputs,inventory,others,launched};
}
test('R18: reserva rechazada si supera existencias tras eventos que coinciden en horario',async()=>{
 const {root}=setup({stock:3,otherCount:2});
 assert.equal(root.CFEventTools.available('M1',{id:'NEW',fecha:'2026-11-08',horaInicio:'19:00',horaFin:'21:00'}),1);
 assert.equal(root.CFEventTools.available('M1',{id:'NEW',fecha:'2026-11-08',horaInicio:'21:00',horaFin:'23:00'}),3);
 assert.equal(root.CFEventTools.available('M1',{id:'NEW',fecha:'2026-11-09',horaInicio:'19:00',horaFin:'21:00'}),3);
 assert.equal(root.CFEventTools.available('M1',{id:'NEW',fecha:'2026-11-08',horaInicio:'19:00',horaFin:'21:00'},[{id:'M1',cantidad:2,estado:'En reparación'}]),0);
});
test('R18: disponibilidad y selección nunca descuentan el stock real al abrir evento',()=>{
 const {root,inventory}=setup({stock:5});root.CFEventTools.onOpen({materiales:[{id:'M1',nombre:'Altavoz',cantidad:2}],adjuntos:[]});
 assert.equal(inventory[0].cantidad,5,'el formulario reserva, no debe registrar salida de almacén');
});
test('R18: Mapas iOS se abre con ruta nativa y no con Browser ni ventana web',async()=>{
 const {root,launched}=setup();await root.CFEventTools.openRoute('apple');await root.CFEventTools.openRoute('google');
 assert.match(launched[0],/^maps:\/\/\?daddr=Plaza%20Mayor%2C%20Cuenca&dirflg=d$/);
 assert.match(launched[1],/^comgooglemaps:\/\/\?daddr=Plaza%20Mayor%2C%20Cuenca&directionsmode=driving$/);
});
test('R18: documentos conservan Drive privado, dos columnas y miniaturas diferidas',()=>{
 assert.match(html,/#cfDocLibraryItems\{display:grid!important;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(docs,/IntersectionObserver/);
 assert.match(docs,/Authorization:'Bearer '\+s\.token/);
 assert.match(docs,/root\.CFDocBlobCache=/);
 assert.match(html,/CFDocBlobCache\?\.get\(owner,id\)/);
 assert.match(pdf,/Fast first paint/);
 assert.match(pdf,/cf-performance-low/);
});
test('R18: tutorial inicial permite elegir rápido o completo y reiniciarlo',()=>{
 assert.match(html,/id="cfTutorialChoiceModal"/);
 assert.match(html,/function chooseCFTutorial\(mode\)/);
 assert.match(html,/function cfTutorialDismiss\(/);
 assert.match(html,/ELEGIR TUTORIAL RÁPIDO O EXTENSO/);
 assert.ok((html.match(/\{title:'/g)||[]).length>35);
});
test('R18: las localizaciones incorporan tres idiomas y las estructuras iOS',()=>{
 const locales=fs.readFileSync('www/cf-r18-languages.js','utf8');
 for(const lang of ['ca','nl','pl']){
  assert.match(locales,new RegExp('"'+lang+'":'));
  assert.ok(fs.existsSync(`resources/ios-locales/${lang}.lproj/InfoPlist.strings`));
 }
 assert.match(html,/<option value="ca">Català<\/option>/);
 assert.match(html,/<option value="nl">Nederlands<\/option>/);
 assert.match(html,/<option value="pl">Polski<\/option>/);
});
test('R18: la carga de archivos queda limitada a formatos privados y el evento guarda referencias',()=>{
 assert.match(source,/mimeOk=new Set\(\['application\/pdf','image\/jpeg','image\/png'\]\)/);
 assert.match(source,/CFGoogleUploads\.upload\(/);
 assert.match(html,/Object\.assign\(obj,await window\.CFEventTools\.beforeSave\(\)\)/);
 assert.match(source,/adjuntos:attached\.map/);
 assert.match(source,/CFShare\.share/);
});
