# Control Fiscal V76-Google — R13 · Correo, Agenda, notificaciones y Mapas

**Identificador visible en Ajustes:** `UI76-20261023-R13`  
**Estado:** versión para pruebas en iPhone. Mantiene el diseño V76 y el almacenamiento personal del usuario en Drive/Sheets. El proyecto NO ha sido compilado con Xcode en este entorno.

## Instalación en Windows + GitHub Actions

1. Descomprime el ZIP completo; sube sus archivos a la rama `v78-google-test`. **Incluye la carpeta oculta `.github`**. Mantén `main` intacta.
2. Abre GitHub → Actions → `Build unsigned iOS IPA` → Run workflow y selecciona `v78-google-test`.
3. Descarga **`ControlFiscal-V76-Google-R13-Correo-Agenda-IPA`**, con la IPA `ControlFiscal_V76_Google_R13_Correo_Agenda.ipa`.
4. Instala en iPhone con Sideloadly. En Ajustes debe aparecer `UI76-20261023-R13`.
5. Mantén habilitadas las notificaciones del dispositivo para Control Fiscal, con sonidos y alertas permitidos. Los modos Silencio y Concentración afectan a su presentación.

## Correcciones y pruebas recomendadas

### A. Nuevo evento: ya no esperar a Google Calendar

Al guardar un evento, la app realiza **una única operación de escritura** en Sheets. Cuando Google la confirma, muestra `Evento guardado en Control Fiscal`, actualiza el calendario visual y permite salir de la ventana. A continuación intenta programar el aviso de iOS y, opcionalmente, sincronizar con Google Calendar por separado.

- Prueba creando un evento **ficticio**, a una hora futura, con ubicación. Selecciona `15 minutos antes` o `1 hora antes` y guárdalo.
- Si Google Calendar devuelve error 403, el evento **permanece guardado**. Revisa el estado de sincronización en Agenda; Google Calendar API debe estar habilitada y la cuenta tiene que haber autorizado `calendar.events` en OAuth. Si el permiso cambia, puede hacer falta reconectar la cuenta.
- Si **Sheets** no responde en 25 segundos, se muestra que el guardado *no se ha confirmado*. Evita pulsar repetidamente: abre Agenda y comprueba primero si existe. Se conserva el identificador durante el reintento para reducir duplicados.
- La ventana se sitúa por debajo de la zona segura superior, incluso en iPhone con Dynamic Island. Comprueba que la X puede pulsarse.

### B. Aviso de evento y ruta en Mapas

- Cuando el evento tenga ubicación, el aviso local añade `Toca para ver la ruta`.
- Al pulsar el aviso se abre Control Fiscal / Agenda y se solicita una ruta al destino mediante un enlace de **Apple Maps**. La apertura real del mapa depende del comportamiento de iOS y sus asociaciones de enlaces.
- Estos **son avisos locales** del iPhone; no son Live Activities y no cambian el fondo de pantalla. Se programan para eventos dentro de los próximos 90 días y necesitan permiso de iOS.

### C. Ajustes → Notificaciones y Audio

1. Pulsa `ACTIVAR / ACTUALIZAR RECORDATORIO`. Ahora el resultado se muestra en **Notificaciones** y no solo en Audio.
2. Pulsa `ENVIAR AVISO DE PRUEBA` y verifica el mensaje visible: debe confirmar la programación para dentro de **10 segundos**. En la R13 se solicita que el aviso se muestre incluso **con la app abierta** (`foreground`). Bloquea también el teléfono para probarlo en segundo plano.
3. En Audio elige `Claro`, `Pulso`, `Calma` o `Sonido de iOS`; pulsa `PROBAR EN EL IPHONE`. El resultado aparece tanto en Audio como en Notificaciones. Los tres WAV personalizados siguen empaquetados en la raíz de la `.app` por GitHub Actions.
4. Activa o desactiva `Aviso diario de documentación pendiente` y selecciona su hora. **Solo se agenda el aviso diario si hay compras o facturas con documentación pendiente**. Sin pendientes, el botón explica que no ha programado ese aviso; el aviso de prueba sí debe poder funcionar.
5. Si aparece `plugin de notificaciones no disponible` o `iOS no ha autorizado`, revisa la IPA y los permisos en iPhone → Ajustes → Control Fiscal → Notificaciones. La aplicación no puede saltarse esas restricciones.

