// Shim para que @aparajita/capacitor-biometric-auth use la instancia
// de Capacitor que iOS inyecta en window.Capacitor.
export function registerPlugin(name, implementations) {
  const cap = window.Capacitor;
  if (!cap || typeof cap.registerPlugin !== 'function') {
    throw new Error('Capacitor nativo todavía no está disponible.');
  }
  return cap.registerPlugin(name, implementations);
}
