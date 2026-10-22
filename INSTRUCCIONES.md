# Control Fiscal V76–Google R4 · Resumen, numeración y facturas

**Versión de prueba.** Conserva las pantallas originales V76 y el almacenamiento privado del usuario en Google Drive/Sheets. No utilizar con facturación fiscal real hasta comprobar requisitos normativos y emisión/registro en iPhone.

## Instalar

1. Descomprimir y subir **todo el contenido** del proyecto a la rama `v78-google-test`. Mantener `main` intacta.
2. Incluir los ficheros ocultos `.github/workflows/build-ios.yml` y el nuevo `www/cf-invoice-numbering.js`.
3. Ejecutar `Build unsigned iOS IPA` en GitHub Actions desde `v78-google-test`.
4. Descargar **ControlFiscal-V76-Google-Resumen-PDF-R4-IPA** e instalar la IPA con Sideloadly.
5. En Ajustes al final debe aparecer **UI76-20261022-R4**.

## Novedades

### Resumen

- Gráfico comparativo de **compras** y **facturación** con IVA.
- Al elegir un año se dibujan los 12 meses; al elegir un mes, cuatro tramos (días 1–7, 8–14, 15–21 y 22–fin).
- La diferencia no equivale al beneficio neto. Los borradores nuevos no cuentan como factura emitida.
- Botón que abre el buscador público de licitaciones de la Plataforma de Contratación del Sector Público. **No descarga licitaciones en segundo plano**; la consulta se realiza en el portal oficial.

### Ajustes → Datos de facturación → Opciones de factura

- Editor de hasta 10 segmentos: **texto fijo**, **año automático** y **número incremental**. Debe existir exactamente un segmento incremental.
- Ejemplo: texto fijo `F` + año de 4 cifras + texto fijo `-` + incremento (`3:1`) = **F2026-001**.
- Para `F-2026-001`, establece el texto fijo inicial como `F-`.
- En la pieza incremental el valor `3:1` indica 3 dígitos y número inicial 1. Para continuar un historial que ya llega a 004, selecciona un inicio adecuado y comprueba la vista previa. La app impide algunos duplicados históricos, pero **no reemplaza una verificación fiscal independiente**.
- El incremento sigue **el orden global de emisión** en la pestaña de facturas emitidas del libro, incluso al cambiar de año. **No hay reinicio automático anual** en esta versión.
- Configuración y número anterior quedan asociados a cada factura en el libro personal; no se renumeran facturas emitidas al cambiar opciones.
- **No borrar, reordenar ni modificar manualmente** filas de `CF_Facturas_Emitidas`. La numeración depende de su orden y debe conservarse íntegra.

### Imagen de factura y PDF

- La imagen de factura se configura por separado de la del menú principal, desde el mismo cuadro Opciones de factura. Se aceptan PNG/JPG de hasta 3 MB.
- Se guarda en Google Drive con la cuenta actual y queda registrada en las opciones del libro personal. El PDF utiliza esa imagen; si no existe, usa la del menú o el logotipo incluido.
- Nuevo PDF vectorial A4 siguiendo la plantilla aportada: imagen a la izquierda; fecha/número a la derecha; emisor y cliente a dos columnas; tabla de conceptos; importe base, IVA, descuento y total.
- Los textos y líneas se generan como vectores nítidos. La calidad real de la imagen sigue limitada por su fichero original: una imagen de poca definición no gana detalle al ampliarla.
- La plantilla visual no constituye por sí sola una validación fiscal ni de VERI*FACTU.

### Adaptación a teléfonos/tablets y rendimiento

- Para iPhone pequeño se ajustan márgenes, controles y tamaños mínimos.
- Para iPad se amplía el ancho utilizable, conservando el diseño V76.
- Ajustes → Rendimiento y pantalla permite **Máxima calidad** o **Ahorro de rendimiento**. El modo ahorro reduce efectos de desenfoque, sombras y animaciones, pero **no modifica la resolución física de la pantalla ni el framebuffer nativo**. Las fuentes y los gráficos utilizan el renderizado nativo/vectorial.

## Pruebas locales ejecutadas

- **38 pruebas automatizadas superadas**, incluidas numeración configurable, cambio de serie sin alterar facturas anteriores, prevención de coincidencia con números históricos, facturación/Calendar/Gmail de prueba, separación de cuentas y firmas de la interfaz V76.
- Sintaxis de los JavaScript y de los scripts embebidos en HTML comprobada.
- Estructura del ZIP y ruta de GitHub Actions comprobadas.
- **No** se ha ejecutado una compilación nativa de Xcode, ni una autenticación real en tu iPhone. La búsqueda de licitaciones, el PDF con logos personalizados en otros dispositivos y los layouts de iPad requieren comprobación real.

## Lista de pruebas en iPhone

1. Accede con Google y observa la interfaz original V76. Abre Ajustes y verifica `UI76-20261022-R4`.
2. Entra en Resumen: elige 2026, comprueba los 12 meses y elige un mes para mostrar las semanas. Compara importes con los registros reales de prueba.
3. Pulsa **Buscar licitaciones oficiales** y verifica que abre el portal legítimo.
4. En Ajustes → Opciones de factura configura `F` + año + `-` + incremento. Revisa vista previa y guarda.
5. Sube una imagen propia de factura, vuelve a Facturación y crea una **factura de prueba con datos ficticios**. Comprueba número, formato y PDF.
6. Reabre la factura y verifica que el número no cambia. Si hay facturas antiguas, comprueba que no se han renumerado.
7. En Ajustes selecciona Ahorro de rendimiento y vuelve a Máxima calidad; verifica el uso del iPhone. En iPad comprueba márgenes y columnas.
8. Comprueba que las funciones de R3 (cambio de cuenta, borradores, agenda, inventario, notificaciones, Face ID y compartir PDF) siguen operativas.

## Precauciones sobre facturación

España exige correlación de la numeración dentro de cada serie, documentación completa y otras obligaciones según el caso. Esta versión **no está certificada** conforme a RRSIF/VERI*FACTU ni garantiza ausencia de colisiones ante dos usuarios/dispositivos que emitan simultáneamente con configuraciones diferentes. No emitas facturas reales hasta validar ese punto y el resto de requisitos legales.
