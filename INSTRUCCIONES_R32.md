# Control Fiscal R32 — Instalación y comprobación

1. Descomprime el ZIP y sube **todo** su contenido (también `.github`) a la rama `v78-google-test` de tu repositorio de GitHub.
2. En **Actions → Build unsigned iOS IPA**, ejecuta el workflow seleccionando la rama `v78-google-test`. Comprueba que el registro contiene `UI76-20261106-R32` y descarga la IPA resultante. Instálala como has hecho en las revisiones anteriores.
3. En Android, utiliza el workflow **Build Android APK de prueba (Control Fiscal)** de R30/R31 con `v78-google-test`. Su ejecución puede depender todavía de la configuración OAuth Android/SHA-1. No es un AAB firmado de publicación.
4. En Ajustes verifica `UI76-20261106-R32`.

## Cómo probar el ingreso

1. Abre **Facturación → Ingreso independiente**. Ya no aparecen los dos campos agregados «Coste real del material» o «Importe acordado».
2. Pulsa **Añadir material** y escribe, por ejemplo, cantidad 2, coste real unitario 12 € y precio al cliente 30 €. Debe mostrar material a cliente 60 € y coste interno 24 €.
3. Escribe mano de obra 50 € e IVA 21 %. La base debe ser 110 €, IVA 23,10 € y total 133,10 €.
4. Introduce 20 € recibidos. Debe mostrar 113,10 € pendientes; si se reciben 150 €, debe mostrar 16,90 € de excedente y saldo pendiente 0 €.
5. Pulsa **Generar / compartir presupuesto PDF sin guardar**. Se genera un PDF comercial local con la tabla y el IVA, pero **no se guarda en Drive**.
6. Pulsa **Crear presupuesto con este desglose**. Confirma que las líneas están precargadas, completa los datos fiscales y genera o guarda el presupuesto mediante los botones separados.
7. Al editar ingresos previos sin detalle, revisa la línea «PENDIENTE DE DESGLOSAR» y sustitúyela por materiales y mano de obra reales. Hasta entonces no guardes ese ingreso como nuevo desglose.

No se ha cambiado Firebase, Firestore ni la estructura del Google Drive. Si aparecen errores al usar las nuevas funciones en iPhone o Android, adjunta la captura y, si es compilación, el registro del primer paso en rojo.
