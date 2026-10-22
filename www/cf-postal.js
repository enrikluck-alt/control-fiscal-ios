/* Datos abiertos de CP/municipios: fuente INE, elaborado por regi-es.
 * https://github.com/regi-es/ds-codigos-postales-ine-es
 * Los CP pueden corresponder a múltiples localidades: jamás escoger al azar.
 */
(function(root){'use strict';
 const PROVINCES=['','Álava','Albacete','Alicante','Almería','Ávila','Badajoz','Illes Balears','Barcelona','Burgos','Cáceres','Cádiz','Castellón','Ciudad Real','Córdoba','A Coruña','Cuenca','Girona','Granada','Guadalajara','Gipuzkoa','Huelva','Huesca','Jaén','León','Lleida','La Rioja','Lugo','Madrid','Málaga','Murcia','Navarra','Ourense','Asturias','Palencia','Las Palmas','Pontevedra','Salamanca','Santa Cruz de Tenerife','Cantabria','Segovia','Sevilla','Soria','Tarragona','Teruel','Toledo','Valencia','Valladolid','Bizkaia','Zamora','Zaragoza','Ceuta','Melilla'];
 const BASE='https://cdn.jsdelivr.net/gh/regi-es/ds-codigos-postales-ine-es@2026-01/data/';
 let database=null,pending=null;
 const fold=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();
 async function load(){if(database)return database;if(pending)return pending;
  pending=(async()=>{const [a,b]=await Promise.all(['codigos_postales.json','municipios.json'].map(async f=>{
    const mirrors=[BASE+f,'https://raw.githubusercontent.com/regi-es/ds-codigos-postales-ine-es/master/data/'+f];
    for(const url of mirrors){try{const r=await root.fetch(url,{cache:'force-cache'});if(r.ok)return await r.json();}catch(e){/* otra fuente */}}
    throw Error('No se ha podido consultar el directorio postal.');
  }));database={postcodes:a,municipalities:b};return database;})();
  try{return await pending;}finally{pending=null;}
 }
 function fromPostal(db,code){return (db.postcodes[code]||[]).map(id=>({city:db.municipalities[id]?.nombre,postal:code,province:PROVINCES[Number(id.slice(0,2))]||''})).filter(x=>x.city);}
 function fromCity(db,value,province){const normalized=fold(value),p=fold(province);let out=[];for(const [id,m] of Object.entries(db.municipalities)){
  if(fold(m.nombre)!==normalized)continue;if(p&&fold(PROVINCES[Number(id.slice(0,2))])!==p)continue;
  out.push(...m.codigos_postales.map(code=>({city:m.nombre,postal:code,province:PROVINCES[Number(id.slice(0,2))]})));
 }return out;
 }
 function attach(postalId,cityId,provinceId){const cp=document.getElementById(postalId),city=document.getElementById(cityId),province=document.getElementById(provinceId);if(!cp||!city||!province||cp.dataset.postalLinked)return;
  cp.dataset.postalLinked='yes';let request=0;
  const note=document.createElement('div');note.className='cfPostalHint';note.style.cssText='font-size:12px;color:var(--muted);margin-top:5px;grid-column:1/-1;display:none';
  city.closest('.field')?.appendChild(note);
  const select=document.createElement('select');select.className='select';select.style.cssText='display:none;width:100%;margin-top:6px;font-size:14px';select.setAttribute('aria-label','Seleccionar localidad o código postal');city.closest('.field')?.appendChild(select);
  function choices(opts,field){const uniq=[...new Map(opts.map(x=>[field==='city'?x.city+'|'+x.province:x.postal+'|'+x.province,x])).values()];
    if(uniq.length===1){const x=uniq[0];if(field==='city')city.value=x.city;else cp.value=x.postal;province.value=x.province;note.style.display='none';select.style.display='none';city.dispatchEvent(new Event('input',{bubbles:true}));return;}
    if(uniq.length>1){select.innerHTML='<option value="">Seleccionar '+(field==='city'?'municipio':'código postal')+'…</option>'+uniq.slice(0,120).map((x,i)=>'<option value="'+i+'">'+(field==='city'?x.city:x.postal)+' · '+x.province+'</option>').join('');select.style.display='block';note.style.display='block';note.textContent='Hay varias coincidencias; elige la correcta.';select.onchange=()=>{const x=uniq[Number(select.value)];if(!x)return;city.value=x.city;cp.value=x.postal;province.value=x.province;select.style.display='none';note.style.display='none';city.dispatchEvent(new Event('input',{bubbles:true}));};}
  }
  cp.addEventListener('input',async()=>{const seq=++request;select.style.display='none';if(!/^\d{5}$/.test(cp.value))return;
    const pref=Number(cp.value.slice(0,2));if(PROVINCES[pref])province.value=PROVINCES[pref];
    try{const db=await load();if(seq!==request)return;const opts=fromPostal(db,cp.value);choices(opts,'city');}catch(e){note.textContent='Localidad: completa manualmente (directorio no disponible).';note.style.display='block';}
  });
  let cityTimer=null;const detectCity=async()=>{if(city.value.trim().length<2)return;const seq=++request;try{const db=await load();if(seq!==request)return;choices(fromCity(db,city.value,province.value),'postal');}catch{ /* Los campos siempre pueden editarse manualmente. */ }};
  city.addEventListener('input',()=>{clearTimeout(cityTimer);cityTimer=setTimeout(detectCity,450);});
  city.addEventListener('change',()=>{clearTimeout(cityTimer);detectCity();});
 }
 root.CFPostal=Object.freeze({attach,load,fromPostal,fromCity,PROVINCES});
})(window);
