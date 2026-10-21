/* Puente biométrico: recuperar detección de V76, compatible con registro explícito. */
(function () {
  'use strict';
  function resolve() {
    const cap = window.Capacitor;
    if (!cap) return null;
    const plugins = cap.Plugins || {};
    const existing = plugins.BiometricAuthNative || plugins.BiometricAuth;
    if (existing && typeof existing.checkBiometry === 'function' &&
        (typeof existing.authenticate === 'function' || typeof existing.internalAuthenticate === 'function')) {
      return existing;
    }
    if (typeof cap.registerPlugin === 'function') {
      try { return cap.registerPlugin('BiometricAuthNative'); }
      catch (err) { console.warn('[Face ID] Registro de plugin:', err); }
    }
    return null;
  }
  window.CFResolveBiometric = resolve;
  function update() { window.ControlFiscalBiometricAuth = resolve(); }
  update();
  document.addEventListener('deviceready', update, { once: true });
  window.addEventListener('load', update, { once: true });
})();
