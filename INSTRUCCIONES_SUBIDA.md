# Control Fiscal V78 — Proyecto completo para prueba de Google Sign-In

Este ZIP sustituye a las fases anteriores para la rama de pruebas `v78-google-test`.

## Subida
1. Descomprime el ZIP.
2. En GitHub selecciona `v78-google-test`.
3. Sube el contenido a la raíz del repositorio, conservando `.github/workflows/build-ios.yml`.
4. Comprueba que se han actualizado `package.json` y `.github/workflows/build-ios.yml`.
5. Ejecuta Actions > Build unsigned iOS IPA, rama `v78-google-test`.
6. Si compila, instala la IPA nueva con Sideloadly y prueba Google Sign-In.

**Esta es una prueba de autenticación, NO una aplicación apta para datos fiscales reales.**

El bundle se genera desde `google-login-entry.js` en la raíz. `npm run build:google` lo empaqueta como `www/google-login.bundle.js` antes de sincronizar Capacitor. La compilación se detiene si el bundle no se genera.

Si la autenticación sigue fallando, envía el error exacto. No se ha verificado esta IPA en un iPhone.
