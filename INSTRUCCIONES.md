# Control Fiscal V76-Google — R10 (Documentos y mejoras de interfaz)

**Identificador:** `UI76-20261023-R10` · **Proyecto:** `1.16.0`.

## Instalación

1. Descomprime **todo el ZIP** en la rama `v78-google-test` del repositorio de GitHub, sustituyendo los archivos anteriores, también `.github/workflows/build-ios.yml`. **No modifiques `main`.**
2. Ejecuta GitHub Actions → **Build unsigned iOS IPA**, seleccionando esa misma rama.
3. Descarga el artefacto **`ControlFiscal-V76-Google-R10-Documentos-IPA`** y dentro la IPA **`ControlFiscal_V76_Google_R10_Documentos.ipa`**.
4. Firma e instala con Sideloadly. En Ajustes comprueba la versión `UI76-20261023-R10`.
5. Prueba **solo con datos ficticios** hasta validar el acceso Google, emisión fiscal, integración con Drive y notificaciones en el iPhone.

## R10: qué cambia

### 1. Nueva ventana «Documentos»

Desde el icono **DOCUMENTOS** del menú Inicio entra en tu archivador personal. Pulsa **Crear carpeta** para añadir, por ejemplo, «Certificados». Entra en esa carpeta y crea la subcarpeta «Certificados de altavoces»; desde ella pulsa **Subir PDF o imagen** para añadir archivos PDF/JPG/PNG de hasta **5 MB por archivo**.

Cada archivo se guarda **privado en el Drive del usuario conectado**. Control Fiscal guarda su nombre, jerarquía y enlace autorizado en el diario de cambios del mismo libro (`CF_Registros_v2`). Los archivos aparecen en una lista por carpetas y se abren con el visor interno. Si se elimina un archivo del listado, **se elimina su referencia, no el archivo original de Drive**, para evitar pérdida accidental. No se pueden eliminar carpetas que contengan elementos.

### 2. Facturas emitidas: retirar y restaurar sin destruir el justificante

En **Inicio → Ver todos → Facturación**, abre una factura marcada como **emitida**. Ahora aparece **«Retirar factura de la lista»**. Tras confirmar, ya no sale en las listas ordinarias, pero se conserva su número, PDF, fila original y trazabilidad en el Drive. **Sigue computando en el resumen fiscal**: ocultar no equivale a anular una factura legalmente emitida.

Para recuperarla entra en **Ver todos**, activa **«Mostrar facturas emitidas retiradas del listado»**, abre la factura y pulsa **«Restaurar factura en la lista»**. Esta operación reversible se guarda en una hoja nueva `CF_Facturas_Archivadas`. La factura emitida original permanece inalterada en `CF_Facturas_Emitidas`.

**Importante:** esta función NO rectifica facturas; la rectificación, cuando proceda, necesita su propio flujo fiscal, aún no implementado. Para documentos reales, consulta a tu asesoría antes de ocultar/anular/rectificar registros.

### 3. Inventario sin categorías iniciales de ejemplo

Las cuentas nuevas no recibirán tipos de material preestablecidos. Para crear el primer artículo pulsa Inventario → «+» → **CREAR TIPO** y escribe, por ejemplo, «Televisores» o «Altavoces». Aparecerá un botón con un icono aproximado (📺/🔊 u otro según el nombre), y al pulsarlo verás los artículos de ese tipo. Se mantienen las categorías y los artículos que el usuario **ya tenía** guardados en su Google Sheets. Las categorías locales nuevas se almacenan por libro personal, no se comparten por error entre distintas cuentas.

### 4. Fotografías: Openverse, Google Imágenes y carga privada

**Buscar fotos sugeridas** utiliza Openverse (catálogo de diversas fuentes con datos de licencia) y permite seleccionar una miniatura. **Buscar modelo en Google Imágenes** abre Google para localizar el modelo exacto. Si eliges una foto, puedes guardarla en Fotos/Archivos y después subirla desde el formulario a tu Drive; también puedes pegar una **URL HTTPS directa** en «Usar esta foto», revisando licencia, modelo exacto y que el enlace no caduque. Las miniaturas de terceras páginas pueden bloquear cargas directas.

