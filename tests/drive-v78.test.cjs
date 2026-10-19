const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const code=fs.readFileSync('www/drive-v78.js','utf8');const token='TEST_TOKEN_NOT_REAL_123456789';
function setup(handler){const window={CapacitorHttpNative:{request:handler}};vm.runInNewContext(code,{window,URLSearchParams,encodeURIComponent});return window.ControlFiscalDriveV78;}
function res(data,status=200){return {status,data};}
(async()=>{
 let calls=[];const api=setup(async opts=>{calls.push(opts);assert.equal(opts.headers.Authorization,'Bearer '+token);
  if(opts.url.includes('/drive/v3/files?')&&opts.method==='GET')return res({files:[]});
  if(opts.url.includes('/drive/v3/files?')&&opts.method==='POST')return res({id:'book1',name:'Control Fiscal - Datos fiscales'});
  if(opts.url.includes('/sheets/v4/spreadsheets/book1?'))return res({sheets:[]});
  if(opts.url.includes(':batchUpdate'))return res({replies:[]});
  throw Error('unexpected '+opts.url);
 });
 const b=await api.findOrCreateBook(token);assert.equal(b.created,true);assert.equal(b.tabsAdded,7);assert.equal(calls.length,4);assert.equal(calls[1].data.appProperties.controlFiscalVersion,'78');
 const existing=setup(async opts=>{if(opts.url.includes('/drive/v3/files?'))return res({files:[{id:'same',name:'Libro'}]});if(opts.url.includes('/sheets/v4/spreadsheets/same?'))return res({sheets:[{properties:{title:'Configuracion'}},...['Compras','Facturas','Inventario','Clientes','Agenda','Ingresos'].map(title=>({properties:{title}}))]});throw Error('unexpected write')});
 assert.equal((await existing.findOrCreateBook(token)).id,'same');
 const duplicates=setup(async()=>res({files:[{id:'one'},{id:'two'}]}));await assert.rejects(()=>duplicates.findOrCreateBook(token),/varios libros/);
 const partial=setup(async opts=>{if(opts.url.includes('/drive/v3/files?'))return res({files:[{id:'recover',name:'Libro'}]});if(opts.url.includes('/sheets/v4/spreadsheets/recover?'))return res({sheets:[]});if(opts.url.includes(':batchUpdate'))return res({error:{message:'denied'}},403);throw Error('unexpected')});
 await assert.rejects(()=>partial.findOrCreateBook(token),/Libro existente ID recover/);
 await assert.rejects(()=>api.findOrCreateBook(''),/token OAuth/);
 console.log('OK: 5 pruebas de Drive V78');
})().catch(e=>{console.error(e);process.exitCode=1});
