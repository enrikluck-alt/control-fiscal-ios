# Control Fiscal R19 — Firebase conectado al proyecto real

## Lo que ya está incorporado

La configuración web pública del proyecto Firebase `control-fiscal-511118` está integrada en `www/cf-firebase-config.js`.
Incluye `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId` y `measurementId`.
No hay claves privadas. La app **no activa Analytics**. El número de proyecto coincide con el de la credencial OAuth iOS preexistente.

El login continúa usando Google Social Login nativo para Drive/Sheets. Para enviar sugerencias, la app obtiene un Google ID token, lo intercambia por un Firebase ID token y escribe a `control_fiscal_sugerencias` mediante Firestore REST. Solo se transmite `uid`, `tipo`, `mensaje`, `estado`, `fecha`; **ninguna factura, compra ni hoja de Google Sheets se copia a Firestore**.

## Obligatorio: comprobar reglas en Firebase Console

En la captura anterior, las reglas de Firestore permitían `tipo` como `sugerencia` o `error` (minúsculas); la app manda `Sugerencia`, `Error` o `Consulta` (mayúsculas). Sin publicar las reglas de `firestore.rules` de este ZIP, el envío fallará con `PERMISSION_DENIED` aunque las credenciales estén bien.

1. Firebase Console → Firestore Database → Reglas.
2. Si las reglas actuales siguen siendo las de la captura anterior y no existen otras colecciones, puedes sustituirlas por `firestore.rules` del ZIP y pulsar **Publicar**.
3. Si has creado otras colecciones, **no sustituyas todas las reglas**; incorpora solo el `match /control_fiscal_sugerencias/{suggestionId}` manteniendo las demás.
4. En Firebase Console → Authentication → Método de inicio de sesión, verifica que **Google esté habilitado**.

## Construir e instalar desde Windows

1. Descomprime el ZIP y sube todos los archivos a GitHub, rama `v78-google-test` (incluida la carpeta oculta `.github`).
2. GitHub → Actions → **Build unsigned iOS IPA** → Run workflow → elige `v78-google-test`.
3. La compilación comprueba expresamente que la configuración Firebase del proyecto real está incorporada y que el paquete iOS lleva el contenido esperado.
4. Descarga el artefacto `ControlFiscal-V76-Google-R19-Firebase-Integrado-IPA` e instala la IPA con tu procedimiento habitual.
5. En Ajustes, comprueba versión `UI76-20261026-R19`.

## Verificar desde el iPhone

1. Inicia sesión con Google y accede al libro fiscal privado como siempre.
2. Abre Ajustes y comprueba que Firebase indica conectado; si no, mira el error al enviar una prueba.
3. Enviar sugerencia, con un texto de entre 12 y 2700 caracteres.
4. En Firebase Console → Authentication → Usuarios debería figurar el usuario usado en la prueba.
5. En Firestore → Datos debería aparecer `control_fiscal_sugerencias` y un documento `cf_...` con `estado = pendiente`, `tipo`, `mensaje` y una fecha del servidor.

**Limitaciones:** no se ha iniciado sesión en la cuenta real de Firebase desde este entorno, no se han publicado reglas por ti y no se ha compilado/probado en un iPhone real. Que pasen pruebas simuladas no demuestra que el servidor aceptará la petición en producción. Si hay un error, copia **el mensaje de error sin tokens ni datos de los usuarios** para diagnosticarlo.

## Protección de datos

Aunque la `apiKey` de Firebase es pública, su protección efectiva depende de las reglas Firestore, los permisos de Authentication y la configuración OAuth. Nunca publiques una cuenta de servicio, un token de acceso o una clave privada en GitHub. Si haces público el repositorio, revisa también las URLs y datos de identidad corporativa.
