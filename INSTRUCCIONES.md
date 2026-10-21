# Control Fiscal V76-Google — cierre de sesión corregido

Esta revisión corrige la vuelta a la pantalla Google después de confirmar «CERRAR SESIÓN» en Ajustes. Conserva la vibración y el cierre nativo Google, pero ya no recarga la página (lo que podía devolver al menú fiscal en vez de mostrar el acceso).

Al salir, el panel de Google vuelve a su contenedor de inicio, se ocultan las páginas fiscales y se elimina la referencia local al libro anterior. Para entrar con otra cuenta, pulsa «Iniciar sesión / elegir cuenta», autoriza y busca o crea el libro de esa cuenta. No se borran hojas ni documentos de Drive.

Subir a la rama `v78-google-test` con la carpeta `.github` y compilar desde GitHub Actions. No tocar `main`.

Prueba pendiente en iPhone. Si el plugin nativo falla al cerrar sesión, aparecerá un error bajo el botón; no se simula una salida exitosa.
