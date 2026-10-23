/* R17: gesto nativo de retroceso. Se inicia solo desde el borde izquierdo.
   No captura el desplazamiento vertical, campos ni arrastre de documentos PDF. */
(function(root,doc){'use strict';
 let gesture=null;
 const active=el=>!!el&&!el.classList.contains('hidden')&&!el.hidden;
 function locked(){return active(doc.getElementById('accountGate'))||active(doc.getElementById('securityLock'));}
 function visiblePage(){return ['home','formPage','summaryPage','recordsPage','settingsPage','agendaPage','inventoryPage','documentsPage'].find(id=>active(doc.getElementById(id)));}
 function back(){
  const modals=[...doc.querySelectorAll('.modal')].filter(active);
  const modal=modals[modals.length-1];
  if(modal){
   if(modal.id==='cfDocumentViewer')return false;
   const close=modal.querySelector('.modalClose');
   if(close){close.click();return true;}
   const closers={agendaEventModal:'closeAgendaEventModal',cfSupportModal:'closeCFSupport'};
   if(typeof root[closers[modal.id]]==='function'){root[closers[modal.id]]();return true;}
   return false;
  }
  const page=visiblePage();
  if(!page||page==='home')return false;
  // Reutilizar exactamente el mismo retroceso que las flechas existentes.
  if(page==='settingsPage'&&typeof root.cfSettingsBack==='function'){root.cfSettingsBack();return true;}
  if(page==='documentsPage'&&typeof root.CFDocuments?.back==='function'){root.CFDocuments.back();return true;}
  if(typeof root.goHome==='function'){root.goHome();return true;}
  return false;
 }
 doc.addEventListener('touchstart',ev=>{
  gesture=null;
  if(locked()||ev.touches.length!==1)return;
  const touch=ev.touches[0];
  if(touch.clientX>48 || touch.clientX<0)return;
  const el=ev.target;
  if(el?.closest?.('input,textarea,select,[contenteditable="true"],.cfViewerViewport,.cfPdfPages'))return;
  gesture={x:touch.clientX,y:touch.clientY,time:Date.now()};
 },{passive:true});
 doc.addEventListener('touchcancel',()=>{gesture=null;},{passive:true});
 doc.addEventListener('touchend',ev=>{
  const start=gesture;gesture=null;
  if(!start||ev.changedTouches.length!==1||locked())return;
  const end=ev.changedTouches[0];const dx=end.clientX-start.x,dy=Math.abs(end.clientY-start.y);
  if(dx<75||dy>55||dx<dy*1.5||Date.now()-start.time>1300)return;
  back();
 },{passive:true});
 root.CFSwipeBack=Object.freeze({back});
})(window,document);
