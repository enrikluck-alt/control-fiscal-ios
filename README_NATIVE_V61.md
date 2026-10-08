# Control Fiscal Native V61

IMPORTANTE: esta versión corrige la estructura del proyecto para que el archivo web esté en `www/index.html` y el logo en `www/chispas-logo.png`. Esto es necesario porque `capacitor.config.json` usa `webDir: "www"`.

## Estructura correcta en GitHub

- `package.json` → raíz
- `capacitor.config.json` → raíz
- `biometric-entry.js` → raíz
- `resources/` → raíz
- `.github/workflows/build-ios.yml` → raíz
- `www/index.html` → dentro de `www/`
- `www/chispas-logo.png` → dentro de `www/`

NO subas `index.html` en la raíz. NO crees manualmente la carpeta `ios/`; GitHub Actions la genera.

## Apps Script

`AppsScript_v61.js` se copia en el editor de Google Apps Script. No va dentro de `www`.

## Face ID

El workflow instala `@aparajita/capacitor-biometric-auth`, genera `www/biometric.bundle.js`, ejecuta `npx cap sync ios` y añade `NSFaceIDUsageDescription` al Info.plist. El plugin documenta que `NSFaceIDUsageDescription` es obligatorio para Face ID en iOS.
