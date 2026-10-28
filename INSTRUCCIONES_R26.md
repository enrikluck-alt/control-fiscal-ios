# Control Fiscal R26 — instalación y pruebas

1. Descomprime el ZIP y sube todo a la rama `v78-google-test` (incluyendo `.github`).
2. Ejecuta `Actions → Build unsigned iOS IPA` en GitHub. Debe comprobar `UI76-20261028-R26` y producir `ControlFiscal_R26_Movimientos_Visor_Contactos.ipa`.
3. Instala la IPA como antes; verifica en Ajustes la versión indicada.
4. Abre un ingreso independiente y toca **Contactos del teléfono**. Se debe mostrar el selector de números de iOS o un error visible junto al botón. Prueba Cancelar y elegir un número. Si no abre, envía el mensaje visible y el registro Xcode de la IPA.
5. Abre una compra, una factura y un ingreso independiente existentes: la edición debe comenzar arriba. Los registros sin adjunto no deben mostrar **Ver documento**; los registros con PDF deben abrir un visor con pantalla de "Cargando" hasta dibujar la primera página.
6. En Agenda comprueba el indicador azul de los eventos.
7. En Inicio abre **Todos los movimientos**. Prueba mes actual, año actual, año/mes, fechas personalizadas y selección de categorías. Pulsa las filas para abrir los registros.
8. En Administración, solo para tu cuenta autorizada, puedes activar "Avisar dentro de Control Fiscal cuando lleguen nuevas sugerencias". Necesita que la app esté abierta y conexión a internet; comprueba la recepción con una segunda cuenta y una sugerencia de prueba. No es push de fondo.
9. En Movimientos puedes guardar las preferencias de recordatorios, pero **no hay envíos programados activos**. Mientras tanto, utiliza "Gestionar cobro / enviar recordatorio" en cada registro.

## Pasos pendientes para avisos automáticos reales

**Push iOS con la app cerrada:** registrar la aplicación iOS en Firebase (bundle ID `com.chispassound.controlfiscal`), configurar Apple Developer/APNs, Firebase Messaging y el plugin nativo de push, obtener el token FCM del dispositivo, registrarlo con autenticación Firebase verificando el UID administrador y desplegar la función `cloud-automation/index.js`. El ejemplo de función no incluye ni habilita el registro de tokens ni se despliega solo. Puede exigir un plan de facturación y firma de iOS.

**Correo/WhatsApp periódico:** crear un backend por usuario con autorización para consultar únicamente sus cobros pendientes en sus hojas de Google, guardar credenciales de envío de forma segura, validar consentimiento de destinatarios, configurar las frecuencias elegidas, ejecutar Cloud Scheduler/Tasks y registrar resultados y bajas. WhatsApp Business Platform requiere un remitente empresarial y plantillas aprobadas; no es posible enviar automáticamente desde enlaces `wa.me` cuando el teléfono está cerrado.

No cambies las reglas publicadas de Firestore ni despliegues `cloud-automation/` sin completar la configuración anterior. Nunca pongas claves de cuentas de servicio en la app.
