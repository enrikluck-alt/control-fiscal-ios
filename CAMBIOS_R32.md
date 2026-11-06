# Control Fiscal R32 — Ingresos desglosados y presupuestos

## Cambios respecto a R31

- Ingreso independiente: retiradas las casillas editables generales «Coste real del material» e «Importe acordado a cobrar».
- Desglose por material: descripción, cantidad, coste unitario de compra (privado) y precio unitario al cliente. Puedes agregar y eliminar líneas.
- Al final del desglose: mano de obra y porcentaje de IVA. El IVA comienza en **0 %** en ingresos nuevos para no sumarlo sin que el usuario lo elija; selecciona el porcentaje que corresponda. El presupuesto independiente conserva su campo IVA configurable.
- Totales calculados automáticamente: suma de venta de materiales, mano de obra, base, IVA y total. El coste real interno se calcula desde las líneas, no se introduce como importe global.
- Se mantienen dinero ya recibido, cobro pendiente, parcial y excedentes por pagos superiores al total.
- Desde Ingreso independiente: «Generar / compartir presupuesto PDF sin guardar» crea un PDF local sin registrar presupuesto en Drive o Sheets.
- «Crear presupuesto con este desglose» abre el editor completo de Presupuestos con sus líneas, mano de obra, IVA, fecha, cliente y referencia para completar datos y **decidir** si guardar el documento en Drive.
- El PDF usa el formato de facturación (emisor, cliente, tabla de conceptos, base, IVA y total), identificado claramente como **PRESUPUESTO — NO ES FACTURA FISCAL**. Nunca expone los costes internos.
- Para ingresos antiguos **sin desglose**: muestra una línea provisional claramente marcada, conserva importes originales y exige sustituirla por el detalle correcto antes de volver a guardar o generar presupuesto. No inventa materiales reales.
- Google Sheets valida que los importes globales enviados coincidan con el detalle de materiales, mano de obra e IVA. Los ingresos antiguos conservan compatibilidad.
- Los recordatorios incorporan IVA en el desglose cuando se haya registrado.
- Centrada la actualización en ingresos y presupuestos, sin cambiar las otras pantallas, datos fiscales ni reglas Firestore.

## Pruebas

- 205 pruebas automatizadas de Node.js (200 previas + 5 nuevas) correctas.
- Comprobación sintáctica de archivos JS y scripts embebidos en index.html.
- No se ha ejecutado compilación real con Xcode / Android Gradle ni se ha probado en dispositivo; esos pasos quedan pendientes.
