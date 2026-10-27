# Control Fiscal R24 — Agenda diaria, cobros parciales y tutorial

Versión interna: `UI76-20261027-R24` (base R23 corregida). Conserva el diseño V76, el almacenamiento personal por Google Drive/Sheets, el buzón privado de Firestore y el flujo de compilación en GitHub Actions.

## Cambios

- **Agenda:** al tocar una fecha del calendario se abre un resumen de ese día. Se muestran **todos los eventos primero**, ordenados por hora, y después **todas las compras, facturas e ingresos independientes**, con un globo de color por registro. La vista mensual mantiene las celdas de altura fija y el contador `+N`. En el resumen existe el botón **Añadir evento en este día**; abre el formulario con la fecha ya elegida. Al pulsar un registro se muestra su ficha y se puede abrir su registro original.
- **Ingreso independiente:** el formulario presenta siempre el campo **Dinero ya recibido (€)**. Si se acuerdan 200 € y se introducen 50 €, indica automáticamente **pago parcial** y calcula **150 € pendientes**. También funciona al editar ingresos existentes. Conserva la validación para impedir cobros superiores al importe acordado.
- **Tutorial interactivo:** se creó el elemento de foco que faltaba; ahora cuatro máscaras oscuras rodean la zona señalada y el marco amarillo muestra exactamente el área relacionada. El panel explicativo se coloca arriba o abajo para no taparla, con tamaños adaptables. En Ajustes se abre la categoría que se está explicando antes de enfocarla (incluido Diseño).
- **Selectores de fechas:** se ajustó el contenedor y el ancho de los campos nativos en ingresos independientes, compras/facturación, fechas del gestor, facturas de material y agenda. En pantallas estrechas los campos dobles con fecha pasan a una columna para impedir que sobresalgan.
- **Ejemplos de campos:** se sustituyeron ejemplos de marcas, profesiones y localidades por indicaciones neutrales reutilizables.
- **Empaquetado:** se conservan los scripts de la versión anterior, el plugin de contactos corregido y los tests. Se eliminan los documentos `.md` de cambios de versiones anteriores; solo quedan CAMBIOS_R24.md e INSTRUCCIONES_R24.md en la raíz (y los README necesarios de submódulos).

## Comprobaciones

- 160 pruebas automatizadas locales correctas (`npm test`), incluidas pruebas nuevas de Agenda diaria, pago parcial, máscaras del tutorial, fechas y ejemplos.
- Sintaxis validada de scripts embebidos en el HTML y de `cf-r21-features.js` y `cf-r22-features.js`.
- **Pendiente:** ejecución de la compilación IPA en GitHub Actions y validación visual y táctil en un iPhone real; los selectores de fecha de iOS dependen de WebKit y no pueden darse por verificados sin esa prueba.

No se ha modificado el proyecto Firebase en la nube ni enviado documentación a clientes o al gestor.
