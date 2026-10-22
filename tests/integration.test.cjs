const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {test}=require('node:test');
const root={};root.window=root;
let active={token:'TEST_TOKEN_1234567890123456789',email:'a@example.com',id:'SPREADSHEET_A_LONG_ID_TEST_123456789'};
const store={};
function tab(s,name){return (store[s.id]??={})[name]??=[];}
function parseRange(url){const path=decodeURIComponent(url.split('/values/')[1].split('?')[0]);const m=path.match(/^'([^']+)'!(.+)$/);assert.ok(m,'wrong range '+path);return {name:m[1],range:m[2].replace(/:append$|:clear$/,'')};}
root.CFGoogleAccount={active:()=>active,http:async(url,method='GET',data)=>{
 assert.ok(url.includes(active.id));
 const r=parseRange(url), rows=tab(active,r.name);
 if(method==='GET')return {values:rows};
 if(url.includes(':append')){rows.push(...data.values);return {updates:{updatedRows:1}};}
 const match=r.range.match(/^A(\d+):[A-Z]+\d+$/);assert.ok(match,'wrong update range '+r.range);
 const index=Number(match[1])-1;
 if(url.includes(':clear')){rows[index]=[];return {};}
 if(method==='PUT'){rows[index]=[...data.values[0],...rows[index]?.slice(data.values[0].length)||[]];return {updatedRows:1};}
 throw Error('method '+method);
}};
const c=vm.createContext({window:root,console,URLSearchParams});vm.runInContext(fs.readFileSync('www/cf-google-data.js','utf8'),c);
const api=root.CFGoogleData;
test('no active session cannot read another account',async()=>{const before=active;active=null;await assert.rejects(()=>api.action({accion:'listarClientes'}),/Inicia sesión/);active=before;});
test('V76 screens present and V78 test UI absent',()=>{
 const html=fs.readFileSync('www/index.html','utf8');
 for(const id of ['home','agendaPage','inventoryPage','settingsPage','formPage','recordsPage','accountGate'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.doesNotMatch(html,/cf-google-test-gate|phase6-navigation-v78|SCRIPT_URL|script\.google\.com/);
 assert.match(html,/google-login\.bundle\.js/);
});
test('create / update / list / delete Clients, Inventory, Agenda, Income',async()=>{
 const itemTests=[
 ['guardarCliente',{cliente:JSON.stringify({nombre:'Cliente A',cif:'X123'})},'listarClientes','clientes','eliminarCliente',{nombre:'Cliente A',cif:'X123'}],
 ['guardarInventario',{item:JSON.stringify({id:'INV-1',articulo:'Subgrave',cantidad:2})},'listarInventario','items','eliminarInventario',{id:'INV-1'}],
 ['guardarEvento',{evento:JSON.stringify({id:'EV-1',fecha:'2026-10-21',evento:'Evento'})},'listarAgenda','eventos','eliminarEvento',{id:'EV-1'}],
 ['guardarIngresoPendiente',{ingreso:JSON.stringify({id:'IP-1',persona:'Test',servicio:'Audio',cobrado:350})},'listarIngresosPendientes','ingresos','eliminarIngresoPendiente',{id:'IP-1'}]
 ];
 for(const [save,body,list,key,remove,param] of itemTests){
  await api.action({accion:save,...body});
  const out=await api.action({accion:list});assert.equal(out[key].length,1,list);
  await api.action({accion:remove,...param});const after=await api.action({accion:list});assert.equal(after[key].length,0,remove);
 }
});
test('purchases invoices editing and record listing',async()=>{
 await api.action({accion:'guardarRegistro',tipo:'Compra',tercero:'Tienda',concepto:'DMX',base:82.64,ivaPorcentaje:21,iva:17.36,total:100});
 let rec=await api.action({accion:'syncRecords'});assert.equal(rec.compras.length,1);assert.equal(rec.compras[0].total,100);
 const fila=rec.compras[0].fila;
 await api.action({accion:'editar',tipo:'Compra',fila,tercero:'Tienda 2',concepto:'DMX',total:121,ivaPorcentaje:21});
 rec=await api.action({accion:'syncRecords'});assert.equal(rec.compras[0].total,121);assert.equal(rec.compras[0].tercero,'Tienda 2');
 await api.action({accion:'eliminar',tipo:'Compra',fila});rec=await api.action({accion:'syncRecords'});assert.equal(rec.compras.length,0);
 const f=await api.action({accion:'crearFactura',requestId:'SINGLE-ID',tercero:'Cliente',base:100,ivaPorcentaje:21,iva:21,total:121,cliente:'{"cif":"Z1"}',lineas:'[]'});assert.match(f.numeroFactura,/^BOR-\d{4}-/);assert.equal(f.borrador,true);assert.equal(f.facturaEmitida,false);
 const again=await api.action({accion:'crearFactura',requestId:'SINGLE-ID',tercero:'Cliente',base:100,total:121});assert.equal(again.repetida,true);
 rec=await api.action({accion:'syncRecords'});assert.equal(rec.facturacion.length,1);
});
test('configuration, suppliers, account isolation',async()=>{
 await api.action({accion:'guardarConfiguracion',configuracion:JSON.stringify({name:'Chispas',taxId:'CIF'})});
 let conf=await api.action({accion:'obtenerConfiguracion'});assert.equal(conf.configuracion.name,'Chispas');assert.equal(conf.configuracion.taxId,'CIF');
 await api.action({accion:'guardarTercero',categoria:'Proveedor',nombre:'Music Store'});
 let l=await api.action({accion:'listarTerceros'});assert.equal(Array.from(l.proveedores).join(','),'Music Store');
 const accountA=active;active={...accountA,email:'b@example.com',id:'SPREADSHEET_B_LONG_ID_TEST_123456789'};
 const result=await api.action({accion:'listarClientes'});assert.equal(result.clientes.length,0);
 conf=await api.action({accion:'obtenerConfiguracion'});assert.equal(conf.configuracion.name,undefined);
 active=accountA;
});

test('editing legacy V76 client preserves original 9-column row and uses overlay',async()=>{
 const original=['Empresa Antigua','B12345678','Calle 1','46001','Valencia','Valencia','600123123','test@example.es','TRUE'];
 const rows=tab(active,'Clientes');rows.splice(0,rows.length,['Nombre / Empresa','CIF','Dirección','CP','Ciudad','Provincia','Teléfono','Email','Activo'],[...original]);
 let list=await api.action({accion:'listarClientes'});
 assert.equal(list.clientes.find(x=>x.cif==='B12345678').nombre,'Empresa Antigua');
 await api.action({accion:'guardarCliente',cliente:JSON.stringify({nombre:'Empresa Actualizada',cif:'B12345678',direccion:'Calle Nueva',cp:'28001'})});
 assert.deepEqual(rows[1],original,'no destructive changes to original V76 row');
 list=await api.action({accion:'listarClientes'});
 assert.equal(list.clientes.find(x=>x.cif==='B12345678').nombre,'Empresa Actualizada');
 await api.action({accion:'eliminarCliente',cif:'B12345678'});
 assert.deepEqual(rows[1],original,'deleting in application must NOT clear original sheet');
 list=await api.action({accion:'listarClientes'});
 assert.equal(list.clientes.find(x=>x.cif==='B12345678'),undefined);
});

test('new purchase stored only in ledger, no JSON rows inserted in legacy Compras',async()=>{
 const tabRows=tab(active,'Compras');tabRows.splice(0,tabRows.length,['Fecha','Tercero','Concepto','Base','IVA porcentaje','IVA','Total','Factura']);
 const before=JSON.stringify(tabRows);
 await api.action({accion:'guardarRegistro',tipo:'Compra',tercero:'Tienda Seguridad',concepto:'Altavoz',base:100,iva:21,ivaPorcentaje:21,total:121});
 assert.equal(JSON.stringify(tabRows),before);
 const records=await api.action({accion:'syncRecords'});
 assert.ok(records.compras.some(x=>x.tercero==='Tienda Seguridad'));
});

test('parallel draft creation returns two unique IDs, no fiscal invoice claimed',async()=>{
 const [a,b]=await Promise.all([
  api.action({accion:'crearFactura',requestId:'P-A',tercero:'Cliente A',base:30,total:36.3}),
  api.action({accion:'crearFactura',requestId:'P-B',tercero:'Cliente B',base:30,total:36.3})
 ]);
 assert.notEqual(a.numeroFactura,b.numeroFactura);
 assert.match(a.numeroFactura,/^BOR-/);assert.match(b.numeroFactura,/^BOR-/);
 assert.equal(a.facturaEmitida,false);assert.equal(b.facturaEmitida,false);
 const x=await api.action({accion:'syncRecords'});
 assert.ok(x.facturacion.some(r=>r.numeroFactura===a.numeroFactura&&r.estado==='BORRADOR'));
});

test('same draft request in same session is idempotent under parallel calls',async()=>{
 const args={accion:'crearFactura',requestId:'SAME-CONCURRENT',tercero:'Cliente',base:100,total:121};
 const [x,y]=await Promise.all([api.action(args),api.action(args)]);
 assert.equal(x.numeroFactura,y.numeroFactura);
 const list=await api.action({accion:'syncRecords'});
 assert.equal(list.facturacion.filter(r=>r.requestId==='SAME-CONCURRENT').length,1);
});

test('legacy Facturación and Agenda remain byte-for-byte unchanged after overlay deletions',async()=>{
 const fRows=tab(active,'Facturación');fRows.splice(0,fRows.length,['Fecha','Cliente','Concepto','Base','IVA%','IVA','Total','URL','Nº'],['2026-01-05','Acme','Show',100,21,21,121,'','F2026-005']);
 const aRows=tab(active,'Agenda');aRows.splice(0,aRows.length,['ID','Fecha','Inicio','Fin','Evento'],['EV-OLD','2026-05-01','21:00','03:00','Evento V76']);
 const savedF=JSON.stringify(fRows),savedA=JSON.stringify(aRows);
 const original=await api.action({accion:'syncRecords'});
 assert.ok(original.facturacion.find(x=>x.numeroFactura==='F2026-005'));
 const fact=original.facturacion.find(x=>x.numeroFactura==='F2026-005');
 await api.action({accion:'editar',tipo:'Facturación',tab:'Facturación',fila:fact.fila,tercero:'Acme revisado',concepto:'Show',base:110,ivaPorcentaje:21});
 await api.action({accion:'eliminarEvento',id:'EV-OLD'});
 assert.equal(JSON.stringify(fRows),savedF);
 assert.equal(JSON.stringify(aRows),savedA);
 const updated=await api.action({accion:'syncRecords'});
 assert.equal(updated.facturacion.find(x=>x.numeroFactura==='F2026-005').tercero,'Acme revisado');
 assert.equal((await api.action({accion:'listarAgenda'})).eventos.find(x=>x.id==='EV-OLD'),undefined);
});

test('Google file upload is real binary MIME, 5MB limit, source token is retained',async()=>{
 const source=fs.readFileSync('www/cf-google-upload.js','utf8');
 const received=[];
 const account=active;
 const uploadRoot={
  CFGoogleAccount:{active:()=>account},
  atob:s=>Buffer.from(s,'base64').toString('binary'),
  fetch:async(url,request)=>{
   assert.ok(url.includes('uploadType=multipart'));
   assert.equal(request.headers.Authorization,'Bearer '+account.token);
   const bytes=Buffer.from(await request.body.arrayBuffer());
   received.push(bytes);
   assert.ok(bytes.includes(Buffer.from([0,1,2,3,255,128])),'actual binary bytes must be in payload');
   assert.ok(bytes.includes(Buffer.from('Content-Type: application/pdf')));
   return {ok:true,status:200,json:async()=>({id:'FILE_IDENTIFIER_1234',size:6})};
  }
 };
 uploadRoot.window=uploadRoot;
 const ctx=vm.createContext({window:uploadRoot,console,Blob,Uint8Array,Buffer});
 vm.runInContext(source,ctx);
 const content=Buffer.from([0,1,2,3,255,128]).toString('base64');
 const url=await uploadRoot.CFGoogleUploads.upload('test.pdf','application/pdf',content,account);
 assert.match(url,/drive.google.com/);
 assert.equal(received.length,1);
 await assert.rejects(()=>uploadRoot.CFGoogleUploads.upload('large.pdf','application/pdf',Buffer.alloc(5*1024*1024+1).toString('base64'),account),/5 MB/);
});

test('OAuth/auth module uses WebKit fetch rather than direct native CapacitorHttp',()=>{
 const auth=fs.readFileSync('www/cf-google-auth.js','utf8');
 assert.match(auth,/root\.fetch\(/);
 assert.doesNotMatch(auth,/native\.request\(/);
 assert.match(auth,/ownedByMe/);
 const html=fs.readFileSync('www/index.html','utf8');
 assert.match(html,/GUARDAR BORRADOR DE FACTURA/);
 assert.doesNotMatch(html,/ENVIAR Y GUARDAR FACTURA/);
});
