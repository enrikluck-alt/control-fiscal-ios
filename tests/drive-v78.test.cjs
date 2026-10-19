const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync('www/drive-v78.js','utf8');
const token='TEST_TOKEN_NOT_REAL_123456789';
function setup(handler) {
  const window={};
  const ctx={window,URLSearchParams,encodeURIComponent,fetch:handler};
  vm.runInNewContext(code,ctx);
  return window.ControlFiscalDriveV78;
}
function response(data,status=200){return {ok:status>=200&&status<300,status,json:async()=>data};}
(async()=>{
  let count=0;
  const api=setup(async(url,opts)=>{
    count++;
    assert.equal(opts.headers.Authorization,'Bearer '+token);
    if(url.includes('/drive/v3/files?')) return response({files:[]});
    if(url.endsWith('/sheets/v4/spreadsheets')) return response({spreadsheetId:'book1'});
    if(url.includes('/drive/v3/files/book1')) return response({id:'book1'});
    throw Error('unexpected '+url);
  });
  const created=await api.findOrCreateBook(token);
  assert.equal(created.id,'book1');assert.equal(created.created,true);assert.equal(count,3);
  let writes=0;
  const existing=setup(async(url)=>{if(url.includes('/drive/v3/files?'))return response({files:[{id:'existing',name:'Saved'}]});writes++;throw Error('unexpected write')});
  assert.equal((await existing.findOrCreateBook(token)).id,'existing');assert.equal(writes,0);
  const duplicate=setup(async()=>response({files:[{id:'one'},{id:'two'}]}));
  await assert.rejects(()=>duplicate.findOrCreateBook(token),/varios libros/);
  const orphan=setup(async(url)=>{
    if(url.includes('/drive/v3/files?'))return response({files:[]});
    if(url.endsWith('/sheets/v4/spreadsheets'))return response({spreadsheetId:'orphan-id'});
    return response({error:{message:'denied'}},403);
  });
  await assert.rejects(()=>orphan.findOrCreateBook(token),/orphan-id/);
  await assert.rejects(()=>api.findOrCreateBook(''),/token OAuth/);
  console.log('OK: 5 comprobaciones de Drive V78');
})().catch(err=>{console.error(err);process.exit(1)});
