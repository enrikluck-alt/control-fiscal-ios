# CONTROL FISCAL V76-GOOGLE · R8 — INSTRUCCIONES Y PRUEBAS

Versión identificable en Ajustes: **UI76-20261023-R8**. Este proyecto conserva las ventanas y la barra inferior originales de V76. Es una **compilación candidata a pruebas**: no se ha ejecutado Xcode ni autenticación real en iPhone desde el entorno de desarrollo. No utilizar para emitir documentación fiscal definitiva sin comprobar toda la operativa y requisitos legales vigentes.

## 1. Instalar y compilar

1. Extraer el contenido de este ZIP y subir **los archivos de su raíz** a la rama `v78-google-test` de GitHub, incluida la carpeta oculta `.github/`. No subir la carpeta contenedora y no modificar `main`.
2. En GitHub → Actions → **Build unsigned iOS IPA**, seleccionar `v78-google-test` y pulsar **Run workflow**.
3. El workflow instalará dependencias, ejecutará `npm test`, creará el paquete nativo de Google con `npm run build:google`, añadirá iOS, sincronizará Capacitor y compilará.
4. Descargar el artefacto **ControlFiscal-V76-Google-R8-Integridad-Guia-IPA**. La IPA se llama `ControlFiscal_V76_Google_R8_Integridad_Guia.ipa`.
5. Instalar mediante Sideloadly y comprobar `UI76-20261023-R8` al final de Ajustes. Si aparece otra versión, revisar rama/commit/artefacto e instalación anterior.

**No incluir** en el repositorio archivos `node_modules`, pruebas de navegador locales ni un `www/google-login.bundle.js` fabricado; el workflow genera el JS real de Google antes de compilar. En el proyecto `www` solo hay los módulos utilizados por la aplicación.

## 2. Inicio de sesión y seguridad

- Usar el selector oficial de Google. El correo opcional **no fija** ni limita la cuenta elegida en la ventana oficial; manda la identidad verificada por Google.
- «Mantener sesión abierta» intenta recuperar credenciales cuando se abre la app. Si Google no devuelve una autorización válida, se solicitará iniciar sesión otra vez; no implica que se haya borrado el libro del usuario.
- Si el libro existe y se puede localizar con los permisos dados, se abre ese libro. Si no existe, se ofrece crearlo tras confirmación.
- Face ID o PIN protegen el acceso al volver de segundo plano. Probar en dispositivo real.
- Cerrar sesión desde el botón rojo de Ajustes; comprobar que vuelve al acceso y que una cuenta B **no ve** los registros de la cuenta A.
- Advertencias de Google como «Aplicación no verificada» se resuelven mediante la configuración/verificación del proyecto OAuth, no cambiando el HTML. Google Drive, Sheets, Calendar y Gmail pueden exigir permisos y revisión de Google Cloud.

## 3. Guardar y eliminar compras y facturas

- La vibración al **pulsar** un botón indica pulsación, **no guardado correcto**. Tras el OK real de Google, la aplicación muestra un aviso breve con vibración de confirmación más larga.
- **Compras**: después de confirmar el registro, se borran distribuidor, concepto, importes y los campos introducidos para evitar una segunda compra accidental. Si falla la red, el formulario se conserva.
- Un registro de compra incluye un identificador de petición y el servidor evita duplicar un alta repetida con ese mismo identificador. Es una protección contra reintentos, no un sistema global de transacciones simultáneas.
- **Borradores y nuevas facturas**: al confirmar guardado/emisión, el formulario se limpia. Si el guardado falla, se conserva. Las facturas **emitidas** no se borran mediante la acción ordinaria de eliminar; cualquier corrección fiscal requiere un procedimiento adecuado.
- El borrado de registros utiliza una clave estable. Si una operación ya está eliminada, no intenta eliminar otra fila. Las filas históricas de V76 se mantienen intactas y los cambios se reflejan en `CF_Registros_v2`.
- Si se recibe 401, la aplicación intenta renovar una vez el token con el plugin oficial y reintentar. Si Google no concede renovación, indica reconectar sin borrar los datos de Drive. **Probar esta situación tras dejar la app sin usar durante varias horas**.
- Los mensajes para el usuario no deben mostrar los detalles de Google Sheets; los errores pueden indicar el servicio o autorización cuando sea necesario para el diagnóstico.

## 4. Ajustes, clientes y distribuidores

- «Mis clientes» y «Mis distribuidores» abren ventanas independientes con buscador, listado y botón Editar por fila.
- Escribir una parte del nombre del cliente en Facturación muestra coincidencias. Elegir una para rellenar sus datos guardados. En Compras se hace lo mismo con los distribuidores.
- «Tiendas» y «Proveedores» históricos se agrupan bajo **Distribuidores**. La compatibilidad conserva las filas anteriores.
- «Diseño» agrupa fondo, logotipo del menú, colores, rendimiento y restablecer. Cuenta y su botón rojo Cerrar sesión están al final.

## 5. Agenda, Google Calendar y notificaciones

- Al crear un evento, se guarda en el libro personal y la aplicación intenta sincronizarlo con Google Calendar si el permiso está autorizado; un fallo en Calendar se comunica por separado.
- En iOS, conceder permiso para **Notificaciones**. Los eventos futuros de hasta 90 días (máximo 40 avisos programados por la app) generan recordatorio **1 hora antes** si tienen hora, o **a las 09:00 de la fecha del evento** si no tienen hora. Se incluye la ubicación cuando está indicada.
- Los avisos no deben cancelarse al cerrar y volver a abrir la aplicación; solo se retiran al cerrar sesión o cambiar de cuenta. Google Calendar también puede generar sus propios recordatorios.
- Los avisos de compras sin justificante requieren el permiso de notificación y tener registros adecuados; verificar que no se repiten sin motivo.

