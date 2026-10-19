# V78 — Prueba OAuth iOS 4

1. Subir **el contenido** de este ZIP a la raíz de la rama `v78-google-test`.
2. Ejecutar GitHub Actions → Build unsigned iOS IPA.
3. Instalar la IPA mediante Sideloadly.
4. Pulsar «Probar sesión nueva», seleccionar la cuenta y enviar captura del resultado.

La prueba cierra la sesión de Google de la aplicación antes de volver a iniciar sesión. No elimina archivos del Drive ni modifica registros fiscales. Compara peticiones HTTP de WebView y nativas; no muestra, guarda ni registra tokens.

Si ambos métodos devuelven 401, habrá que inspeccionar la respuesta del SDK nativo y la configuración OAuth; si solo falla uno, el problema apunta al transporte HTTP. No utilizar datos reales todavía.
