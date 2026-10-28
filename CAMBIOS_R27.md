# Control Fiscal R27 — Correcciones de Contactos, Movimientos y Directorios

## Cambios

- **Selector de contactos del teléfono:** se mantiene el selector de número nativo de `@capgo/capacitor-contacts` y se incorpora `www/cf-r27-contacts-bridge.js` como vía adicional para encontrar el plugin registrado por Capacitor. En vez de sugerir reinstalar la misma IPA, la app mostrará un diagnóstico concreto si falla el registro nativo o la selección. El flujo solo recoge el número que el usuario elige; no lee toda la agenda.
- **Comprobación adicional de GitHub Actions:** tras `npx cap sync ios`, la compilación comprueba que el plugin de contactos figure en el paquete Swift de iOS y que el puente JavaScript se copie a la aplicación. Si no está, la compilación se detiene con un error específico.
- **Movimientos:** casillas independientes y visibles para Compras, Facturas e Ingresos independientes. Corrección de tamaños y distribución móvil.
- **Recordatorios de cobro:** su bloque se oculta al mostrar únicamente Compras; aparece si el filtro incluye Facturas o Ingresos independientes. Las casillas de cobro se muestran por separado y solo para las categorías visibles.
- **Frecuencia:** al seleccionar «Cada X días» aparece un campo numérico editable de 1 a 365; al elegir «Un día del mes» aparece solo su selector de día.
- **Clientes y distribuidores:** en la pantalla de edición de cada contacto existente aparece «ELIMINAR CONTACTO», con confirmación. Se elimina del directorio activo, pero no se alteran facturas, compras, ingresos independientes ni las filas históricas antiguas. Los cambios se guardan como revisiones/tumbas o listas de ocultación en el Google Sheets del usuario.
- **Versión interna:** `UI76-20261028-R27`.

## Verificaciones

- 184 pruebas locales automatizadas superadas; incluyen pruebas de plugin alternativo, avisos al no estar registrado, conmutación de controles y eliminación de terceros con conservación de movimientos.
- Vista de filtros comprobada con Chromium a un ancho de 390 px: tres casillas de 20 × 20 px visibles sin solaparse.
- Se ha comprobado la sintaxis de los JavaScript editados.

## Pendiente de validación nativa

No se ha compilado una IPA ni probado el selector en un iPhone físico desde este entorno. **Una IPA antigua no puede incorporar el cambio**: hay que compilar la versión R27. Si el contacto sigue fallando, copia el nuevo mensaje de error y el paso «Confirmar registro nativo de Contactos iOS» de GitHub Actions.

**Los recordatorios programados no envían WhatsApp ni correos automáticamente.** Solo se guardan preferencias hasta desplegar el backend autorizado y el proveedor de mensajería.
