# Control Fiscal — iPhone nativo (prueba gratuita)

Esta carpeta contiene la versión web estable de Control Fiscal dentro de un proyecto Capacitor.

## Objetivo

Generar una aplicación iOS sin pagar Apple Developer para probarla en tu propio iPhone. Apple permite el uso de un "Personal Team" para pruebas en dispositivos personales, con perfiles que caducan a los 7 días.

Como usas Windows, el proyecto incluye un workflow de GitHub Actions que construye una IPA **sin firmar** en un runner macOS. En repositorios públicos, los runners estándar de GitHub Actions son gratuitos.

Después puedes descargar la IPA y firmarla/instalarla en tu iPhone con Sideloadly usando una Apple ID gratuita. Sideloadly permite usar una Apple ID gratuita y la firma de una cuenta gratuita dura 7 días.

## Importante

- El repositorio que uses para este build debe ser **público** para aprovechar el uso gratuito de los runners estándar de GitHub Actions.
- El workflow no contiene tu API Key ni credenciales de Apple.
- La app usa la misma conexión a Google Apps Script que Control Fiscal V47.
- No se publica nada en App Store ni TestFlight.

## Flujo

1. Crea un repositorio público nuevo, por ejemplo `control-fiscal-ios`.
2. Sube **todos** los archivos de esta carpeta a la raíz del repositorio.
3. Ve a **Actions** y ejecuta **Build unsigned iOS IPA** con **Run workflow**.
4. Cuando termine, abre la ejecución y descarga el artefacto **ControlFiscal-unsigned-IPA**.
5. Dentro encontrarás `ControlFiscal-unsigned.ipa`.
6. En Windows, abre Sideloadly, conecta el iPhone y arrastra la IPA.
7. Inicia sesión con tu Apple ID gratuita y pulsa Start.

## Capacitor

La versión actual de Capacitor 8 requiere Node.js 22+ y Xcode 26+. El workflow usa `macos-latest` y Node 22.
