# Control Fiscal R31 · Presupuestos y cobros con desglose

## Novedades
- **Ingreso independiente:** permite registrar un cobro superior al acordado. El exceso se muestra por separado; el pendiente nunca es negativo.
- **Materiales por ingreso:** cada línea tiene nombre, cantidad, coste real unitario (privado) y precio de venta unitario. La mano de obra se factura por separado. Con desglose, el coste y el importe acordado se calculan automáticamente. Los ingresos antiguos siguen siendo editables sin desglose.
- **Recordatorios:** WhatsApp y correo muestran material vendido, mano de obra, total, recibido y pendiente. El coste real no se incluye. Gmail adjunta un PDF de desglose si está disponible, solo tras confirmación de envío. Para WhatsApp se puede compartir el PDF por separado usando el botón correspondiente.
- **Presupuestos:** nuevo acceso desde Inicio y Facturación. Emisor desde Ajustes, cliente desde Clientes o introducción manual. Líneas de material, mano de obra e IVA. Generar/Compartir PDF no guarda en Google. **Guardar presupuesto** sí crea el registro privado de Google Sheets y sube su PDF a Google Drive.
- **PDF:** reutiliza la plantilla de factura (logo, datos del emisor/cliente, líneas y totales) pero con título PRESUPUESTO y la aclaración NO ES UNA FACTURA FISCAL.
- **Android:** workflow actualizado para usar android-actions/setup-android@v4, como en el último arreglo.

## Instalación
1. Descomprime el ZIP; sube todos sus archivos a `v78-google-test`, incluida `.github`.
2. iOS: GitHub Actions → **Build unsigned iOS IPA** → ejecuta sobre `v78-google-test` e instala la IPA. Versión `UI76-20261106-R31`.
3. Android: GitHub Actions → **Build Android APK de prueba (Control Fiscal)**, utilizando el Web Client ID. Se mantienen los requisitos de SHA-1 y OAuth Android de R30.
4. No cambies Firestore para estas funciones: presupuestos e ingresos se almacenan en **tu Google Sheets personal**, en el libro activo.
5. Comprueba con un registro de prueba: coste material 50 €, precio de venta 100 €, mano de obra 50 €, acordado 150 € y recibido 160 €: pendiente 0 €, excedente 10 €. El cliente verá 100 € + 50 €, nunca 50 € de coste.
6. Crea un presupuesto y usa **Generar/Compartir PDF sin guardar**; comprueba que no aparece en la lista privada. Pulsa **Guardar presupuesto** y comprueba su aparición en la lista y en Drive.

## Limitaciones y precauciones
- Se ha validado el código con pruebas locales; todavía hay que comprobar el PDF y los botones de compartir en iOS/Android reales.
- No se ha compilado una IPA o APK nativos en este entorno. Ni se han enviado correos ni se ha modificado tu Drive real.
- El presupuesto no sustituye a una factura fiscal, y su IVA es configurable. Confirma el tratamiento fiscal de los ingresos independientes con tu asesor.
- Un excedente se registra como cobro adicional; no supone automáticamente un nuevo concepto facturado. Si se produce por error, registra y documenta el ajuste o devolución correspondiente.
- Para enviar el PDF por WhatsApp se utiliza Compartir PDF; el enlace de WhatsApp abre un mensaje revisable, no adjunta automáticamente archivos.
- El guardado en Sheets se confirma antes de subir el PDF a Drive. Si la subida falla, se informa del guardado parcial y puedes reintentar guardándolo otra vez.
