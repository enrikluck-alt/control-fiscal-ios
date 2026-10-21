/* V78: mobile-only presentation; retains all original event listeners. */
(function(){'use strict';
 const gate=document.getElementById('cf-google-test-gate');
 const panel=gate&&gate.querySelector('.panel');if(!panel)return;
 const account=document.getElementById('cf-active-account')?.parentElement;
 const phase=document.getElementById('cf-phase1-write')?.parentElement;
 if(phase&&account){account.insertAdjacentElement('afterend',phase);phase.classList.add('cf-phase-primary');}
 const label=document.querySelector('label[for="cf-existing-id"]');
 const input=document.getElementById('cf-existing-id');
 const find=document.getElementById('cf-auto-find');
 const create=document.getElementById('cf-auto-create');
 const inspect=document.getElementById('cf-inspect');
 const repair=document.getElementById('cf-repair');
 const diag=inspect?.parentElement;
 const write=document.getElementById('cf-write-test');
 const read=document.getElementById('cf-read-test');
 const rw=write?.parentElement;
 const details=document.createElement('details');details.className='cf-v78-advanced';
 const summary=document.createElement('summary');summary.textContent='Herramientas de Drive y diagnóstico';details.appendChild(summary);
 for(const el of [label,input,find,create,diag,rw]){if(el)details.appendChild(el);}
 // Keep the status text visible, including errors from any tool.
 const result=document.getElementById('cf-google-result');
 if(result)panel.insertBefore(details,result);
 else panel.appendChild(details);
 const title=panel.querySelector('h2');if(title)title.textContent='Control Fiscal V78';
})();
