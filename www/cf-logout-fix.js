/* Logout en Ajustes: independiente de la navegación V77/V78. */
(function(){'use strict';
const button=document.getElementById('cf-logout-from-settings');
const status=document.getElementById('cf-logout-from-settings-status');
if(!button)return;
async function haptic(){
 try{const p=window.Capacitor?.Plugins?.Haptics;if(p?.impact){await p.impact({style:'Medium'});return;}}catch(e){console.warn('Haptics:',e);}
 try{navigator.vibrate?.(65);}catch(_e){}
}
async function logout(){
 void haptic(); // Vibración inmediata al tocar el botón, antes de cualquier confirmación.
 if(button.disabled)return;
 if(!window.confirm('¿Cerrar sesión de Google y volver a la pantalla de acceso?'))return;
 button.disabled=true;
 if(status)status.textContent='Cerrando sesión…';
 try{
  const signOut=window.ControlFiscalV78Logout;
  if(typeof signOut!=='function')throw new Error('No se ha inicializado el inicio de sesión de Google.');
  await signOut();
  if(window.ControlFiscalV78Session?.())throw new Error('La sesión continúa activa.');
  // No borrar datos fiscales ni usar el cierre del antiguo Apps Script.
  if(status)status.textContent='Sesión cerrada. Volviendo al acceso…';
  window.dispatchEvent(new Event('cf-google-session-ended'));
  if(status)status.textContent='';
 }catch(e){
  if(status)status.textContent='Error al cerrar sesión: '+String(e?.message||e);
  button.disabled=false;
 }
}
// Capture garantiza la acción incluso si otros manejadores de V76 interceptan el toque.
button.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();void logout();},true);
})();
