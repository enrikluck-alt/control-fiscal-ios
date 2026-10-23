'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=x=>fs.readFileSync(path.join(root,x),'utf8');
const html=read('www/index.html');
const pdf=read('www/cf-pdf-viewer.js');
const workflow=read('.github/workflows/build-ios.yml');
test('R16: PDF privado se dibuja en un canvas por página y el zoom modifica la escala del contenido',()=>{
 assert.match(html,/id="cfPdfPages"/);
 assert.match(html,/await window\.CFPdfViewer\.open\(blob\)/);
 assert.doesNotMatch(html,/frame\.src=cfDocumentObjectUrl/);
 assert.match(pdf,/page\.render\(\{canvasContext:ctx,viewport:logical/);
 assert.match(pdf,/page\.getViewport\(\{scale:naturalFit\*level\}\)/);
 assert.match(pdf,/IntersectionObserver/);
 assert.match(pdf,/pdf\.destroy\(\)/);
 assert.match(pdf,/isEvalSupported:false/);
 assert.doesNotMatch(pdf,/cdnjs|jsdelivr|unpkg/);
});
test('R16: PDF.js y worker versionados se instalan localmente antes de sincronizar iOS',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.dependencies['pdfjs-dist'],'4.10.38');
 assert.equal(pkg.scripts['build:pdf'],'node tools/copy-pdfjs.cjs');
 assert.match(workflow,/npm run build:pdf/);
 assert.ok(workflow.indexOf('npm run build:pdf')<workflow.indexOf('npx cap sync ios'));
 assert.match(workflow,/vendor\/pdf\.worker\.min\.mjs/);
 assert.match(read('tools/copy-pdfjs.cjs'),/LICENSE-pdfjs\.txt/);
});
test('R16: i18n traduce texto fijo, opciones y accesibilidad sin enviar documentos fiscales',()=>{
 const storage={getItem:()=>null,setItem:()=>{}};
 const app={localStorage:storage,navigator:{languages:['fr-FR'],language:'fr-FR'}};
 const document={readyState:'loading',addEventListener:()=>{}};
 vm.runInNewContext(read('www/cf-i18n.js'),{window:app,document,setTimeout:()=>0,NodeFilter:{SHOW_TEXT:4}});
 vm.runInNewContext(read('www/cf-i18n-extended.js'),{window:app,document});
 assert.equal(app.CFi18n.locale(),'fr');
 assert.equal(app.CFi18n.t('Guardar cliente'),'Enregistrer client');
 assert.equal(app.CFi18n.t('GUARDAR CLIENTE'),'ENREGISTRER LE CLIENT');
 assert.equal(app.CFi18n.t('BUSCAR MATERIAL'),'RECHERCHER DU MATÉRIEL');
 assert.equal(app.CFi18n.t('Nombre propio de cliente XYZ'),'Nombre propio de cliente XYZ');
 assert.match(read('www/cf-i18n.js'),/placeholder','title','aria-label/);
 assert.match(read('www/cf-i18n.js'),/OPTION/);
 assert.doesNotMatch(read('www/cf-i18n.js'),/translate\.googleapis|Gemini|fetch\(/);
});
test('R16: isla dinámica respeta safe areas también en horizontal y en pantallas de acceso',()=>{
 assert.match(html,/--cf-left-safe:env\(safe-area-inset-left/);
 assert.match(html,/--cf-right-safe:env\(safe-area-inset-right/);
 assert.match(html,/@media\(orientation:landscape\) and \(max-height:520px\)/);
 assert.match(html,/#accountGate\{padding-top:calc\(18px \+ var\(--cf-top-safe\)\)/);
 assert.match(html,/#cfDocumentViewer \.modalCard\{max-height:calc\(100dvh/);
 assert.match(html,/id="cfOrientationChoice"/);
});
test('R16: Cloud feedback no confirma ni transmite nada sin configurar el proyecto externo',()=>{
 assert.match(read('www/cf-feedback-config.js'),/endpoint:''/);
 assert.match(read('www/cf-feedback.js'),/No se ha enviado el mensaje/);
 assert.match(workflow,/cf-feedback-config\.js/);
});
