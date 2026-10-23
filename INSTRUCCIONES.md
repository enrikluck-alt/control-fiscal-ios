# Control Fiscal V76-Google — R16 · Visor PDF real, idiomas y Dynamic Island

**Versión:** `UI76-20261023-R16`  
**Rama de trabajo:** `v78-google-test`; **no tocar** `main`.  
**Estado:** compilación y prueba en iPhone pendientes. No se ha compilado Xcode desde este entorno.

## 1. Cómo compilar en GitHub Actions

1. Descomprime el ZIP y sube **todo** su contenido a `v78-google-test`, incluida la carpeta oculta `.github`, `resources/ios-locales`, `www` y `package.json`.
2. Abre Actions → **Build unsigned iOS IPA** → **Run workflow**, seleccionando esa rama.
3. Descarga el artefacto `ControlFiscal-V76-Google-R16-PDF-Idiomas-Island-IPA`; contiene `ControlFiscal_V76_Google_R16_Idiomas_PDF_Island.ipa`.
4. Instala la IPA con Sideloadly. En Ajustes verifica `UI76-20261023-R16`.
5. Conserva una copia de la versión instalada anteriormente y prueba **solo con registros ficticios**, no facturas fiscales reales.

## 2. Notificaciones y sonido: corrección de la espera infinita

Antes de R14 podía quedarse eternamente en «Comprobando permiso de iOS» o «Solicitando permiso». La R14 (conservada en R16) incorpora un control de tiempo máximo y muestra un error concreto si el plugin nativo `LocalNotifications` no responde. Si `checkPermissions` falla, intenta solicitar el permiso mediante `requestPermissions`. La prueba se programa 10 segundos después y comprueba los avisos pendientes cuando el plugin lo permite. Las notificaciones de Agenda y documentación pendiente usan el sonido elegido (Claro, Pulso, Calma o sonido del sistema).

**Prueba en el iPhone:**

1. Ajustes del iPhone → **Control Fiscal → Notificaciones**: comprueba que aparecen y están permitidas. Si la opción no aparece o iOS ya denegó el permiso, **iOS podría no mostrar otra ventana de autorización**. Cambia el permiso en Ajustes del sistema cuando sea posible; no desinstales ni borres datos fiscales para probarlo.
2. En Control Fiscal → Ajustes → Notificaciones, pulsa **Activar / Actualizar recordatorio**. Debe aparecer una confirmación o un error concreto **en menos de 25 segundos**.
3. Pulsa **Enviar aviso de prueba**, bloquea el teléfono y comprueba si llega 10 segundos después; repite con cada sonido.
4. Crea un evento ficticio que comience dentro de 15-30 minutos y selecciona 15 minutos antes; guarda y verifica la notificación y la ruta en Mapas.
5. Los recordatorios diarios solo se programan si el usuario los activa y hay registros con documentación pendiente. La programación la acepta iOS; el momento exacto de presentación depende también de las notificaciones, silencio y modos Concentración del sistema.

**Importante:** un permiso no se puede conceder mediante código sin la intervención de iOS. Estas correcciones son defensivas y diagnósticas; **la entrega real de avisos no está confirmada** hasta probarla en el iPhone. Para abrir rutas de eventos, se invoca Apple Maps; **no se solicita la ubicación GPS de Control Fiscal**. Si Mapas necesita localización, es esa aplicación quien pide su propio permiso.

## 3. Visor dentro de Control Fiscal

Abre un documento adjunto desde Compras, Facturas o Documentos. El visor muestra inicialmente el PDF o la imagen ajustada al espacio disponible. Dispones de botones **− Reducir**, **+ Ampliar**, **Ajustar (100 %)**, **Imprimir**, **Abrir fuera** y **Volver a Control Fiscal**. La zona central se puede desplazar después de ampliar. «Imprimir» exporta una copia temporal al menú nativo de iOS para seleccionar la acción **Imprimir**; esta opción necesita una impresora compatible o AirPrint. No se abre el navegador para imprimir.

En R16 hemos sustituido la vista previa interna mediante iframe por **Mozilla PDF.js**, descargado e incluido localmente durante la compilación. Ahora los botones cambian la escala real de las páginas dibujadas en canvas y vuelven a renderizarlas al ampliar. Los archivos PDF siguen descargándose privadamente mediante Google Drive con el token de la cuenta autenticada: **no se envían a servidores de conversión ni CDN**. Puedes deslizarte entre páginas y probar el pellizco de dos dedos. Hay que validar legibilidad, memoria y PDF multipágina en el iPhone.

## 4. Idiomas: elegir el del teléfono o uno manualmente

Ajustes → **Diseño → Idioma de la aplicación**: **Automático** (recomendado), Español, English, Français, Deutsch, Italiano y Português. En Automático se detecta el idioma del iPhone al iniciar. R16 incorpora **258 nuevas cadenas traducidas para cada uno de los 5 idiomas adicionales**, además de las existentes de R14: formularios, opciones de selector, etiquetas de accesibilidad, mensajes de soporte y titulares de la guía. **Los párrafos extensos de ayuda, ciertos mensajes técnicos y cadenas creadas dinámicamente aún pueden quedar en español**. Los datos fiscales de cada usuario no se alteran. No se anuncia traducción completa a «cualquier idioma»: para ampliar idiomas hace falta traducir y probar el resto de cadenas.

