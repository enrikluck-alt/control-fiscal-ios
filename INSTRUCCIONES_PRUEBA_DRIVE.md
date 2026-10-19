# Control Fiscal V78 — Prueba real de Drive (NO producción)

Sube el contenido de esta carpeta a la rama `v78-google-test`, reemplazando archivos anteriores. No subas IPA al directorio `www`. Ejecuta el workflow de Actions y descarga la IPA generada. Instala con Sideloadly.

Al pulsar Iniciar sesión, se solicitará `drive.file`, se intentará buscar un libro V78 y, si no existe, se creará uno en el Drive de la cuenta autorizada. Pulsa de nuevo para verificar que recupera el mismo ID.

**NO USAR PARA DATOS REALES.** Esta versión solo prueba Google OAuth, Drive y Sheets; la V77 fiscal permanece bloqueada. El alcance `drive.file` puede requerir comprobaciones adicionales de descubrimiento tras reinstalación.

Si aparece error, comparte el texto SIN tokens ni credenciales. No pulses repetidamente crear si indica que se creó un libro pero falló su etiquetado.
