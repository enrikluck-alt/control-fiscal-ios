# Control Fiscal V76-Google · R3 (UI76-20261022-R3)

**Proyecto para pruebas en iPhone, no certificado para facturación reglamentaria.** Conserva el diseño de V76. Trabajar en la rama **`v78-google-test`**, **sin modificar `main`**. El proyecto contiene un solo `INSTRUCCIONES.md`.

## Compilación

1. Extrae el ZIP y sube **su contenido**, no la carpeta contenedora, a `v78-google-test`. Asegúrate de reemplazar los archivos anteriores, incluida `.github/workflows/build-ios.yml`.
2. En GitHub Actions selecciona `Build unsigned iOS IPA`, rama `v78-google-test`.
3. Descarga el artefacto **`ControlFiscal-V76-Google-Emision-Calendar-R3-IPA`** y la IPA **`ControlFiscal_V76_Google_Emision_Calendar_R3.ipa`**.
4. Instálala en el iPhone mediante Sideloadly. Comprueba en Ajustes, al final, que pone **`UI76-20261022-R3`**. Si pone R2, has instalado una compilación anterior.
5. No utilices información fiscal real en las primeras pruebas. Utiliza una cuenta y libro de ensayo y guarda una copia del libro original.

La compilación requiere conexión a npm y Google. El flujo de GitHub valida archivos de `www`, ejecuta `npm test`, compila el JS de OAuth con esbuild, sincroniza los plugins y comprueba el HTML incluido en la IPA. **Aquí se verificaron 34 pruebas locales, sintaxis y simulación visual de navegación; no se ha compilado ni ejecutado la aplicación de forma nativa en iOS.**

## Nueva funcionalidad

- **V76 intacta:** menú y formularios originales, sin interfaz de diagnóstico de V78.
- **Facturas a medias:** la información y las líneas se mantienen en memoria al pasar de Facturación a Inicio/Compras/Agenda/Stock y volver. No se guarda el formulario inacabado en Drive ni garantiza recuperarlo al cerrar totalmente la app, reiniciar o reinstalar. «Nueva factura» limpia el formulario deliberadamente.
- **Direcciones de España:** ciudad ↔ código postal ↔ provincia mediante el directorio de municipios del INE elaborado por `regi-es/ds-codigos-postales-ine-es`. Requiere Internet. Si hay varios municipios o CP, pide elección en lugar de adivinar. Se puede editar manualmente. Fuente: sitio web del INE, `www.ine.es`.
- **Vibración breve al pulsar:** guardar cliente, borrador, emitir factura, compra, evento, datos de facturación, material, tipo de inventario y cerrar sesión (si está permitido en el dispositivo).
- **Facturación:** se mantienen «Guardar solo borrador» y «Emitir factura y generar PDF». El PDF de emisión contiene número serie `CF`, fecha, emisor, NIF/CIF, dirección, datos del cliente, conceptos, cantidades, precios, descuento, IVA, total y logotipo. Una vez emitida, la factura queda en una pestaña dedicada **`CF_Facturas_Emitidas`** sin sobrescribir el historial; el PDF se sube a Drive y su enlace se almacena en **`CF_Facturas_Documentos`** si ambas operaciones funcionan. Se conserva el PDF del borrador marcado **NO EMITIDA**.
- **Correo del cliente:** checkbox opcional «Enviar copia por correo». Requiere correo válido y confirmación expresa. Gmail solo se considera enviado si la API devuelve identificador. Si falla, se notifica; **la emisión ya registrada NO se revierte**.
- **WhatsApp:** al compartir el PDF, iOS muestra su menú nativo para seleccionar WhatsApp y destinatario. No envía nada automáticamente.
- **Agenda:** guardar evento en Sheets y sincronizar con el Google Calendar principal mediante Calendar API. Cuando falla, el mensaje indica que el evento existe en Sheets pero no se sincronizó, y permite reintentar. La eliminación intenta retirarlo de Calendar antes de eliminarlo de Sheets.
- **Inventario:** tipos personalizados persistidos en Configuracion (`cf_inventory_categories`) del Google Sheets individual.
- **Notificaciones:** tras la primera compra sin adjunto puede solicitar permiso; con permiso concedido, programa aviso local diario a la hora elegida, cancelándolo cuando no quedan compras sin justificante. Es una notificación local de iOS: no sirve como garantía de entrega diaria si el sistema la limita.
- **Horas:** inputs de recordatorio, inicio y final de eventos con tipografía aumentada; el selector nativo de hora lo controla iOS.
- **Seguridad:** mismo inicio con Google, recuperar libro propio, mantenimiento de sesión opcional y Face ID/PIN al volver a primer plano.

