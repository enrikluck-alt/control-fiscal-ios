# Control Fiscal V76-Google — Estable de pruebas · 22/10/2026

## Qué es esta entrega

Versión **para probar todos los menús con un libro de Google de ensayo**. El HTML, las tarjetas, el logotipo, la navegación inferior y las ventanas de V76 se mantienen. No se carga ningún panel de diagnóstico de V78 ni el Apps Script antiguo.

**NO apta todavía para emitir facturas fiscales definitivas:** la emisión con numeración correlativa, PDF automático y correo sigue inhabilitada. El formulario de factura guarda **BORRADORES** únicos y muestra esta situación expresamente. No se incluyen datos del usuario ni credenciales privadas de Google.

## Correcciones respecto al ZIP auditado

1. Se añade automáticamente la hoja `CF_Registros_v2` al conectar el libro. Las altas, ediciones y eliminaciones operativas se escriben como un **historial de revisiones** en esa hoja, sin alterar las filas históricas de `Clientes`, `Compras`, `Facturación`, `Inventario`, `Agenda` ni `Ingresos`. El adaptador presenta la versión combinada a los formularios originales. En Google Sheets las nuevas operaciones deben consultarse en `CF_Registros_v2` (no en las columnas originales de cada pestaña).
2. **Eliminar desde la app oculta un registro pero no borra su fila histórica**. Este comportamiento preserva el documento original y permite auditoría, pero debe tenerse en cuenta si se utiliza la hoja fuera de la aplicación: las fórmulas externas que lean solamente las pestañas originales no verán estas revisiones.
3. Las facturas nuevas pasan a ser **borradores** `BOR-...` con identificadores aleatorios, no números fiscales correlativos. Dos altas simultáneas ya no reciben el mismo supuesto número de factura. El formulario y su mensaje confirman que **NO se ha emitido factura** y que **NO hay PDF**. Los borradores no cuentan como facturas emitidas en el resumen fiscal.
4. Adjuntos PDF/JPG/PNG enviados por MIME `multipart/related` con **bytes reales**, tamaño máximo **5 MB**, en vez de base64 textual incorrecto. Una respuesta de Drive sin éxito impide confirmar la compra. El envío real desde iPhone debe comprobarse.
5. Las peticiones HTTPS a Google usan `fetch` de WKWebView, no llamadas directas `CapacitorHttp.request`, para evitar repetir el componente nativo señalado en los antiguos informes de cierre. La compatibilidad CORS y permisos de Google deben verificarse en el iPhone.
6. Se verifica que **el usuario es propietario** del libro (`ownedByMe`), no solo que tiene acceso a una hoja compartida. No se crea un nuevo libro sin pedir confirmación.
7. En Ajustes, **CERRAR SESIÓN / CAMBIAR DE CUENTA** conserva vibración, confirmación, limpieza de cachés y retorno al acceso; las operaciones pendientes comprueban la identidad de la cuenta al finalizar.
8. Se retiran archivos y funciones de transporte de pruebas que no utiliza la interfaz original.

## Compilar IPA en Windows usando GitHub Actions

1. **Haz copia de seguridad del libro real antes de probar otra compilación.** Para la primera prueba usa preferentemente otra cuenta Google y un libro de ensayo con información ficticia.
2. Descomprime y sube **el contenido** del ZIP a la rama `v78-google-test`, **sin tocar `main`**. Elimina primero de dicha rama cualquier archivo antiguo que no forme parte de este ZIP (excepto tus ficheros independientes deliberados); incluye la carpeta oculta `.github/workflows/`.
3. En GitHub Actions, selecciona **Build unsigned iOS IPA**, rama `v78-google-test`, y ejecuta el workflow.
4. Descarga el artefacto `ControlFiscal-IPA`, extrae `ControlFiscal.ipa` e instálala mediante Sideloadly. La IPA se genera en GitHub, no viene incluida en el ZIP.
5. Comprueba en el log que **12 pruebas** pasan, que se ejecuta `npm run build:google`, que se añade la plataforma iOS y que termina `xcodebuild`.

## Configuración de Google

