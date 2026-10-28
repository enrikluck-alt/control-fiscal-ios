'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('www/index.html','utf8');
const workflow=fs.readFileSync('.github/workflows/build-ios.yml','utf8');
function env(){
 const sheets={},session={id:'TEST_BOOK_R7_12345678901234567890',token:'TOKEN_VALID_TEST',email:'r7@example.com'};
 const root={CFGoogleAccount:{active:()=>session,http:async(url,method='GET',data)=>{
  const range=decodeURIComponent(url.split('/values/')[1]?.split('?')[0]||'');
  const m=range.match(/^'([^']+)'!(.+)$/);assert.ok(m,'Unknown range '+url);
  const name=m[1],key=session.id==='TEST_BOOK_R7_12345678901234567890'?name:session.id+':'+name,rows=(sheets[key]??=[]);
  if(method==='GET')return {values:rows.map(row=>[...row])};
  if(url.includes(':append')){rows.push(...data.values);return {updates:{updatedRange:`'${name}'!A${rows.length}:C${rows.length}`}};}
  if(method==='PUT'){
   const a=m[2].match(/^A(\d+):/);assert.ok(a,'Unknown PUT '+url);
   rows[Number(a[1])-1]=[...data.values[0]];return {};
  }
  throw Error('Unexpected method '+method);
 }}};
 root.window=root;
 vm.runInNewContext(fs.readFileSync('www/cf-google-data.js','utf8'),{window:root,console,URLSearchParams});
 return {root,sheets,session,action:root.CFGoogleData.action};
}
test('R7: editar cliente antiguo y cambiar CIF conserva intacta la fila V76',async()=>{
 const {sheets,action}=env();
 sheets.Clientes=[['Nombre / Empresa','CIF','Dirección','CP','Ciudad','Provincia','Teléfono','Email','Activo'],
  ['Castillejo de Iniesta','B11111111','Calle 1','16250','Castillejo de Iniesta','Cuenca','123','mail@example.com','TRUE']];
 const legacy=JSON.stringify(sheets.Clientes[1]);
 const clients=(await action({accion:'listarClientes'})).clientes;
 const old=clients.find(x=>x.cif==='B11111111');assert.ok(old);
 const result=await action({accion:'editarCliente',originalKey:old._key,originalCif:old.cif,
  cliente:JSON.stringify({nombre:'Castillejo Renovado',cif:'B22222222',direccion:'Calle 2',cp:'16250'})});
 assert.equal(JSON.stringify(sheets.Clientes[1]),legacy);
 assert.equal(result.clientes.find(x=>x.cif==='B22222222').nombre,'Castillejo Renovado');
 assert.equal(result.clientes.find(x=>x.cif==='B11111111'),undefined);
 const edited=result.clientes.find(x=>x.cif==='B22222222');
 await assert.rejects(()=>action({accion:'editarCliente',originalKey:'no-exists',originalCif:'X00000000',cliente:JSON.stringify({nombre:'Otro',cif:'X123'})}),/No se encontró/);
 await action({accion:'editarCliente',originalKey:edited._key,originalCif:edited.cif,cliente:JSON.stringify({nombre:'Castillejo Nuevo',cif:'B22222222'})});
 assert.equal((await action({accion:'listarClientes'})).clientes.find(x=>x.cif==='B22222222').nombre,'Castillejo Nuevo');
});
test('R7: renombrar distribuidor histórico preserva lista antigua y sus contactos',async()=>{
 const {sheets,action}=env();
 sheets.Listas=[['Categoría','Nombre'],['Tienda','MadridHifi'],['Proveedor','Thomann']];
 let list=await action({accion:'listarTerceros'});
 assert.ok(list.tiendas.includes('MadridHifi'));assert.ok(list.proveedores.includes('Thomann'));
 await action({accion:'editarTercero',categoria:'Distribuidor',original:'MadridHifi',nombre:'Madrid Hifi España',
  detalles:{nombre:'Madrid Hifi España',cif:'B44444444',direccion:'Calle Ejemplo',telefono:'600000000',email:'contacto@example.com'}});
 list=await action({accion:'listarTerceros'});
 assert.equal(list.tiendas.includes('MadridHifi'),false);
 assert.ok(list.proveedores.includes('Madrid Hifi España'));
 assert.equal(list.detalles['Madrid Hifi España'].telefono,'600000000');
 assert.deepEqual(Array.from(sheets.Listas[1]),['Tienda','MadridHifi']);
 await action({accion:'editarTercero',categoria:'Distribuidor',original:'Madrid Hifi España',nombre:'Madrid Hifi Nuevamente',detalles:{nombre:'Madrid Hifi Nuevamente',telefono:'611111111'}});
 list=await action({accion:'listarTerceros'});
 assert.equal(list.proveedores.includes('Madrid Hifi España'),false);
 assert.ok(list.proveedores.includes('Madrid Hifi Nuevamente'));
});
test('R7: nuevas altas de distribuidores se guardan en Google Sheets y quedan aisladas por cuenta',async()=>{
 const {action,session}=env();
 await action({accion:'guardarTercero',categoria:'Distribuidor',nombre:'Distribuidor Nuevo',detalles:{nombre:'Distribuidor Nuevo',telefono:'699888777'}});
 assert.equal((await action({accion:'listarTerceros'})).detalles['Distribuidor Nuevo'].telefono,'699888777');
 session.id='TEST_BOOK_OTHER_ACCOUNT_123456789';
 const other=await action({accion:'listarTerceros'});
 assert.ok(!other.proveedores.includes('Distribuidor Nuevo'));
});
test('R7: la interfaz contiene directorios independientes, autocompletado y ninguna división Tienda/Proveedor en Compras',()=>{
 for(const token of [
  'id="cfDirectoryModal"','id="cfDirectoryList"','id="cfDirectorySearch"',
  "openContactDirectory('clientes')","openContactDirectory('distribuidores')",'function saveContactDirectory()',
  'function renderInvoiceClientSuggestions()','id="cfInvoiceClientSearch"',
  'id="cfInvoiceClientSuggestions"','💾 GUARDAR DISTRIBUIDOR','Mis distribuidores',
 ]){assert.ok(html.toLocaleLowerCase('es').includes(token.toLocaleLowerCase('es')),token);}
 const start=html.indexOf('function openForm(tipo)'),end=html.indexOf('function calcRecord(tipo',start);
 const compra=html.slice(start,end);
 assert.doesNotMatch(compra,/id="thirdPartyStoreBtn"|id="thirdPartyProviderBtn"/);
 assert.ok(compra.includes('Distribuidor'));
 assert.match(workflow,/UI76-20261028-R27/);
});
test('R7: Face ID no tiene esperas artificiales y sigue bloqueando al volver',()=>{
 const face=html.slice(html.indexOf('async function unlockWithBiometric()'),html.indexOf('function showPinUnlock('));
 const start=html.slice(html.indexOf('async function securityStart()'),html.indexOf('// Los datos privados'));
 assert.doesNotMatch(face,/securityWait\(300\)/);
 assert.doesNotMatch(start,/securityWait\(1500\)/);
 assert.match(html,/cfHandleAppState\(isActive\)/);
 assert.match(html,/lockSecurity\(\); \/\/ Bloqueo inmediato/);
});
