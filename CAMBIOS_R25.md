# Control Fiscal R25 — Adjuntos, listados y plantilla de factura

Base: R24. Identidad: `UI76-20261028-R25`.

## Cambios

1. **Contactos del dispositivo:** diagnóstico visible de apertura, cancelación y error; selector nativo de un solo contacto, sin sincronización masiva de la agenda. En iOS prueba primero el selector de ficha; si falla, intenta seleccionar solo el teléfono. Requiere generar e instalar una IPA nueva para comprobar el plugin nativo.
2. **Adjuntos después de crear compras y facturas:** en la ficha del registro puedes subir PDF, JPG o PNG (máximo 5 MB) al Drive privado del usuario. También puedes abrir el justificante existente.
3. **Facturas emitidas:** se puede asociar un PDF original cuando no existe uno vinculado; la app no altera datos, importes ni numeración de facturas emitidas, ni sustituye automáticamente un PDF emitido existente.
4. **Listados completos:** Compras y Facturación enlazan directamente a sus registros completos, con búsqueda y filtro por período. Los ingresos independientes también tienen botón de lista completa.
5. **Resumen:** añade ingresos independientes realmente cobrados, gastos de material asociados e importe pendiente. El gráfico distingue compras, facturas, material independiente e ingresos independientes. Estos importes adicionales no se confunden con las bases e IVA de las facturas.
6. **Facturación:** elimina el gran espacio que quedaba entre «Guardar factura» y «Crear factura».
7. **Factura PDF:** formato A4 replicando la disposición del ejemplo facilitado: logotipo a la izquierda desde Ajustes de facturación, número y fecha a la derecha, emisor y cliente en dos columnas, conceptos bajo encabezado gris y totales inferiores. Añadido campo opcional «Presupuesto / referencia». El logo y datos fiscales del emisor proceden de Ajustes; los datos del destinatario, del cliente seleccionado o completado en el formulario. El PDF nunca copia los datos concretos del documento de ejemplo.

## Alcance y seguridad

- Los registros y documentos siguen alojándose en el Google Drive y Google Sheets **del usuario activo**.
- No cambia Firebase ni las reglas existentes.
- El editor de una factura emitida queda restringido a vincular un PDF faltante; cualquier corrección fiscal posterior debe tramitarse mediante el procedimiento que corresponda, no sobrescribiendo la factura.
- El generador PDF reproduce el formato gráfico de referencia, pero el contenido variable puede requerir páginas adicionales. No implica certificación fiscal RRSIF/VeriFactu.

## Verificación

- 166 pruebas automatizadas locales pasan, incluidas seis nuevas para R25.
- Sintaxis de scripts JS comprobada.
- Revisada visualmente en navegador la disposición vertical del formulario de Facturación de 390 × 844 px, sin acceso a datos reales.
- **Pendiente:** compilación iOS por GitHub Actions y prueba física del selector de contactos, subida de archivos y PDF en iPhone. No se ha probado contra la cuenta real del usuario ni se ha emitido ninguna factura.
