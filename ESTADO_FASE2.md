# Control Fiscal V78 — Fase 2: aislamiento preventivo

**No apta para uso real.**

## Cambios aplicados
- Eliminada del frontend la URL de producción del Apps Script V77.
- Bloqueadas las solicitudes por `nativeJsonRequest` hasta que exista backend V78 seguro.
- Aviso permanente de versión en desarrollo.
- Conservada la base del proyecto para la futura integración OAuth.

## Pendiente (no implementado)
- Plugin/SDK nativo de Google Sign-In y flujo de consentimiento con tokens seguros.
- Migración de **todas** las llamadas a Apps Script (incluidas JSONP y fetch directos), sin dejar rutas antiguas.
- Provisionamiento, descubrimiento y operaciones Drive/Sheets con credenciales de cada usuario.
- Revisión de cachés locales y pruebas de seguridad con dos cuentas.

**Atención:** Algunas funciones antiguas todavía intentan guardar localmente o usar JSONP. Esta fase es una base de desarrollo, no una barrera de seguridad completa. No distribuir ni usar con datos fiscales.