## 6. Inventario e imágenes

- En una instalación nueva aparecen tipos **generales** (General, Herramientas, Consumibles, Oficina, Mobiliario, Otros). Las categorías que ya existan en el libro del usuario **no se eliminan**.
- Cada tipo tiene un botón con un icono temático (emoji); al pulsarlo filtra artículos de ese tipo. Un tipo creado por el usuario obtiene un icono estimado por su nombre sin depender de Internet.
- Cada artículo conserva modelo, cantidad, ubicación y demás campos existentes, y puede mostrar una imagen. «Buscar imágenes» consulta **Wikimedia Commons** y ofrece resultados para que **el usuario elija y compruebe modelo y licencia**. No coloca automáticamente imágenes de Google ni garantiza que haya una foto exacta de un modelo como DAS ALTEA-715.
- Alternativamente, seleccionar una foto propia JPG/PNG de hasta 1 MB y subirla al **Drive personal** autorizado. Las fotos privadas del Drive se recuperan con token de la cuenta activa y no se deben mostrar a otra cuenta.

## 7. Ayuda, tutorial y sugerencias

- La primera vez que un usuario desbloquea la app se propone un **tutorial de diez pasos**. Resalta Inicio, Compras, Facturación, Agenda, Inventario, Resumen, Ajustes y soporte; se puede saltar y relanzar desde Ajustes.
- La **Guía de uso** contiene explicaciones más detalladas, con ejemplos y advertencias de los módulos. Revisarla en un iPhone pequeño y en iPad.
- «Sugerencias y errores» en Ajustes abre un formulario. El usuario describe voluntariamente el fallo o idea; al enviar, se solicita **confirmación** y se usa el permiso `gmail.send` de Google para enviar **solo ese texto**. No se adjuntan automáticamente compras, facturas ni datos fiscales.
- **IMPORTANTE:** el destinatario de soporte está configurado como `Electrochispas@outlook.es` (correo incluido en la plantilla de factura proporcionada en el proyecto). **El propietario debe confirmar que quiere usar ese correo de administrador antes de distribuir la IPA.** Para cambiarlo, editar `CF_SUPPORT_EMAIL` en `www/index.html` y recompilar.
- Si la cuenta no ha concedido autorización para Gmail, el mensaje NO se envía y se muestra el error; no se simula éxito.

## 8. Funciones de administrador NO disponibles en esta versión

**No se incluye un panel central que permita saber automáticamente quién se registró, consultar su última actividad, bloquear cuentas ni aplicar cuotas o límites desde el teléfono del administrador.** La arquitectura actual solo accede a **Google Drive personal de cada usuario**. Para implementar de forma segura un registro central y bloqueo remoto es necesario crear un servidor/API autenticada, una base de datos de administración, controles de permisos y política de privacidad. No sería correcto recoger identidades silenciosamente ni simular bloqueos en el cliente, que podrían eludirse.

En esta R8, el administrador **solo recibe sugerencias y errores que el usuario decida enviar por correo**. Es una funcionalidad independiente de los libros fiscales. Se puede diseñar el panel central en un proyecto posterior sin conceder acceso a libros de clientes.

## 9. Comprobaciones que debe hacer el probador en iPhone

1. Iniciar sesión con Google, marcar «Mantener sesión» y entrar. Salir y volver; comprobar que se solicita Face ID o PIN sin perder los datos.
2. Crear compra de prueba → comprobar vibración al pulsar y otra más larga al confirmarse, formulario vacío y **una sola compra** en historial.
3. Cerrar y abrir la app tras una espera, eliminar la compra → comprobar que no aparece 401 ni «no existe», que desaparece y que vibra.
4. Guardar una factura ficticia, cambiar de pestaña a mitad del formulario, volver y comprobar que la información sigue. Guardar y revisar que no duplique ni conserve importes introducidos después de confirmarse.
5. Cambiar a otra cuenta con su libro propio, comprobar que no aparecen clientes ni registros de la anterior.
6. Inventario: añadir categoría («Altavoces») y dos artículos, elegir icono de categoría y ver solo esos artículos; añadir manualmente foto de uno.
7. Añadir evento futuro con hora y ubicación; revisar Calendar y en Ajustes de iOS que las notificaciones están autorizadas. **No asumir avisos inmediatos** si se programa para una fecha posterior.
8. Iniciar el tutorial y recorrer todos sus pasos. Comprobar que destaca el control correcto sin bloquear los botones ni perder formularios pendientes.
9. Enviar sugerencia de prueba, verificar su llegada al correo configurado. Confirmar que no se adjuntaron datos fiscales.
10. Probar los temas claro y oscuro, pantalla compacta y orientación si se usa iPad. Comprobar que la barra inferior no tapa controles importantes.

## 10. Estado de validación

- Código: comprobación de sintaxis JavaScript, integridad de HTML, esquema de scripts y workflow.
- Pruebas automáticas: **59 de 59** aprobadas (incluyen 54 de versiones anteriores y 5 de integridad R8), con simulaciones de Google Sheets, Gmail y Calendar, sin tocar datos reales.
- Prueba visual: navegación con navegador simulado, tutorial de diez pasos, categorías y limpieza de campos; sin errores JavaScript en esa simulación.
- **No se ha ejecutado una compilación real de Xcode, un inicio de sesión real ni notificaciones nativas en este entorno.** No se garantiza sin prueba en dispositivo.
- Emisión de facturas y cumplimiento legal: revisar requisitos fiscales y numeración antes de emplearla en producción.

No volver a cargar el Apps Script antiguo: la R8 utiliza Google Drive y Google Sheets autorizados por la cuenta de cada usuario.