- OAuth iOS configurado para `com.chispassound.controlfiscal`, con el cliente existente en `oauth-config.json`.
- En Google Cloud deben estar activas **Google Drive API** y **Google Sheets API**; scopes `openid`, `email`, `profile`, `drive.file`, `drive.metadata.readonly`, `spreadsheets`.
- Si el proyecto de Google OAuth continúa en estado *Testing*, añade a la cuenta como usuario de prueba. La publicación para usuarios no probadores puede requerir la verificación OAuth de Google.
- Al iniciar sesión la app consulta el correo verificado y busca libros **propios** con nombre Control Fiscal. Si hay uno lo abre; si hay varios solicita un enlace explícito; si no hay ninguno ofrece crearlo. No se guarda la contraseña ni el token OAuth en almacenamiento local persistente.
- El login no se ejecuta de forma automática al abrir la app para evitar cierres en la inicialización nativa. Selecciona la cuenta con el botón de Google cada vez que sea necesario.

## Protocolo de prueba de menús en iPhone

Prueba con datos ficticios y deja constancia del resultado de cada apartado:

1. Arranque: ¿se ve el acceso Google?, ¿funciona la selección de cuenta?, ¿se abre o crea el libro?, ¿desaparece la pantalla de acceso?
2. Inicio y barra inferior: todas las tarjetas, Inicio, Compras, Facturación, Agenda, Stock y Ajustes deben conservar la apariencia V76.
3. Clientes: crear, reabrir, editar, cerrar/reabrir sesión, eliminar y comprobar que el histórico no desaparece físicamente del libro antiguo.
4. Compras y registros: crear sin adjunto, editar, consultar en Registros, eliminar; después crear otra con un PDF/JPG pequeño y abrirlo en Drive. Si falla, anota el texto de error.
5. Facturación: guardar **solo un borrador**, comprobar número `BOR-...` y que NO se contabiliza como factura emitida. No utilizar para enviar una factura real.
6. Inventario: alta, ajuste +1/-1, modificación, eliminación y reapertura.
7. Agenda: alta, edición, visualización de calendario, eliminación.
8. Ingresos pendientes, proveedores, ajustes fiscales y Resumen: comprobar datos, cambios y totales.
9. Ajustes: vibración, confirmación de cierre de sesión y entrada con otra cuenta B; la cuenta B no debe mostrar registros de A.
10. Regresar a A: deben reaparecer sus datos. Verificar que las pestañas originales de Sheets no se han sobrescrito.

## Limitaciones conocidas que no deben ocultarse

- **No se genera PDF ni se envían facturas por correo.** No utilices la opción de emitir para fines fiscales ni declares los borradores como facturas.
- El diario de revisiones no migra ni modifica el esquema original; cualquier informe externo que lea exclusivamente las antiguas columnas verá la información histórica, no las revisiones del diario. Para uso real habrá que decidir y validar una migración o una vista compatible.
- Adjuntos (máximo 5 MB) y Google OAuth real **pendientes de validación en iOS**. Los tests utilizan servicios simulados; no equivalen a una conexión real a Drive.
- PIN/Face ID y notificaciones nativas requieren la prueba física del iPhone. La app y los plugins se compilan en GitHub Actions, pero no se ha ejecutado Xcode en este entorno.
- El diario de cambios de Sheets es apend-only, pero no un sistema transaccional fiscal. Ediciones simultáneas del **mismo** registro desde dos dispositivos pueden quedar resueltas por la última revisión; no es adecuado todavía para contabilidad concurrente de producción.
- El acceso automático a libros compartidos se impide de manera deliberada: debe ser propietario de su libro.

## Validación local realizada

`npm test` ejecuta **12 pruebas** con Google simulado: CRUD, separación de cuentas, clientes históricos no destructivos, conservación de facturación y agenda, alta solo en el diario, borradores concurrentes e idempotencia local, formato binario de adjuntos y ausencia de transporte HTTP nativo directo. Archivos JavaScript y scripts HTML tienen sintaxis válida y el ZIP se comprueba con CRC.

**Si la IPA no arranca o falla Google OAuth, guarda la captura exacta y el informe `.ips`.** No borres el libro de Google ni desinstales la V76 que funciona sin respaldo.
