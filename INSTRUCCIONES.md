# Control Fiscal V76-Google — integración beta (una sola IPA)

## Qué contiene
- Interfaz HTML y recursos visuales de V76 original.
- Integración de módulos V78: Clientes, Inventario, Compras, Facturas e Ingresos, Agenda y calendario, ajustes.
- Inicio de sesión Google OAuth nativo, comprobación de correo verificado y permisos de Drive.
- Búsqueda / creación de libro propio con siete pestañas. El antiguo Apps Script NO se incluye.
- Menú original V76 tras pulsar «Entrar en Control Fiscal (menú original)» una vez verificados Google y el libro.

## Compilación
1. Descomprimir y subir **el contenido de la raíz del ZIP**, incluida `.github/workflows`, a la rama `v78-google-test`.
2. Ejecutar **Build unsigned iOS IPA** en GitHub Actions sobre esa rama.
3. Descargar la IPA del artefacto y firmarla/instalarla con Sideloadly.
4. Al abrir, elegir cuenta Google, comprobar/buscar o crear libro, y entrar en menú original.
5. Comprobar CRUD de cada módulo con registros de prueba; no introducir datos reales hasta validarlo.

## Estado y límites
Esta entrega es una **integración beta sin prueba real en iPhone**. El ZIP no garantiza que el cierre nativo SIGABRT previamente observado esté resuelto. No se ha podido ejecutar Xcode/iOS en este entorno. Los módulos Google son los de la rama V78; el diseño base es V76.
El alcance `drive.file` puede no permitir descubrir hojas existentes creadas fuera de la aplicación: en tal caso, utilizar el enlace/ID y verificar permisos o crear un libro nuevo desde la app. No compartir tokens ni datos personales en informes.
No tocar `main` ni borrar el libro anterior. Antes de instalar, guardar la IPA estable que funcione.
