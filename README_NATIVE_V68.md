# Control Fiscal Native V68

Esta versión corrige y endurece el empaquetado de la IPA.

Importante: el workflow ahora muestra el tamaño real de `App.app` y de la IPA, comprueba que `Info.plist` y el ejecutable existen, valida la IPA con `unzip -t` y falla si la IPA pesa menos de 1 MB. El artefacto descargable se llama `ControlFiscal-IPA` y contiene `ControlFiscal.ipa` y `IPA_SIZE.txt`.

Estructura esperada del repositorio:
- `.github/workflows/build-ios.yml`
- `www/index.html`
- `www/chispas-logo.png`
- `resources/`
- `package.json`
- `capacitor.config.json`

No subas `ios/`; el workflow lo genera con `npx cap add ios`.
