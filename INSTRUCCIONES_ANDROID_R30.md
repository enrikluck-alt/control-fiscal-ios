# Control Fiscal R30 — Android (misma interfaz R29)

## Estado de la entrega

Es el proyecto web/nativo de Control Fiscal R29 con adaptación Android y un workflow independiente `Build Android APK de prueba (Control Fiscal)`. **NO incluye todavía un APK compilado** ni asegura el funcionamiento de Google Login sin credenciales Android. La compilación iOS se mantiene independiente.

Se mantiene `com.chispassound.controlfiscal` como identificador nativo. Los registros continúan en el Google Sheets y Drive personal de cada usuario; Firebase Authentication y sugerencias siguen en el proyecto `control-fiscal-511118`. No se ha desplegado ningún servicio ni cambiado reglas.

## Requisitos Windows

- Node.js 22 o superior (https://nodejs.org/).
- Android Studio compatible con Capacitor 8 (mínimo 2025.2.1), SDK de Android y el JDK que instala Android Studio: https://developer.android.com/studio.
- Cuenta de Google con acceso al proyecto Google Cloud `control-fiscal-511118`.

## Obligatorio: dos clientes OAuth Google del MISMO proyecto

Abre https://console.cloud.google.com/apis/credentials?project=control-fiscal-511118

1. **Cliente de tipo Aplicación web.** Crea uno o reutiliza el apropiado, con los permisos OAuth y la pantalla de consentimiento. Copia su **ID de cliente** que termina en `.apps.googleusercontent.com`. No es la clave API de Firebase ni el ID de iOS.
2. **Cliente de tipo Android.** Debe contener el **Nombre del paquete** `com.chispassound.controlfiscal` y la **huella SHA-1 del certificado que firma el APK que vas a instalar**. El ID de cliente Android no se introduce en la configuración JavaScript; solo se registra en la consola Google.
3. Si la pantalla de consentimiento está en pruebas, añade tu cuenta a los usuarios de prueba. Para Drive/Sheets, Calendar y Gmail hay que revisar y aprobar los permisos OAuth necesarios antes de un lanzamiento público.
4. Si más adelante usas Google Play App Signing, registra también el SHA-1 de Google Play para la firma definitiva, que suele ser distinto de las claves de pruebas y de subida.

### Ruta A — Compilar en Windows (recomendado para las pruebas)

1. Descomprime este ZIP.
2. Ejecuta `PREPARAR_ANDROID_WINDOWS.bat` desde esa carpeta. Introduce el **ID OAuth WEB** cuando lo pida. Instalará dependencias, generará bundles, creará/sincronizará la plataforma Android y abrirá Android Studio.
3. En Android Studio deja terminar Gradle Sync. Comprueba que `android/app/build.gradle` usa el identificador `com.chispassound.controlfiscal`.
4. Abre **Gradle → android → app → Tasks → android → signingReport** o en la terminal dentro de `android` ejecuta en Windows `gradlew.bat signingReport`. Copia el `SHA1` del certificado **debug** y crea la credencial OAuth Android con él.
5. Conecta un móvil Android con depuración USB o inicia un emulador con Google Play. En Android Studio pulsa **Run**. Podrás generar el APK de pruebas desde Build → Build APK(s).
6. Inicia sesión con la cuenta Google autorizada y verifica Drive/Sheets, Firebase, contactos, PDF y notificaciones en ese teléfono. El código de desbloqueo por biometría utiliza el mismo plugin compatible con iOS/Android; en Android puede ser huella o biometría disponible.

### Ruta B — Crear APK mediante GitHub Actions

1. Sube este proyecto a la rama `v78-google-test`, incluyendo `.github`.
2. GitHub → **Actions → Build Android APK de prueba (Control Fiscal) → Run workflow**.
3. Escribe el **ID OAuth WEB** en el parámetro `web_client_id` y lanza la compilación.
4. Descarga el artefacto `ControlFiscal-R30-Android-APK-pruebas`. Contiene `app-debug.apk` y `ANDROID_SHA1_PRUEBAS.txt`.
5. Con el **SHA-1 de ESE archivo**, registra un cliente OAuth Android en Google Cloud con paquete `com.chispassound.controlfiscal`. Después instala ese APK y prueba el login.

**Advertencia:** en GitHub el certificado de depuración puede cambiar en cada ejecución. Si recompilas con otra firma, tendrás que registrar su nuevo SHA-1; para pruebas continuadas, usa Android Studio con su clave local persistente, o configura un certificado de prueba estable de forma segura en GitHub Secrets. No subas claves privadas o archivos de firma a repositorios públicos.

## Google Play a 0,99 € (después de las pruebas)

El APK debug no puede publicarse como versión comercial. Para Google Play se necesita un **Android App Bundle `.aab` de release firmado**, una ficha con políticas y declaraciones de privacidad/datos, configuración de pagos y precio. En 2026 las nuevas apps deben dirigirse a **API 36 o superior**. Verifica `targetSdkVersion` del módulo Android antes de enviar a Play Console. Activa Play App Signing y registra en Google Cloud su SHA-1. También habrá que superar las pruebas que Play Console exija a tu cuenta.

## Qué se ha revisado y qué no

- Añadido `@capacitor/android` en la misma versión 8.5.2 de la base iOS.
- Google Sign-In Android se inicia con `webClientId` de tipo web; iPhone mantiene su `iOSClientId` original. Las sesiones personales siguen asociadas a su propio libro.
- Los bundles PDF, contactos y Google nativo se generan antes de sincronizar la plataforma Android.
- Android solicita los permisos de Internet y notificaciones; el selector de un solo contacto no requiere leer toda la agenda.
- Añadido `tools/patch-android.cjs` para los ajustes del manifiesto y el callback de SocialLogin.
- **No se pudo ejecutar Gradle ni generar un APK dentro de este entorno.** Las pruebas de JavaScript y estructura no sustituyen una compilación Android real.
- El cobro y envío automatizado de WhatsApp no están activados; se mantienen las limitaciones previas de R29.
