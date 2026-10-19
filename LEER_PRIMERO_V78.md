# Control Fiscal V78 — Primera prueba real de Google Sign-In en iOS

Esta entrega SÍ está destinada a **compilar y probar únicamente el inicio de sesión** con Sideloadly. No permite trabajar con datos fiscales reales: presenta una pantalla de prueba que bloquea la interfaz de la V77. No sustituye el backend de V77 por uno seguro.

## Pasos
1. Crea una **rama de pruebas** en tu repositorio GitHub (no sobrescribas la rama de V77 de producción).
2. Sube el contenido de esta carpeta **a la raíz de la rama** (incluyendo `.github/workflows/build-ios.yml`).
3. GitHub → Actions → Build unsigned iOS IPA → Run workflow, elige la rama de pruebas.
4. Descarga el artefacto IPA del workflow. Instálalo con Sideloadly en el iPhone.
5. Abre la app y pulsa **Iniciar sesión con Google**. Utiliza el Gmail añadido a Usuarios de prueba en Google Cloud.
6. Informa del mensaje mostrado (éxito o error). No compartas tokens ni códigos.

## Advertencias
- El flujo Google Sign-In usa `@capgo/capacitor-social-login` v8, compatible con Capacitor 8; se compila en macOS mediante GitHub Actions.
- El esquema URL inverso del cliente iOS está en Info.plist y AppDelegate pasa el callback a GoogleSignIn.
- La pantalla de prueba solicita `email` y `profile`; **no solicita todavía `drive.file`**, ni verifica el token en servidor, ni concede acceso a la V77.
- Para la versión definitiva habrá que completar consentimiento Drive, gestión de tokens, aislamiento de usuarios, migración de todas las operaciones de la V77 y pruebas de recuperación de datos.
- No uses esta versión para facturas, compras o datos reales.
- Sideloadly puede modificar el identificador de la app al firmar. Si el inicio de sesión falla, hay que comprobar que mantiene `com.chispassound.controlfiscal` y el esquema URL; no compartir credenciales.
