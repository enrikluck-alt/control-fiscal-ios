const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../contacts-entry.js'),'utf8')
  .replace(/^import\s+.*?;\s*$/gm,'')
  .replace(/^export\s+/gm,'');
function simulate(platform, result) {
  let opts;
  const ctx={
    window:{},
    Capacitor:{getPlatform:()=>platform},
    ContactProperty:{PhoneNumber:'PhoneNumber'},
    CapacitorContacts:{pickContact:async options=>{opts=options;return result;}}
  };
  vm.runInNewContext(source, ctx, {filename:'contacts-entry.js'});
  return {pick:ctx.window.CFNativeContactPicker.pickContact, options:()=>opts};
}
test('R22 compilación corregida: selector iOS normaliza nombre, móvil y correo',async()=>{
  const {pick,options}=simulate('ios',{contacts:[{displayName:'Ana López',phoneNumbers:[{value:'+34612345678'}],emailAddresses:[{value:'ana@example.com'}]}]});
  const c=await pick();
  assert.equal(c.displayName,'Ana López');
  assert.equal(c.phoneNumbers[0].value,'+34612345678');
  assert.equal(c.emails[0].value,'ana@example.com');
  assert.equal(options().property,'PhoneNumber');
});
test('R22 compilación corregida: Android elige un número sin acceder a toda la agenda',async()=>{
  const {pick,options}=simulate('android',{contacts:[{displayName:'Luis',phoneNumbers:[{value:'+34911222333'}]}]});
  assert.equal((await pick()).phoneNumbers[0].value,'+34911222333');
  assert.equal(options().property,'PhoneNumber');
});
test('R22 compilación corregida: cancelar contacto no produce datos falsos',async()=>{
  const {pick}=simulate('ios',{contacts:[]});
  assert.equal(await pick(),null);
});
