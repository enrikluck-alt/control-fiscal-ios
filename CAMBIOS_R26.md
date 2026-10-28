# Control Fiscal R26 — 28/10/2026

Base: R25. Mantiene Google Drive/Sheets por usuario, Firebase Authentication y la bandeja de sugerencias.

## Correcciones incluidas
- Selector de teléfono: usa `@capgo/capacitor-contacts` y `pickContact({property: ContactProperty.PhoneNumber})`, sin leer toda la agenda. La pantalla muestra mensajes y errores al lado del botón. Pendiente de comprobar en iPhone real.
- Ventana de edición de compra/factura desde arriba; formulario de ingreso independiente reinicia su desplazamiento al abrirse.
- Botón "Ver documento" oculto cuando no existe enlace HTTPS de Google Drive. En edición de ingreso aparece únicamente si tiene justificante.
- Visor: indicador bloqueante de "Cargando" durante descarga y dibujo de la primera página; PDF.js espera el primer renderizado antes de retirarlo.
- Leyenda azul para los eventos de la Agenda.
- Nuevo "Todos los movimientos" en Inicio: compras, facturas e ingresos independientes. Filtros por categorías, mes actual, año actual, año, año y mes, intervalo inclusivo y búsqueda; cada línea abre su registro original.
- Recordatorios de cobro: pantalla para guardar **preferencias** de correo/WhatsApp Business y periodicidad, por cuenta y dispositivo; **no envía mensajes automáticamente**.
- Sugerencias: avisos opcionales en la app (solo con la app abierta) mediante comprobación del buzón de Firebase con permisos de administrador. La primera consulta crea una línea base y no anuncia elementos históricos. **No es una notificación push de fondo**.

## Pendiente de implementación y verificación
- Push cuando la app está cerrada: necesita app iOS firmada, configuración de APNs/FCM y dispositivo administrador registrado de forma segura. Ejemplo de función de servidor sin desplegar en `cloud-automation/`.
- Envíos recurrentes a clientes: necesita servidor programado, consentimiento de los destinatarios, método de envío de correo autorizado y/o WhatsApp Business Platform con plantillas aprobadas, además de auditoría y controles contra duplicados. Nunca se usan datos fiscales de otra cuenta.
- No se ha compilado la IPA ni probado el selector de contactos o las notificaciones en iPhone real. Los tests locales no lo sustituyen.

Solo se incluyen documentos de la versión R26, no los Markdown de versiones anteriores.
