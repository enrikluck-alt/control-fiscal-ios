# Instalar Control Fiscal R25 en iPhone desde Windows

1. Descomprime `ControlFiscal_R25_Adjuntos_Listados_Facturas.zip`.
2. Sube el **contenido completo** de la carpeta a la rama de GitHub `v78-google-test`, incluyendo `.github/workflows/build-ios.yml` y `contacts-entry.js`. Sustituye los archivos anteriores.
3. Abre **GitHub Actions → Build unsigned iOS IPA → Run workflow** y elige `v78-google-test`.
4. Comprueba que se supera el paso **Install dependencies** y que la validación de empaquetado encuentra `cf-r25-features.js` y el selector de contactos.
5. Descarga la IPA del artefacto `ControlFiscal-R25-Adjuntos-Listados-Facturas-IPA` e instálala siguiendo tu procedimiento habitual de Sideloadly.
6. Comprueba que en Ajustes figure `UI76-20261028-R25`.

## Pruebas recomendadas (con datos de ejemplo)

- En Ingreso independiente pulsa **Contactos del teléfono**, selecciona un contacto con número y verifica que se rellene el teléfono. Si no se abre, indica el mensaje de error visible.
- Registra una compra sin adjunto; abre su ficha desde **Ver todas las compras**, añade PDF/JPG y confirma que se abre correctamente.
- Haz lo mismo con una factura no emitida; no modifiques el importe de una factura ya emitida para comprobar la función.
- En Facturación verifica que el botón «Crear factura» esté junto al formulario y prueba el listado.
- En Resumen, contrasta los gastos de material de ingresos independientes con las cifras de Google Sheets.
- En Ajustes → Datos de facturación configura nombre, NIF, dirección, teléfono e imagen del emisor. Después crea una **factura de prueba sin emitir** usando un cliente guardado y el campo de referencia; comprueba su PDF. Antes de emitir documentos reales comprueba fiscalmente la numeración, IVA y demás requisitos.

No es necesario modificar Firestore o Firebase Hosting para esta revisión.
