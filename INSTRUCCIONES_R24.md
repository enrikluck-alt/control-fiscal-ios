# Control Fiscal R24 — Instalación y pruebas en iPhone

1. Descomprime el ZIP en Windows. Sube **todos los archivos**, incluida `.github`, a la rama `v78-google-test` de tu repositorio, sustituyendo el contenido de R23.
2. En GitHub: **Actions → Build unsigned iOS IPA → Run workflow**, selecciona `v78-google-test`.
3. Comprueba que concluye sin errores y descarga el artefacto `ControlFiscal-V76-Google-R24-Agenda-Cobros-Tutorial-IPA`.
4. Instala la IPA por el procedimiento que utilizas habitualmente y revisa en Ajustes que aparece la versión **UI76-20261027-R24**.

## Pruebas recomendadas

- **Agenda:** usa una fecha con más de tres operaciones. Al pulsar el día deben verse todos los eventos al principio, después todas las operaciones con sus globos. Pulsa **Añadir evento en este día** y comprueba la fecha del formulario. Comprueba también que los días del mes siguen teniendo todos la misma altura.
- **Ingreso independiente:** crea un ingreso de prueba de 200 € acordados y 50 € recibidos. Verifica que el formulario muestra 150 € pendientes, que el registro se guarda y que sigue mostrando las cantidades al volver a editarlo. No uses un registro fiscal real para la primera prueba.
- **Tutorial:** desde Ajustes reinicia tutorial rápido y después extenso. Comprueba que el resto de la pantalla se oscurece, el recuadro amarillo apunta al control correcto, las tarjetas de explicación no quedan cortadas y las categorías de Ajustes se abren.
- **Fechas:** revisa visualmente en el iPhone vertical y horizontal las fechas de compras, facturas, ingresos independientes, facturas de material, Agenda y envío al gestor. Todas deben caber en su recuadro.
- **Buzón:** comprueba que la opción Administración continúa apareciendo solo con el usuario administrador; no es necesario publicar Firebase Hosting de nuevo.

Si GitHub Actions falla, copia el primer error de la sección marcada en rojo. Si una fecha o tutorial se recorta, manda una captura de esa pantalla en iPhone y la orientación.

Estas pruebas no alteran la estructura de datos ni cambian las reglas de Firestore. Las modificaciones de ingresos reales sí escriben en el Google Sheets del usuario, por lo que debes probar primero con datos ficticios.
