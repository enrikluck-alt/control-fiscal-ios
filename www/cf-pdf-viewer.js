/* R16 · Mozilla PDF.js paints the *contents* of the private PDF, not an iframe box.
   Loaded on demand, from bundled/local files only. The PDF bytes never go to a CDN.
   Apache-2.0 PDF.js attribution in vendor/LICENSE-pdfjs.txt (generated during build).
*/
(function(root){'use strict';
let importPromise=null, pdf=null, view=null, pane=null, docToken=0, level=1, naturalFit=1;
let observer=null;const tasks=new Map();const MAX_CANVAS_SIDE=4096;
const find=id=>document.getElementById(id);
function loadLib(){
 if(!importPromise)importPromise=import('./vendor/pdf.min.mjs').then(lib=>{
   lib.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.min.mjs',document.baseURI).href;
   return lib;
 }).catch(error=>{importPromise=null;throw error;});
 return importPromise;
}
function updateLabel(){const el=find('cfDocumentZoomLabel');if(el)el.textContent=Math.round(level*100)+' %';}
function shutdown(){
 docToken++;if(observer){observer.disconnect();observer=null;}
 for(const task of tasks.values()){try{task.cancel();}catch{}}tasks.clear();
 if(pdf){try{pdf.destroy();}catch{}}pdf=null;
 pane?.replaceChildren();pane=null;view=null;level=1;naturalFit=1;updateLabel();
}
function showError(msg){const el=find('cfDocumentStatus');if(el)el.textContent=msg;}
function makeCanvas(page,naturalWidth,naturalHeight){
 const placeholder=document.createElement('div');placeholder.className='cfPdfPage';placeholder.dataset.page=String(page);
 placeholder.dataset.ratio=String(naturalHeight/naturalWidth);
 placeholder.style.width='100%';placeholder.style.aspectRatio=naturalWidth+' / '+naturalHeight;
 placeholder.setAttribute('role','img');placeholder.setAttribute('aria-label','Página '+page);
 return placeholder;
}
async function load(blob){
 shutdown();const token=docToken;
 view=find('cfViewerViewport');pane=find('cfPdfPages');if(!view||!pane)throw Error('No se ha encontrado el visor de PDF.');
 pane.classList.remove('hidden');const lib=await loadLib();if(token!==docToken)return;
 // Read only the authenticated Drive blob already downloaded by Control Fiscal.
 const data=new Uint8Array(await blob.arrayBuffer());if(token!==docToken)return;
 const task=lib.getDocument({data,isEvalSupported:false,useSystemFonts:true});
 const documentProxy=await task.promise;
 if(token!==docToken){await documentProxy.destroy();return;}pdf=documentProxy;
 const first=await pdf.getPage(1);if(token!==docToken)return;
 const dimensions=first.getViewport({scale:1});
 const fitWidth=Math.max(180,(view.clientWidth||300)-20);
 naturalFit=Math.min(2,fitWidth/dimensions.width);
 const frag=document.createDocumentFragment();
 // Fast first paint: do NOT read every PDF page before allowing the first page to render.
 // The real dimensions of later pages are corrected when that page enters the viewport.
 for(let i=1;i<=pdf.numPages;i++){
   if(token!==docToken)return;
   frag.append(makeCanvas(i,dimensions.width,dimensions.height));
 }
 pane.replaceChildren(frag);view.scrollTop=0;view.scrollLeft=0;
 observer=new IntersectionObserver(entries=>{
   for(const entry of entries){if(entry.isIntersecting)render(entry.target,docToken).catch(err=>{if(err?.name!=='RenderingCancelledException')showError('Error al dibujar el PDF: '+(err.message||err));});}
 },{root:view,rootMargin:'420px 0px',threshold:0.01});
 for(const item of pane.children)observer.observe(item);
 updateLabel();showError('PDF privado · '+pdf.numPages+' página(s) · zoom real con − y +.');
}
async function render(node,token){
 if(!pdf||token!==docToken)return;
 const n=Number(node.dataset.page);if(!n)return;
 const key=n;
 if(node.dataset.renderedLevel===String(level)||node.dataset.rendering==='true')return;
 node.dataset.rendering='true';
 let renderTask;
 try{
   const page=await pdf.getPage(n);if(token!==docToken)return;
   const actual=page.getViewport({scale:1});node.style.aspectRatio=actual.width+' / '+actual.height;
   const logical=page.getViewport({scale:naturalFit*level});
   const quality=document.body.classList.contains('cf-performance-low')?1:2.5;
   const resolution=Math.max(1,Math.min(root.devicePixelRatio||1,quality,MAX_CANVAS_SIDE/Math.max(logical.width,logical.height)));
   const canvas=document.createElement('canvas');canvas.className='cfPdfCanvas';
   canvas.width=Math.max(1,Math.floor(logical.width*resolution));canvas.height=Math.max(1,Math.floor(logical.height*resolution));
   canvas.style.width=logical.width+'px';canvas.style.height=logical.height+'px';
   const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('El dispositivo no permite dibujar la página.');
   if(token!==docToken)return;
   renderTask=page.render({canvasContext:ctx,viewport:logical,transform:resolution===1?null:[resolution,0,0,resolution,0,0]});
   tasks.set(key,renderTask);await renderTask.promise;
   if(token!==docToken||tasks.get(key)!==renderTask)return;
   node.replaceChildren(canvas);node.dataset.renderedLevel=String(level);
 }finally{
   if(tasks.get(key)===renderTask)tasks.delete(key);
   delete node.dataset.rendering;
 }
}
function setLevel(next){
 level=Math.max(0.5,Math.min(4,Math.round(next*100)/100));updateLabel();
 if(!pdf||!view||!pane)return level;
 const previous=Number(pane.dataset.zoom)||1;
 const midpointX=view.scrollLeft+view.clientWidth/2,midpointY=view.scrollTop+view.clientHeight/2;
 const x=midpointX/previous,y=midpointY/previous;
 pane.dataset.zoom=String(level);pane.style.width=100*level+'%';
 for(const [number,task] of tasks){try{task.cancel();}catch{}tasks.delete(number);}
 for(const div of pane.children){delete div.dataset.renderedLevel;delete div.dataset.rendering;div.replaceChildren();}
 requestAnimationFrame(()=>{
   if(!view||!pane)return;
   view.scrollLeft=Math.max(0,x*level-view.clientWidth/2);
   view.scrollTop=Math.max(0,y*level-view.clientHeight/2);
   for(const div of pane.children){const rect=div.getBoundingClientRect(),parent=view.getBoundingClientRect();
     if(rect.bottom>parent.top-450&&rect.top<parent.bottom+450)render(div,docToken).catch(()=>{});
   }
 });
 return level;
}
function pinchSupport(){
 if(!view||view.dataset.cfPinchReady==='yes')return;
 view.dataset.cfPinchReady='yes';let begin=0,starting=1;
 view.addEventListener('touchstart',event=>{if(event.touches.length===2){
   const a=event.touches[0],b=event.touches[1];begin=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);starting=level;
 }},{passive:true});
 view.addEventListener('touchend',event=>{if(event.touches.length<2)begin=0;},{passive:true});
 view.addEventListener('touchmove',event=>{if(event.touches.length!==2||!begin||!pdf)return;
   const a=event.touches[0],b=event.touches[1];const dist=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
   // Only redraw on meaningful increments; native two-finger gesture remains available to scroll.
   const target=Math.round(Math.min(4,Math.max(.5,starting*dist/begin))*10)/10;
   if(Math.abs(target-level)>=.1){event.preventDefault();setLevel(target);}
 },{passive:false});
}
root.CFPdfViewer={open:async blob=>{await load(blob);pinchSupport();},zoom:delta=>setLevel(level+delta),reset:()=>setLevel(1),close:shutdown,get level(){return level;}};
})(window);
