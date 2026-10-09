/*
 * Puente nativo mínimo para Face ID.
 * Usa la instancia de Capacitor que inyecta iOS, sin empaquetar otra copia de @capacitor/core.
 * El plugin oficial registra el nombre nativo BiometricAuthNative y expone
 * checkBiometry e internalAuthenticate en el bridge nativo.
 */
(function () {
  const cap = window.Capacitor;
  const status = {
    capacitorPresent: !!cap,
    registerPluginPresent: !!(cap && typeof cap.registerPlugin === 'function'),
    pluginName: 'BiometricAuthNative',
    bridgeLoaded: false,
    error: ''
  };
  window.__CF_BIOMETRIC_BRIDGE_STATUS = status;

  if (!cap || typeof cap.registerPlugin !== 'function') {
    status.error = 'Capacitor.registerPlugin no está disponible al cargar el puente.';
    console.error('[Control Fiscal Face ID]', status.error);
    return;
  }

  try {
    const nativePlugin = cap.registerPlugin('BiometricAuthNative');
    window.ControlFiscalBiometricAuth = {
      checkBiometry: function () {
        return nativePlugin.checkBiometry();
      },
      authenticate: function (options) {
        return nativePlugin.internalAuthenticate(options || {});
      }
    };
    status.bridgeLoaded = true;
    status.checkBiometryType = typeof window.ControlFiscalBiometricAuth.checkBiometry;
    status.authenticateType = typeof window.ControlFiscalBiometricAuth.authenticate;
    status.nativeCheckType = typeof nativePlugin.checkBiometry;
    status.nativeAuthenticateType = typeof nativePlugin.internalAuthenticate;
    console.info('[Control Fiscal Face ID] Puente registrado', status);
  } catch (error) {
    status.error = String(error && (error.stack || error.message) || error);
    console.error('[Control Fiscal Face ID] Error registrando puente', error);
  }
})();
