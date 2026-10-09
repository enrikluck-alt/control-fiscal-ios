/*
 * Entry point oficial para Face ID.
 * IMPORTANTE: se empaqueta desde npm para que @capacitor/core inicialice
 * registerPlugin() en la instancia de Capacitor inyectada por iOS. No crear
 * un proxy manual sobre window.Capacitor.
 */
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';

const api = BiometricAuth;
window.ControlFiscalBiometricAuth = api;

const cap = window.Capacitor;
window.__CF_BIOMETRIC_BRIDGE_STATUS = {
  capacitorPresent: !!cap,
  registerPluginPresent: !!(cap && typeof cap.registerPlugin === 'function'),
  pluginName: 'BiometricAuthNative',
  bridgeLoaded: !!(api && typeof api.checkBiometry === 'function' && typeof api.authenticate === 'function'),
  checkBiometryType: typeof api?.checkBiometry,
  authenticateType: typeof api?.authenticate,
  platform: cap && typeof cap.getPlatform === 'function' ? cap.getPlatform() : 'unknown',
  error: ''
};

if (!window.__CF_BIOMETRIC_BRIDGE_STATUS.bridgeLoaded) {
  window.__CF_BIOMETRIC_BRIDGE_STATUS.error = 'El paquete oficial no expuso checkBiometry() y authenticate().';
  console.error('[Control Fiscal Face ID]', window.__CF_BIOMETRIC_BRIDGE_STATUS);
} else {
  console.info('[Control Fiscal Face ID] Plugin oficial cargado', window.__CF_BIOMETRIC_BRIDGE_STATUS);
}