**No se incluye una galería automática de resultados de Google Imágenes dentro de Control Fiscal**: la API oficial de búsqueda de imágenes de Google requiere un servicio autorizado y su antigua Custom Search JSON API está cerrada a nuevos clientes. No se ha introducido scraping ni una clave secreta en la app.

### 5. Ajustes por pantallas independientes

Ajustes ahora presenta una lista de opciones. Al pulsar **Notificaciones, Diseño, Clientes y distribuidores, Datos de facturación, Opciones de factura, Información, Sugerencias o Cuenta**, **solo se ve el contenido de esa sección**. La flecha superior vuelve al índice de Ajustes; una segunda pulsación vuelve a Inicio. Dentro de Diseño siguen estando tema blanco/negro, imagen del menú, colores, rendimiento y restablecimiento.

### 6. Tutorial mejorado

El tutorial tiene un fondo mucho más transparente y resalta el campo correspondiente. Incluye un paso «Documentos» y puede volver a iniciarse desde Ajustes → Información y herramientas. Puede que algunas secciones requieran desplazarse por la pantalla para ver todo el contenido.

### 7. Agenda y Live Activities

Se mantienen los avisos de eventos por **notificaciones locales de iOS** (desde 2 días antes hasta el comienzo), con fecha, hora y ubicación. Para habilitar la sincronización con Google Calendar asegúrate de **volver a autorizar la cuenta con el alcance `calendar.events`**, además de habilitar Calendar API en el proyecto correcto de Google Cloud; activar solamente la API no garantiza que un token anterior tenga el nuevo permiso.

**Live Activity aún NO está incluida funcionalmente en esta IPA**. Para visualizar un evento antes/durante su celebración en pantalla bloqueada y Dynamic Island hay que construir, integrar y firmar una **Widget Extension nativa** con ActivityKit/WidgetKit en el proyecto iOS; Capacitor ni las notificaciones habituales crean esa extensión por sí solos. Añadirla sin validación de Xcode/sideloading pondría en riesgo la compilación que ya te funciona. No es posible establecer el fondo de pantalla del usuario automáticamente. Esta función queda pendiente de una compilación nativa específica.

## Pruebas realizadas

- **70 pruebas automatizadas** con Node: integridad de datos de V76 y R7–R9, CRUD de documentos y subcarpetas, separación de cuentas y retirada/restauración de facturas sin borrar ni renumerar.
- Todos los scripts JS, incluidos los bloques del HTML, pasan `node --check`.
- Estructura del ZIP y referencias de archivos comprobadas.
- **Limitación:** no se pudo navegar con Chromium en este entorno (bloqueo `ERR_BLOCKED_BY_ADMINISTRATOR`); la visualización final y las funciones nativas deberán probarse en el iPhone. No se ha ejecutado una compilación Xcode completa aquí.

## Orden de pruebas sugerido

1. Inicia Google, desbloquea y comprueba los menús.
2. Ajustes → Diseño y flecha Atrás; comprueba que otras secciones no se mezclan.
3. Inventario nuevo: crea «Altavoces», añade un artículo, cambia de categoría y vuelve. Prueba la carga de una imagen propia.
4. Documentos: crea una carpeta, dentro una subcarpeta, sube un PDF y comprueba la previsualización; elimina solo una referencia y confirma que el PDF original sigue en Drive.
5. Con factura **ficticia** previamente emitida: «Retirar de lista» y luego «Mostrar retiradas» → «Restaurar». Comprueba que el resumen no cambia.
6. Agenda: recordatorio local 1 hora antes. Comprueba por separado Calendar, que requiere autorización OAuth real.
7. Tutorial desde Ajustes: revisa contraste, fondo y resaltados.

## Seguridad y limitaciones

El administrador no recibe acceso a facturas, compras, archivos ni Google Sheets privados del usuario. El proyecto no incluye un panel central de cuentas. La numeración y el PDF generado no acreditan por sí solos cumplimiento de Veri*Factu o de todos los requisitos de facturación electrónica.
