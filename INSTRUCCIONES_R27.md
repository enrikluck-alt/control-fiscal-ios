# Instalar Control Fiscal R27 (Windows + GitHub Actions)

1. Descomprime todo el ZIP R27, incluyendo la carpeta oculta `.github`.
2. Sube el contenido a la rama de pruebas `v78-google-test` del repositorio de Control Fiscal, reemplazando los archivos anteriores.
3. En GitHub → Actions → **Build unsigned iOS IPA** → **Run workflow**, selecciona la rama `v78-google-test`.
4. Revisa que terminen correctamente **Install dependencies**, **Build native contact picker bundle**, **Sync Capacitor** y **Confirmar registro nativo de Contactos iOS**. Un error en cualquiera de ellos debe revisarse antes de instalar nada.
5. Descarga el artefacto `ControlFiscal-R27-Contactos-Filtros-Directorios-IPA` e instala la nueva IPA en tu iPhone mediante tu método habitual. Confirma en Ajustes la versión `UI76-20261028-R27`.
6. Prueba Ingreso independiente → Contactos del teléfono. Si no se abre, el aviso debe indicar si falta el plugin nativo o si ha habido un error de iOS. No hay que dar por corregido el selector hasta realizar esta prueba.
7. Abre **Movimientos**: deben aparecer Compras, Facturas e Ingresos independientes como tres opciones distintas. Marca solo Compras y verifica que desaparece la programación de recordatorios. Marca Facturas y comprueba que reaparece.
8. Elige «Cada X días», pon por ejemplo `5` en el campo que aparece, y guarda. Ese ajuste **no activa envíos automáticos**.
9. Desde Ajustes → Mis clientes / Mis distribuidores, abre un contacto de prueba y pulsa «ELIMINAR CONTACTO». Después busca una compra o factura antigua vinculada: debe conservar su nombre.

No hace falta modificar las reglas de Firestore ni volver a publicar Firebase Hosting para instalar R27.

**Seguridad:** realiza las pruebas de eliminación con contactos de prueba. El borrado modifica el directorio de ese Google Sheets y exige confirmación.
