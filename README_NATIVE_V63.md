# Control Fiscal Native V63

V63 corrige Face ID usando el mismo `window.Capacitor` que inyecta iOS. Ya no se genera un segundo bundle de `@capacitor/core` para el plugin biométrico.

## Estructura GitHub
- `.github/workflows/build-ios.yml`
- `www/index.html`
- `www/chispas-logo.png`
- `package.json`
- `capacitor.config.json`
- `resources/`

## Apps Script
Usa tu Apps Script V57/V60 actual. No hace falta cambiarlo para Face ID.

## Build
Actions → Build unsigned iOS IPA → Run workflow.

El workflow instala `@aparajita/capacitor-biometric-auth`, ejecuta `npx cap sync ios`, añade `NSFaceIDUsageDescription` y verifica que el plugin nativo esté registrado en el proyecto iOS.


Corrección V63: el plugin usa el nombre nativo BiometricAuthNative, que es el nombre registrado por @aparajita/capacitor-biometric-auth.
