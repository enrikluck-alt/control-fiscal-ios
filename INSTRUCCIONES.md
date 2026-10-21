# Control Fiscal V76-Google — Acceso limpio

- Subir el contenido del ZIP a la rama `v78-google-test`, incluida `.github/workflows`. No tocar `main`.
- GitHub Actions: ejecutar `Build unsigned iOS IPA`; instalar IPA con Sideloadly.
- Inicio: solo pantalla de acceso con Google, búsqueda automática de libro y opción de creación.
- Cuando el libro esté conectado, aparece `Entrar en Control Fiscal`.
- En Ajustes, `CERRAR SESIÓN` conserva confirmación y vibración; vuelve al acceso.
- Se oculta el panel de diagnóstico; los módulos Google Sheets permanecen en el proyecto y se cargan únicamente al entrar.
- Se han eliminado de `www` los tres scripts sin referencias: `phase1-v78.js`, `biometric-bridge.js`, `v78-mobile-ui.js`. Los demás son dependencias de módulos o interfaz.
- No borra datos de Google Drive. No reactivar Apps Script antiguo.

**Pendiente de prueba en iPhone:** arranque, autenticación, búsqueda del libro, acceso a módulos y cambio de cuenta.
