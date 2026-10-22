# Control Fiscal V76-Google — interfaz ORIGINAL V76 · UI76-20261022-R1

## Qué corrige esta edición

Esta versión parte de **ControlFiscal_V76_Google_Estable_Fix_NPM_8_5_14.zip** (última base reconstruida con OAuth y Google Sheets), conservando en `www/index.html` los estilos originales de V76 y sus formularios originales. No usa ni carga las pantallas de pruebas de V78.

1. **Tras iniciar sesión con Google y localizar o crear el libro personal, selecciona directamente Inicio (V76)**. Si tienes PIN o Face ID activo, primero tendrás que desbloquear. No tendrás que pulsar un botón extra «Entrar en Control Fiscal».
2. Las funciones que crean las ventanas de **Compras, Facturación, Agenda, Stock, Ajustes y la navegación inferior** son las de V76. Se mantiene la adaptación a Google Sheets en las funciones que acceden a datos.
3. El botón de **Cerrar sesión** de Ajustes mantiene la vibración, confirmación y regreso a Google. Se comprueba la separación entre dos cuentas con una prueba automatizada.
4. **Identificación de versión:** en la parte inferior de Ajustes se puede leer `UI76-20261022-R1`.
5. Se realizan comprobaciones contra las firmas del **HTML V76 original**: once bloques de estilos idénticos, secciones de Inicio, Agenda y Stock y once funciones de navegación/formularios sin cambios visuales. Total **18 pruebas** locales superadas (incluidas las pruebas del adaptador de Sheets y autenticación simulada).
6. El workflow borra **en la copia del runner** los restos de V78 que pudieran quedar en `www` de la rama de GitHub y **rechaza cualquier IPA que contenga un `index.html` diferente** del esperado. Esto es importante porque las capturas recibidas mostraban textos que NO están en el ZIP reconstruido anterior.

## Cómo generar la IPA correcta

1. **No toques `main`.** Descomprime este ZIP en tu PC y sube **todos sus archivos y carpetas** a la raíz de la rama `v78-google-test`, incluyendo `.github/workflows/build-ios.yml`, `package.json`, `tests/` y `www/`.
2. El workflow limpia en el runner los restos que no pertenecen a esta edición de `www`. En el repositorio también puedes borrar posteriormente los scripts V78 antiguos, pero no es necesario para el paquete que genera este workflow.
3. En GitHub → **Actions** → **Build unsigned iOS IPA** → **Run workflow** selecciona **`v78-google-test`**. No ejecutes un workflow antiguo o una rama diferente.
4. En el log confirma que aparecen: `INTERFAZ REQUERIDA: UI76-20261022-R1`, `18` pruebas correctas, `Comprobado: app iOS contiene HTML V76 exacto` e `IPA verificada: diseño V76 original`.
5. **Descarga solo el artefacto** `ControlFiscal-V76-UI-Original-20261022-IPA`. Dentro habrá `ControlFiscal_V76_UI_Original_20261022.ipa` y un pequeño fichero de diagnóstico. No reutilices una IPA descargada de una ejecución anterior.
6. Instala esa IPA con Sideloadly. El **identificador de la app no ha cambiado**, así que corresponde a Control Fiscal como antes. No borres tu libro de Drive ni el original V76.
7. Tras entrar con Google, si ya tienes un libro personal propio se abrirá al verificarlo. Si no existe, la app ofrecerá crearlo con confirmación. Si hay varios, deberá seleccionar el libro correcto introduciendo su enlace. Después, si hay PIN/Face ID, desbloquea y comprueba el **menú Inicio original V76**.
8. Abre Ajustes, desplázate hasta el final y confirma que aparece **`UI76-20261022-R1`**. Si no aparece, **no estás probando esta IPA**: comprueba rama y artefacto descargado.

## Qué probar primero

- Inicio: logo, tarjetas originales y barra inferior V76.
- Compras: no debe aparecer «Google Sheets personal» ni «Nueva compra de prueba»; debe estar el formulario original con **Tienda / Proveedor, Concepto, Importe total, IVA, adjunto y Guardar**.
- Facturación: debe mostrar la navegación y formularios originales. **La creación de facturas sigue limitada a borradores**, sin numeración legal ni PDF automático, mientras se completa la emisión fiscal.
- Agenda: el calendario, eventos y formularios originales V76.
- Stock: artículos, cantidades, categorías y formularios V76.
- Ajustes: colores, notificaciones, imagen, cuenta y Cerrar sesión, con la misma estructura V76.
- Cambio de cuenta: cierra sesión, entra con otra y verifica que solo ve los datos de la segunda; al volver a la primera reaparecen sus registros.

## Seguridad de datos y limitaciones

**Para la primera prueba utiliza preferentemente un libro de ensayo y datos ficticios.** El adaptador de Google Sheets mantiene el historial de V76 y almacena nuevas operaciones en la pestaña `CF_Registros_v2`. No sobrescribe las filas históricas, pero otros informes que lean solo las pestañas originales no verán las nuevas revisiones. El bloqueo PIN/Face ID y el inicio nativo de Google requieren verificación real en iPhone.

**No utilizar para emitir facturas fiscales definitivas:** PDF automático, correo y numeración fiscal segura siguen pendientes. Los registros de factura nuevos se guardan como **borradores**, con identificadores únicos. No se prometen como facturas emitidas.

Esta revisión **no está validada en Xcode ni en el iPhone**. Las pruebas locales usan Google simulado y validan la integridad de la interfaz fuente; GitHub Actions realizará la compilación nativa y comprobará la interfaz dentro de la IPA. Si falla un paso, guarda el error exacto.

## Contenido del proyecto

- `www/index.html`: diseño original V76 y lógica de formularios V76.
- `www/chispas-logo.png`: logo original.
- `www/cf-google-auth.js`: cuenta Google, Drive y navegación directa a Inicio.
- `www/cf-google-data.js`: operaciones de Sheets y compatibilidad histórica.
- `www/cf-google-upload.js`: subida de adjuntos de prueba.
- `google-login-entry.js`: entrada para el plugin nativo (el workflow genera `www/google-login.bundle.js`).
- `.github/workflows/build-ios.yml`: compilación y comprobaciones de fuente y contenido de la IPA.
- `tests/`: pruebas de Google simulado y firmas de diseño V76.

**La carpeta `www` del ZIP contiene exclusivamente esos cinco archivos;** el sexto (`google-login.bundle.js`) se genera durante la compilación. Solo hay un archivo `INSTRUCCIONES.md` en el proyecto.