### D. Ajustes → Sugerencias y errores

El botón **ENVIAR SUGERENCIA POR CORREO** envía un mensaje dirigido a **electrochispas@outlook.es** mediante la **Gmail API de la cuenta Google activa**, previa confirmación. Si Google acepta, muestra su confirmación. **No adjunta automáticamente datos fiscales**, documentos de Drive ni otras informaciones privadas.

**Requisitos para envío directo:** la cuenta de Google debe disponer de Gmail, el proyecto Google Cloud debe tener **Gmail API habilitada**, los permisos OAuth deben incluir `https://www.googleapis.com/auth/gmail.send`, y la cuenta debe haberlos aceptado. Si Google requiere verificación de la aplicación o devuelve un error 403, no se puede enviar automáticamente desde el cliente: el mensaje permanece editable y se muestra una alternativa `mailto:` para redactarlo. Para un envío completamente automático que también funcione sin Gmail y para cuentas que no han concedido el permiso, se necesita un **backend propio autorizado**, por ejemplo Cloud Run con autenticación, protección contra spam y un proveedor de correo; **no está configurado** en este proyecto.

La recepción en la bandeja del administrador debe comprobarse independientemente, ya que la respuesta Gmail confirma la aceptación de la operación, no su entrega final al destinatario Outlook.

### E. Resumen → Enviar documentación al gestor

La función R12 llamaba a un caso desactivado de Sheets. La R13 recupera los adjuntos privados desde Drive y envía por Gmail los PDF/JPG/PNG que correspondan al periodo elegido, **solo después de confirmar cantidad y correo del gestor**. Límite conservador: **15 documentos, 5 MB por archivo y 12 MB combinados** en cada envío. Con muchos documentos, selecciona menos meses. Si un archivo no está disponible o falla el correo, la app muestra el error y **no declara que se hayan enviado**.

Se requiere el mismo permiso `gmail.send`. No se comparte el enlace del libro completo de Sheets: se envían únicamente los adjuntos seleccionados. Comprueba tanto el resumen de envío como la recepción real en la bandeja del gestor.

## Pruebas realizadas y límites

- **86 pruebas automatizadas locales correctas**: las 81 heredadas (actualizadas solo donde el comportamiento ha cambiado) y 5 nuevas sobre Gmail, adjuntos, guardado de eventos, avisos y rutas.
- HTML y JavaScript comprobados sintácticamente con Node; módulos V76 de Inicio, Agenda, Stock y estilos originales permanecen intactos.
- El workflow comprueba antes y después de sincronizar Capacitor que los archivos de interfaz y plugins están presentes, verifica el módulo de notificaciones y coloca los tres WAV en el bundle principal.
- **Sin compilar Xcode ni probar notificaciones, Gmail, Calendar o Mapas nativos en iPhone.** No hay garantía hasta completar esa validación; el primer error de GitHub Actions debe revisarse antes de instalar.
- **Seguridad fiscal:** mantiene los avisos sobre numeración concurrente y rectificación de facturas emitidas. Usa inicialmente documentos y eventos **de prueba**, nunca facturas fiscales reales para validar la nueva versión.

## Orden de prueba en iPhone

1. Inicia sesión y comprueba `UI76-20261023-R13` en Ajustes.
2. Notificaciones: pulsa **Permitir/Actualizar**, envía una notificación de prueba, prueba los sonidos con la app abierta y bloqueada.
3. Agenda: crea un evento de prueba con ubicación y aviso breve; comprueba que el guardado termina, que puedes pulsar la X y que el aviso abre la ruta.
4. Sugerencias: envía un mensaje corto de prueba y comprueba que llega a `electrochispas@outlook.es`. Si Google devuelve 403, adjunta el **mensaje de error exacto** (sin compartir tokens ni contraseñas).
5. Enviar documentación al gestor: elige un solo PDF de prueba y un destinatario de confianza.
6. Compras, Facturación, Inventario, Documentos, Resumen y Ajustes: verifica que sus pantallas conservan el diseño original de V76.
