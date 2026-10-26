const test=require('node:test'), assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const client=fs.readFileSync('www/cf-feedback.js','utf8');
const html=fs.readFileSync('www/index.html','utf8');
const auth=fs.readFileSync('www/cf-google-auth.js','utf8');
const server=fs.readFileSync('cloud-feedback/server.js','utf8');
const workflow=fs.readFileSync('.github/workflows/build-ios.yml','utf8');
function create(endpoint,request){
 const root={CFFeedbackConfig:{endpoint},CFGoogleAccount:{active:()=>({id:'accountA',email:'user@test.invalid'}),getSupportIdToken:async()=>['header','payload','signature'].join('.')},Capacitor:{getPlatform:()=> 'ios'},navigator:{language:'es-ES'},fetch:request};
 vm.runInNewContext(client,{window:root,AbortController,setTimeout,clearTimeout});
 return root;
}
test('R15: no se muestra ni se envía dirección privada de desarrolladores en el formulario',()=>{
 assert.match(html,/Enviando sugerencia a los desarrolladores/);
 assert.match(html,/window\.CFFeedback\.send/);
 assert.doesNotMatch(html,/mailto:/);
 assert.match(html,/Google Cloud no ha confirmado el envío/);
 assert.ok(!html.includes('CF_SUPPORT_EMAIL'));
});
test('R15: el cliente no envía un mensaje si no hay URL Cloud configurada',async()=>{
 const root=create('',()=>{throw Error('Nunca debe invocarse fetch')});
 await assert.rejects(()=>root.CFFeedback.send({kind:'Sugerencia',message:'Una sugerencia completamente válida.'}),/todavía no está configurado/);
});
test('R15: se envía únicamente texto, tipo, plataforma y token de identidad (no token de Drive)',async()=>{
 let req;
 const root=create('https://feedback-abc.run.app',async(url,opt)=>{req={url,opt};return {ok:true,status:201,json:async()=>({received:true,id:'feedback-id'})}});
 const out=await root.CFFeedback.send({kind:'Error',message:'Este botón no registra la pantalla.',appVersion:'R15'});
 assert.equal(out.id,'feedback-id');assert.equal(req.url,'https://feedback-abc.run.app/api/feedback');
 assert.equal(req.opt.headers.Authorization,'Bearer header.payload.signature');
 assert.equal(JSON.parse(req.opt.body).kind,'Error');
 assert.doesNotMatch(req.opt.body,/facturas|sheets|drive|accessToken/i);
});
test('R15: jamás confirma éxito si el servidor rechaza el mensaje',async()=>{
 const root=create('https://feedback-abc.run.app',async()=>({ok:false,status:429,json:async()=>({message:'Límite diario.'})}));
 await assert.rejects(()=>root.CFFeedback.send({kind:'Consulta',message:'Una pregunta acerca del visor de documentos.'}),/Límite diario/);
});
test('R15: el servidor valida Google JWT y Firestore, sin listados públicos ni permisos de Google Drive',()=>{
 assert.match(server,/verifyIdToken\(\{idToken:jwt,audience:auds\}\)/);
 assert.match(server,/transaction\.create\(db\.collection\('feedback'\)/);
 assert.match(server,/new Firestore\(\)/);
 assert.match(server,/req\.url!=='\/api\/feedback'\|\|req\.method!=='POST'/);
 assert.doesNotMatch(server,/drive\.googleapis\.com|sheets\.googleapis\.com|gmail\.googleapis\.com/);
 assert.match(auth,/async function getSupportIdToken/);
});
test('R15: GitHub copia cliente y config Cloud al iPhone',()=>{
 assert.match(workflow,/cf-feedback-config.js/);assert.match(workflow,/cf-feedback.js/);
 assert.match(workflow,/UI76-20261026-R20/);
});