## Configuración de Google Cloud para esta versión

**IMPORTANTE: nuevos permisos OAuth.** La app solicita, además de los permisos ya usados de Google Drive/Sheets:

- `https://www.googleapis.com/auth/calendar.events`
- `https://www.googleapis.com/auth/gmail.send`

Habilita **Google Calendar API** y **Gmail API** en el mismo proyecto de Google Cloud que usa el cliente OAuth iOS. Configura pantalla de consentimiento, scopes y usuarios de prueba si la aplicación sigue en modo Testing. Google podría exigir verificación adicional antes de permitir a usuarios fuera de la lista de pruebas. Si OAuth rechaza un permiso, el inicio de sesión completo podría fallar hasta configurar el proyecto. **No introduzcas contraseñas de Gmail en la app.**

## Orden recomendado para la comprobación en el iPhone

1. Comprueba la marca R3 y el diseño V76; inicia sesión, elige libro y desbloquea con Face ID/PIN.
2. Crea una **factura ficticia** con tres conceptos. Cambia a Inicio, Compras y vuelve: cantidades, precios y datos del cliente deben conservarse. Comprueba «Nueva factura» después de emitir.
3. Escribe CP `02001` y verifica provincia Albacete. Escribe otra ciudad con varios CP y comprueba que te pide elegir sin asignar uno incorrecto.
4. Guarda cliente, compra sin adjunto, material y tipo nuevo. Comprueba vibración y que el tipo se conserva tras volver a entrar.
5. Con permiso de notificaciones, comprueba en Ajustes la hora diaria. No presupongas que el aviso ya se entregó antes de llegar la hora configurada.
6. Crea un evento con hora y revisa su presencia en Google Calendar. Edita y elimina otro evento de ensayo.
7. Guarda primero **borrador** y prueba su PDF. Después, con **otra factura ficticia**, prueba **Emitir factura** y abre el PDF; verifica el logo, datos, artículo e IVA. Comprueba la pestaña `CF_Facturas_Emitidas`. **No pulses emitir repetidamente si Google o Drive están fallando**: puede existir una emisión aunque el PDF o la respuesta fallaran.
8. Prueba el checkbox de correo solo con un correo tuyo de prueba. Comprueba el Gmail del emisor y el mensaje en la bandeja de destino. Comparte otra copia por WhatsApp usando un contacto de prueba.
9. Cierra sesión y entra con otra cuenta; confirma que no muestra la información de la primera. Verifica Face ID al salir y volver de la app.

## Limitaciones y advertencia de facturación

- **La generación de una factura numerada y su PDF no equivale a certificación fiscal ni a software conforme a RRSIF/VERI*FACTU.** No se han implementado mecanismos legales como encadenamiento/huella de registros, declaraciones responsables, gestión fiscal de rectificativas y todos los supuestos de IVA/retenciones. Consulta a tu asesor fiscal antes de emitir facturas reales o distribuir esta versión.
- La numeración `CF-000001...` se deriva de las posiciones de filas **añadidas** a una pestaña exclusiva. No borres, muevas ni ordenes esa pestaña directamente y no la uses como sistema certificado de facturación. Conserva una copia de seguridad. Si la subida del PDF o correo falla, la factura podría constar registrada sin adjunto o sin envío.
- No se garantizan compatibilidad del nuevo sistema con plantillas PDF históricas, emisiones entre varios dispositivos simultáneos, tamaños de adjunto superiores a 5 MB, ni la entrega de notificaciones a hora exacta. La autocompletación postal requiere red y depende de disponibilidad de fuente de datos externa.
- No se ha realizado compilación de Xcode ni acceso real con Google, Gmail y Calendar en este entorno. Las 34 pruebas incluidas simulan las API y comprueban la lógica, pero **no sustituyen las pruebas de la IPA**.

En caso de error, envía **captura + función + mensaje exacto** y comprueba la marca `UI76-20261022-R3` antes de reportarlo.
