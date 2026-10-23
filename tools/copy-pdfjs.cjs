/* Runs after npm install, before capacitor sync. Keep bundled engine and worker in sync. */
const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=path.join(root,'node_modules','pdfjs-dist');const target=path.join(root,'www','vendor');
if(!fs.existsSync(source))throw Error('Falta pdfjs-dist: ejecuta npm install.');
fs.mkdirSync(target,{recursive:true});
for(const [from,to] of [['build/pdf.min.mjs','pdf.min.mjs'],['build/pdf.worker.min.mjs','pdf.worker.min.mjs'],['LICENSE','LICENSE-pdfjs.txt']]){
 const file=path.join(source,from);if(!fs.existsSync(file))throw Error('Falta PDF.js: '+from);
 fs.copyFileSync(file,path.join(target,to));
}
console.log('PDF.js y worker locales copiados a www/vendor (sin usar CDN).');
