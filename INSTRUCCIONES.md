# Control Fiscal V76-Google — Acceso y menú original corregidos

Compilar desde la rama `v78-google-test`, sin modificar `main`. Subir todos los archivos, incluida `.github/workflows`.

- Pantalla inicial: únicamente acceso Google, estado de cuenta y búsqueda/creación del libro.
- Solo tras autenticar y conectar el libro, pulsar «Entrar en Control Fiscal».
- Se conserva el menú V76, la navegación inferior y el botón de cerrar sesión con vibración en Ajustes.
- Tras cerrar sesión, vuelve a la pantalla de acceso.
- Los formularios se ocultan mientras no haya acceso; los módulos Google existentes se mantienen.

No se han probado el inicio de sesión ni los formularios en un iPhone con esta compilación. La cuenta debe tener permisos Drive/Sheets. No activar el Apps Script antiguo.
