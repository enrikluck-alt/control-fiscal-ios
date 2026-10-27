# Control Fiscal R21 — Administración integrada, ingresos, proyectos y gestor

**Build:** `UI76-20261027-R21` · Basado en R20, manteniendo la interfaz original V76 y sus hojas privadas de Google.

## Cambios

1. **Panel de administración dentro de la app:** desde Ajustes → Sugerencias y errores, aparece «Administración» solamente si el token de Firebase del usuario supera una prueba real de lectura de la colección `control_fiscal_sugerencias`. Se consultan hasta 100 sugerencias, búsqueda, filtros y marcación de leída/respondida. Los mensajes permiten contestar por correo **solo si existe consentimiento del remitente**. No se incrusta ningún UID privilegiado: la autorización real está en las reglas de Firestore publicadas anteriormente.
2. **Ingreso independiente:** corregida la excepción de JavaScript por `actuallyCollected` no definida. Ahora diferencia **importe previsto** de **efectivamente cobrado**, y puede asociarse a un proyecto y a un justificante PDF/JPG/PNG privado de Drive. Se confirman los resultados de Google Sheets y se muestran los errores si falla el guardado.
3. **Facturas de material por proyecto:** nuevo apartado en Facturación. Permite agrupar justificantes de diferentes proveedores mediante una nueva clase de registros, `CF_Material_Facturas`, guardados usando el diario de cambios `CF_Registros_v2` en **el libro particular de cada cuenta**. Los archivos se guardan en **su propio Drive**. No suma las facturas automáticamente al IVA ni al registro de Compras para **evitar doble contabilización**. La compra fiscal se registra aparte desde Compras.
4. **Enviar documentación al gestor:** en Resumen permite marcar las cuatro categorías (**compras, facturas emitidas, ingresos independientes con justificante y facturas de material por proyecto**), delimitar fechas exactas, previsualizar cada documento y desmarcar individualmente. Comprueba que existen archivos, recupera bytes privados de Drive y exige confirmación explícita antes de enviar mediante Gmail API. Máximo 15 archivos y 12 MB por envío. No transfiere la base de datos ni los importes como datos de Firestore.
5. **Tutorial de foco:** marco amarillo con máscara oscura sobre el resto de la pantalla. Los pasos de Ajustes despliegan la categoría correspondiente antes de enfocarla. Pasos adicionales sobre administración, proyectos, ingresos y gestor.

## Cómo probar

- **Firebase:** conserva las reglas R20 que ya publicaste, con tu UID auténtico en `isAdmin()`. No se cambia ninguna regla ni Hosting desde este ZIP. Inicia sesión con la cuenta administradora y abre Ajustes → Sugerencias y errores → Administración. Deberías ver el mismo buzón que en Firebase Hosting, sin abrir navegador. Comprueba también que un usuario NO administrador no ve el botón.
- **Ingreso independiente:** registrar 500 € de ingreso previsto y 100 € de material como pendiente → `0 €` cobrados y beneficio real `-100 €`; cambiar a «Pagado» → `500 €` cobrados y beneficio `400 €`. Si adjuntas comprobante, estará en Drive privado.
- **Proyecto:** crear dos registros «Proyecto A» con dos proveedores y dos facturas; la vista debe mostrar ambas. Cambiar de cuenta no debe mostrar esos documentos.
- **Gestor:** Resumen → intervalo de fechas → marca categorías → Buscar → desmarca un documento → envía únicamente los seleccionados. Necesita Gmail API y permisos autorizados; sin esos permisos muestra error y no promete envío.
- **Tutorial:** Ajustes → Información y herramientas → Tutorial extenso. Comprueba que aparece la categoría de Ajustes abierta y lo demás atenuado.

## Limitaciones y seguridad

- Sin compilación real ni pruebas físicas de iPhone en este entorno. Las pruebas automatizadas comprueban código y casos de datos simulados, **no garantizan** notificaciones, PDF, permisos o navegación nativa.
- El selector admite PDF, PNG y JPG hasta 5 MB. Si la subida a Drive tiene éxito y después falla el guardado en Sheets, puede quedar un archivo sin vincular; la app muestra error en vez de registrar un dato inexistente.
- Los documentos que carezcan de enlace válido a Drive se omiten de la lista de envío; no se exportan documentos sin consentimiento explícito del usuario para enviar.
- El panel integrado muestra como máximo las 100 sugerencias recientes. La web que ya publicaste puede seguir usándose sin cambios.
- El motor no certifica por sí mismo el cumplimiento legal de un sistema de facturación en España. Revisar con un asesor fiscal el tratamiento de los ingresos independientes y justificantes.

## Instalación

1. Sube el contenido **completo** del ZIP, incluida `.github`, a la rama `v78-google-test` de GitHub (no sustituir la principal sin pruebas).
2. Ejecuta `Build unsigned iOS IPA` desde GitHub Actions. Debe mostrar `UI76-20261027-R21`.
3. Instala y comprueba las funciones en el iPhone. Mantén copia de R20 para revertir.
4. No es necesario desplegar otra vez Firebase Hosting: el panel nuevo está en el cliente nativo y reutiliza tus reglas y Authentication actuales.
