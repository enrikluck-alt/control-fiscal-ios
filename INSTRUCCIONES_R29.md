# Instalar Control Fiscal R29

1. Descomprime el ZIP y sube **todos los archivos**, incluida `.github`, a la rama de pruebas `v78-google-test` sustituyendo R28.
2. Ejecuta **GitHub → Actions → Build unsigned iOS IPA → Run workflow** sobre esa rama.
3. Descarga la IPA `ControlFiscal_R29_Resumen_Tema_Claro.ipa` desde el artefacto del workflow e instálala como de costumbre.
4. Comprueba en Ajustes la versión `UI76-20261031-R29`.
5. Ve a **Ajustes → Diseño → Tema claro**, después abre **Resumen** y verifica que son legibles los tres importes de ingresos independientes. Repite en tema oscuro.

No necesitas modificar Firebase, Firestore, Google Drive ni Google Sheets. El importador web de R28 no necesita desplegarse de nuevo por este cambio visual.
