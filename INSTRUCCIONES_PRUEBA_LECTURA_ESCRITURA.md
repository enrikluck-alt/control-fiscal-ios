# Control Fiscal V78 — prueba de lectura/escritura

1. Sube el contenido de este ZIP a la rama `v78-google-test` y compila/instala la IPA como antes.
2. Abre el mismo libro personal existente en Google Drive y copia su enlace.
3. En la aplicación pega el enlace y pulsa **Comprobar libro**.
4. Pulsa **Guardar y leer prueba** una sola vez. La aplicación buscará antes el marcador `CFV78_TEST_RW_V1` en `Configuracion!A:C`. Si ya existe, no escribirá otra fila.
5. Verifica en Google Sheets que hay una fila con el marcador, una fecha de prueba y `LECTURA_OK`.
6. Cierra y vuelve a abrir la aplicación, pega el mismo enlace y pulsa **Verificar lectura**. Debe mostrar la misma fila y valor.

La prueba solo añade una fila identificada en `Configuracion` y no crea nuevos libros ni modifica datos fiscales. Si se recibe un error después de intentar escribir, NO repitas la escritura: usa **Verificar lectura** para comprobar si se guardó.

No introducir datos fiscales reales todavía. El aislamiento entre usuarios sigue pendiente de prueba.
