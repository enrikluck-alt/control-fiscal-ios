# Control Fiscal V76-Google — Cerrar sesión desde Ajustes

Esta versión parte de ControlFiscal_V76_Google_Integracion_Beta.zip y cambia exclusivamente el acceso al cierre de sesión Google.

- Al final de **Ajustes** aparece **CERRAR SESIÓN**.
- El botón solicita confirmación, invoca el cierre nativo de Google y, si se ha limpiado la sesión, recarga la aplicación para mostrar la pantalla de acceso Google y permitir elegir otra cuenta.
- Si falla el cierre nativo, muestra el error y no continúa al cambio de cuenta.
- No elimina archivos de Google Drive ni modifica las hojas fiscales.
- Se retira el antiguo botón de cierre de sesión del bloque de Cuenta, ya que correspondía al sistema anterior de Apps Script.

## Instalación

Sube el contenido del ZIP a la rama `v78-google-test`, incluyendo `.github/workflows`, sin modificar `main`. Ejecuta el workflow de compilación iOS e instala la IPA con Sideloadly.

## Prueba

Abre la app, ve a **Ajustes**, baja al final y pulsa **CERRAR SESIÓN**. Comprueba que aparece la pantalla de Google y que puedes elegir una cuenta diferente. No pruebes con datos fiscales importantes hasta confirmar que el libro mostrado pertenece a la cuenta correcta.

## Limitaciones

Se ha validado sintaxis JavaScript e integridad del ZIP, pero no se ha ejecutado en un iPhone. Esta modificación no valida el funcionamiento del resto de los módulos.
