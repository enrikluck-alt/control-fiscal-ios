# V78 - Recuperar el libro existente

Esta versión NO CREA documentos nuevos. Conserva la autenticación nativa de la versión anterior.

1. Compilar desde la rama `v78-google-test` e instalar la IPA.
2. Abrir en Google Drive el documento existente y copiar su URL (contiene `/spreadsheets/d/ID/edit`).
3. Pegar la URL o ID en la aplicación.
4. Pulsar **Comprobar libro**. Si Sheets API devuelve 404, no pulsar configurar; enviar captura.
5. Solo si la comprobación muestra las pestañas, pulsar **Configurar 7 pestañas**.
6. Repetir comprobación y confirmar que no aparecen duplicados.

La recuperación renombra Hoja 1/Sheet1 a Configuracion si existe y añade las pestañas faltantes. No introduce datos fiscales.
