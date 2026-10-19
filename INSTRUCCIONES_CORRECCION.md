# Control Fiscal V78 — corrección del registro de SocialLogin

Error anterior: `window.Capacitor.registerPlugin is not a function`.

Causa: el código intentaba registrar el plugin desde el objeto global nativo. El registro se hace ahora mediante importación de `@capgo/capacitor-social-login`, empaquetada por esbuild con `@capacitor/core` real.

## Subida
Subir el contenido de este ZIP a la rama `v78-google-test` (no `main`) y ejecutar el workflow `Build unsigned iOS IPA` en esa rama. Instalar la IPA nueva con Sideloadly.

## Qué prueba
Únicamente Google Sign-In. No utilizar datos fiscales reales. La compilación y el flujo de autenticación aún deben verificarse en el iPhone. Si aparece un error diferente, compartir la captura completa.
