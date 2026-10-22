# Control Fiscal V76-Google · R6 — Diseño, selector de cuentas y vibración

**Versión de pruebas:** `UI76-20261022-R6`. Conserva las pantallas y formularios V76; este paquete no ha sido compilado en Xcode ni probado con la cuenta real desde este entorno. **No utilizar todavía para facturas fiscales reales** sin validar números, PDF, IVA y comportamiento multiusuario.

## Compilar en GitHub Actions

1. Descomprime el ZIP y sube **todo su contenido**, incluida `.github/workflows/build-ios.yml`, a la rama `v78-google-test`. No alteres `main`.
2. Ejecuta el workflow **Build unsigned iOS IPA** en esa rama.
3. Descarga **`ControlFiscal-V76-Google-Diseno-Cuenta-R6-IPA`**, que contiene `ControlFiscal_V76_Google_Diseno_Cuenta_R6.ipa`.
4. Instala la IPA con Sideloadly. En la parte inferior de Ajustes debe verse `UI76-20261022-R6`. Si aparece R5, la IPA no es la nueva.

## Cambios de R6

- **Selector de Google:** `INICIAR SESIÓN CON GOOGLE` pide selección de cuenta (`forcePrompt` en iOS). El texto opcional escrito no restringe la cuenta: se acepta la identidad **verificada por Google** y se actualiza el campo con ella. La opción de recordar sesión mantiene la lógica de recuperación existente; la selección interactiva solo se abre cuando pulsas Iniciar sesión.
- **Vibración:** el código anterior enviaba `style: 'Light'`, pero Capacitor Haptics requiere `style: 'LIGHT'`. Se corrige en el cierre de sesión y en los botones de guardar facturación, inventario, facturas, clientes, compras, agenda, cambios e ingresos. Si el teléfono no admite la vibración, el plugin puede resolver sin producirla; el fallback web no garantiza vibrar en iOS.
- **Ajustes → Diseño:** nuevo botón desplegable. Contiene fondo negro/blanco, imagen del menú, colores de compras/facturación/ingresos, rendimiento y Restablecer ajustes. No se cambian sus controles originales.
- **Ajustes → Cuenta:** aparece **al final**, con botón rojo **CERRAR SESIÓN / CAMBIAR DE CUENTA**. Mantiene la confirmación y no elimina el libro personal en Google Drive.
- **Imagen predeterminada:** logotipo *Control Fiscal* incluido como `www/control-fiscal-logo.jpg`, ya no se muestra Chispas Sound como imagen predeterminada del menú. Se conserva cualquier imagen personalizada previamente guardada. También es la imagen alternativa para PDF cuando el usuario no haya elegido una imagen específica de factura. El icono nativo de iOS no se cambia en esta corrección.
- **Limpieza:** la carpeta `www` ya no contiene `chispas-logo.png` ni pantallas de pruebas de V78. El workflow genera el bundle nativo de Google durante la compilación y verifica el logo y el identificador R6 en el contenido copiado a iOS.

## Importante: Google indica «Aplicación no verificada»

**Esa advertencia la emite Google, no Control Fiscal, y no puede desaparecer solamente cambiando el código.** La aplicación solicita permisos de Drive, Google Sheets, Calendar y `gmail.send`. El propietario del proyecto OAuth debe configurar en Google Cloud Console → **Google Auth Platform** la pantalla de consentimiento, el dominio/identidad de la aplicación y los permisos solicitados; añadir usuarios de prueba mientras esté en modo Testing y solicitar **verificación** antes de distribuir públicamente una app con permisos sensibles/restringidos. La aprobación depende de Google. No recomendamos ignorar advertencias de seguridad en cuentas ajenas; para las pruebas, usa únicamente cuentas expresamente autorizadas en el proyecto.

Consulta la documentación oficial: https://support.google.com/cloud/answer/7454865 y https://developers.google.com/identity/protocols/oauth2/production-readiness/overview

## Pruebas recomendadas en el iPhone

1. Inicia sesión introduciendo en el campo de referencia el **correo A**, pero escoge el **correo B** en el selector de Google. **No debe rechazarlo por diferencia de correos** y el libro conectado debe pertenecer al correo B.
2. En Ajustes → Datos de facturación, toca Guardar: comprueba que vibra y guarda en Sheets.
3. En Stock → Nuevo material → Guardar: comprueba vibración y persistencia tras refrescar.
4. En Ajustes despliega Diseño, cambia a blanco, personaliza colores/imagen, elige ahorro de rendimiento y Restablecer; comprueba que todos están agrupados.
5. Al final de Ajustes, abre Cuenta y toca el botón rojo. Debe vibrar, pedir confirmación y regresar al acceso de Google. Comprueba con una **segunda cuenta de prueba** que no se muestran datos locales de la primera.
6. Comprueba que el logotipo predeterminado del menú es Control Fiscal y que un logotipo personalizado no se pierde al actualizar.
7. Prueba una factura **ficticia** y verifica su PDF antes de usar datos reales.

## Validación realizada

Pruebas automatizadas `npm test`, revisión sintáctica de archivos JavaScript y scripts incrustados, estructura HTML y ZIP, y correspondencia de archivos esperados por GitHub Actions. No se ha completado un `xcodebuild` en esta máquina y **la prueba visual automatizada del navegador fue bloqueada por el entorno**: Google OAuth, vibración real e instalación dependen del iPhone.