Los diálogos nativos del sistema para seleccionar archivos dependen del idioma configurado en iOS, no exclusivamente del idioma del HTML. Incluimos localizaciones de iOS para seis idiomas y las descripciones de Face ID para mejorar esa selección, pero el resultado final debe verificarse en iPhone.

## 5. Giro automático de la pantalla

Ajustes → **Diseño → Giro de pantalla**: **Giro automático** o **Bloquear en vertical**. Se incluye la dependencia nativa oficial `@capacitor/screen-orientation` 8.0.2, compatibilidad de orientaciones en `Info.plist` y un diseño que aprovecha mayor anchura en horizontal. **En R16** se aplican `safe-area-inset-left/right` en cabecera, navegación, formularios y modales, más márgenes de seguridad en horizontal para proteger la zona de la cámara/Isla Dinámica en iPhone. El bloqueo de orientación puede no afectar a navegadores o pantallas del sistema ajenos al controlador de Control Fiscal. En iPad hay limitaciones del sistema con multitarea.

## 6. Sugerencias: buzón privado de Google Cloud (pendiente de despliegue)

El formulario muestra «**Enviando sugerencia a los desarrolladores…**» sin mostrar la dirección privada y deja de utilizar Gmail API para **sugerencias**. La aplicación utiliza `www/cf-feedback.js` y un ID token de Google obtenido del plugin de inicio de sesión, que Cloud Run valida por firma y cliente OAuth autorizado. El cuerpo solo contiene el tipo, mensaje escrito voluntariamente, idioma, plataforma y versión: **nunca hojas de cálculo ni facturas**.

En la carpeta **`cloud-feedback/`** incluimos el código del servidor **Cloud Run** que escribe en una colección privada `feedback` de **Firestore** con hora, tipo, mensaje, versión, nombre, correo de cuenta Google, dispositivo/plataforma y estado de revisión. No existe una ruta pública para enumerar o leer mensajes. Solo el administrador del proyecto puede consultar la colección en la consola de Firestore con IAM. Hay límites básicos por usuario de frecuencia y volumen.

**IMPORTANTE — FALTA CONFIGURAR TU PROYECTO GOOGLE CLOUD**: no hemos desplegado Cloud Run porque no tenemos acceso autorizado al proyecto. El endpoint de `www/cf-feedback-config.js` está vacío y, hasta configurarlo, la app informa honestamente que no se ha enviado la sugerencia. Lee las instrucciones de `cloud-feedback/README.md` para activar Firestore, el servicio Cloud Run, el OAuth Client ID permitido y copiar la URL HTTPS a `www/cf-feedback-config.js`; después genera la IPA.

El permiso `gmail.send` se conserva para **enviar facturas/documentación por Gmail**: es una función distinta. Habilitar Gmail API por sí solo no basta para arreglar el HTTP 403 si el consentimiento OAuth o la autorización del usuario no incluyen el scope necesario.

**Privacidad:** el administrador solo ve los mensajes de soporte y metadatos identificativos mínimos. No puede abrir libros privados de Drive/Sheets. No se meten claves privadas dentro de la app.

## 7. Pruebas y límites

- **103 pruebas locales**: 98 de R15 y 5 nuevas verificaciones de R16 sobre PDF.js, idiomas, safe areas y configuración Cloud, todas correctas.
- Se han verificado la sintaxis JavaScript, las firmas de los estilos V76 originales y las referencias que el workflow comprobará en la IPA. **El paquete PDF.js se descarga por `npm install` dentro de GitHub Actions**, y su copia local se verifica antes de `npx cap sync ios`; ese paso remoto no se ha ejecutado aquí.
- **No se ha compilado el proyecto con Xcode ni se ha ejecutado la IPA físicamente**. Face ID, Gmail/Google Cloud, avisos y sonido reales, selector nativo de archivos, impresión y orientación necesitan comprobación en tu iPhone.
- No borres datos de Drive ni limpies registros de facturas emitidas para comprobar cambios estéticos. Usa registros ficticios y haz una copia del libro antes de pruebas estructurales.

## 8. Qué comprobar primero

1. Cambia el idioma del iPhone a uno de los soportados y abre Control Fiscal con idioma Automático; comprueba Inicio y Ajustes. Vuelve a español y cambia manualmente de idioma.
2. En Diseño, prueba giro vertical/horizontal y bloqueo de orientación.
3. Abre una imagen y un PDF reales de prueba: Ajustar, zoom, Imprimir y Volver.
4. Comprueba notificaciones y prueba de sonido siguiendo el apartado 2. Anota el **mensaje exacto** si no llega el aviso.
5. Configura primero `cloud-feedback/` y la URL HTTPS; envía una sugerencia ficticia y comprueba en Firestore que aparece un registro sin datos fiscales. Si la URL sigue vacía, debe informar que no se ha enviado.
