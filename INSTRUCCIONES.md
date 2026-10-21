# Control Fiscal V76-Google — corrección de cierre de sesión

## Cambios
- Se cargan explícitamente los módulos nativos Google, Drive y CRUD en `www/index.html` antes de la navegación y del botón de cierre de sesión. En la versión anterior no se cargaba `google-auth-test-v78.js`, por eso faltaba `ControlFiscalV78Logout`.
- Se mantienen vibración, confirmación y retorno a la pantalla de acceso a Google.
- Se propagan los errores del cierre nativo para mostrarlos en Ajustes.
- Se conserva el diseño original, los datos de Drive y la rama `main` sin cambios.

## Compilación
1. Descomprimir el ZIP y subir su **contenido**, incluida `.github/workflows`, a `v78-google-test`.
2. Ejecutar el workflow **Build unsigned iOS IPA**.
3. Descargar IPA e instalar con Sideloadly.
4. Probar inicio de sesión, búsqueda de libro, Ajustes → CERRAR SESIÓN, vibración, confirmación y selección de otra cuenta.

## Advertencia
No se ha validado en iPhone. Esta corrección activa la inicialización real de Google que faltaba en la entrega anterior. Si iOS vuelve a cerrarse, enviar el `.ips` correspondiente. El permiso `drive.file` puede no bastar para determinados libros preexistentes.
