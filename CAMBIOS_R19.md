# Control Fiscal R19 — Configuración Firebase integrada

- Proyecto Firebase real incorporado en `www/cf-firebase-config.js` con todas las propiedades públicas proporcionadas por el propietario.
- Conservados Google OAuth nativo, Drive/Sheets privados, interfaz, Agenda, notificaciones, PDFs, tutorial e idiomas de R18.
- No se activa Analytics ni se instalan SDKs extra para esta integración: el puente existente usa REST de Firebase Authentication y Firestore.
- Marcador de versión: `UI76-20261026-R19`.
- El workflow GitHub Actions valida que la configuración no esté vacía y que el proyecto y appId coincidan, sin imprimir la API Key.
- Archivo `firestore.rules` listo para publicar: reglas de solo creación para sugerencias.
- Añadidas pruebas específicas de configuración pública, entorno de Authentication y escritura Firestore simulada.

*Importante: La configuración local se ha completado; activar las reglas finales del proyecto Firebase y probar un envío real sigue requiriendo actuación en Firebase Console y en el iPhone.*
