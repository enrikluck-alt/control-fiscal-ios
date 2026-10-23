'use strict';
/** API mínima de recepción. No admite listar opiniones ni acceder a Drive/Sheets.
 *  La autenticación Google se verifica por firma, emisor y client ID permitido.
 */
const http = require('node:http');
const { OAuth2Client } = require('google-auth-library');
const { Firestore, FieldValue } = require('@google-cloud/firestore');
const { randomUUID } = require('node:crypto');
const identityClient = new OAuth2Client();
const db = new Firestore();
const auds = String(process.env.GOOGLE_CLIENT_IDS || '').split(',').map(s=>s.trim()).filter(Boolean);
const acceptedOrigins = new Set(['capacitor://localhost', 'https://localhost', 'http://localhost']);
function reply(res,status,body,origin){
 res.statusCode=status;
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(acceptedOrigins.has(origin)){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');}
 res.end(JSON.stringify(body));
}
async function identity(authorization){
 const jwt=/^Bearer ([^\s]+)$/i.exec(authorization||'')?.[1];
 if(!jwt||jwt.length>5000||jwt.split('.').length!==3)throw Object.assign(Error('Inicia sesión con Google para enviar tu mensaje.'),{code:401});
 if(!auds.length)throw Object.assign(Error('Falta configurar el cliente OAuth autorizado del servidor.'),{code:503});
 let verified;
 try{verified=await identityClient.verifyIdToken({idToken:jwt,audience:auds});}
 catch{throw Object.assign(Error('Identidad Google caducada o no válida para Control Fiscal.'),{code:401});}
 const p=verified.getPayload();
 if(!p?.sub||!p?.email||p.email_verified!==true)throw Object.assign(Error('Identidad de Google no verificada.'),{code:401});
 return {uid:p.sub,email:p.email.toLowerCase(),name:p.name||''};
}
async function receive(req,res){
 const origin=req.headers.origin||'';
 if(req.method==='OPTIONS')return reply(res,204,{},origin);
 if(req.method==='GET'&&req.url==='/health')return reply(res,200,{ok:true},origin);
 if(req.url!=='/api/feedback'||req.method!=='POST')return reply(res,404,{message:'No existe esta ruta.'},origin);
 if(!String(req.headers['content-type']||'').startsWith('application/json'))return reply(res,415,{message:'Formato incorrecto.'},origin);
 let body='';
 try{for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>8192)throw Object.assign(Error('Mensaje demasiado grande.'),{code:413});}}
 catch(e){return reply(res,e.code||400,{message:'No se ha recibido el texto completo.'},origin);}
 let input;try{input=JSON.parse(body);}catch{return reply(res,400,{message:'El mensaje no es JSON válido.'},origin);}
 const kind=input?.kind,message=String(input?.message||'').trim();
 if(!['Sugerencia','Error','Consulta'].includes(kind)||message.length<12||message.length>2700)return reply(res,400,{message:'Introduce un tipo válido y entre 12 y 2700 caracteres.'},origin);
 const user=await identity(req.headers.authorization);
 const now=Date.now(),day=new Date(now).toISOString().slice(0,10);
 const version=String(input.appVersion||'').slice(0,60), platform=['ios','android','web'].includes(input.platform)?input.platform:'unknown',language=String(input.language||'').slice(0,20);
 const id=randomUUID();
 // Control por usuario en transacción: máximo 10 envíos UTC/día y 30 s entre envíos.
 const limiter=db.collection('_feedback_limits').doc(user.uid);
 await db.runTransaction(async transaction=>{
  const snapshot=await transaction.get(limiter),prev=snapshot.exists?snapshot.data():{};
  if(now-(prev.lastAtMs||0)<30000)throw Object.assign(Error('Espera 30 segundos antes de enviar otra sugerencia.'),{code:429});
  const count=prev.day===day?(prev.count||0):0;
  if(count>=10)throw Object.assign(Error('Has alcanzado el límite diario de sugerencias.'),{code:429});
  transaction.set(limiter,{day,count:count+1,lastAtMs:now}, {merge:true});
  transaction.create(db.collection('feedback').doc(id),{
   googleUserId:user.uid, email:user.email, name:user.name,kind,message,appVersion:version,
   platform,language,status:'nueva',createdAt:FieldValue.serverTimestamp()
  });
 });
 return reply(res,201,{received:true,id},origin);
}
const server=http.createServer((req,res)=>{
 receive(req,res).catch(err=>{
  const code=[401,403,413,429,503].includes(err.code)?err.code:(String(err.message||'').includes('Token')?401:500);
  if(code===500)console.error('Error interno recepción feedback:',err.name||'Error'); // No registrar datos de usuario/tokens
  reply(res,code,{message:code===500?'No se pudo guardar la sugerencia en Google Cloud.':code===401?'Verifica tu sesión de Google e inténtalo de nuevo.':err.message},req.headers.origin||'');
 });
});
if(require.main===module)server.listen(Number(process.env.PORT||8080),'0.0.0.0');
module.exports={server,receive};
