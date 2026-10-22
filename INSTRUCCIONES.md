# Control Fiscal V76-Google — Seguridad, sesión y facturas (UI76-20261022-R2)

Proyecto completo para **rama `v78-google-test`**. No modificar `main`.

## Cambios frente a R1

1. Se conserva el diseño de los formularios y la barra inferior de **V76**. La tarjeta de Facturación de Inicio y el botón `Fact.` de abajo llaman al mismo `openFacturacionPage()`; allí están las opciones «Crear factura» e «Ingreso independiente».
2. Acceso inicial con dos opciones: **INICIAR SESIÓN** o **CREAR CUENTA**. El correo es **opcional** y sirve para verificar que se eligió la cuenta pretendida; **Google** gestiona la contraseña y el selector de cuentas, no Control Fiscal. Crear cuenta abre la página oficial de Google en una ventana interna de iOS (SFSafariViewController), sin entregar credenciales a la app; después se vuelve a Iniciar sesión. Google podría requerir completar alguna acción fuera de esa ventana.
3. **Mantener sesión iniciada**: si se marca, al volver a arrancar se intenta recuperar de forma silenciosa el acceso desde el plugin de Google; si Google pide volver a autorizar, aparecerá el acceso. Nunca se guarda el token OAuth en `localStorage`.
4. **Face ID / PIN al reentrar:** al mandar la aplicación a segundo plano se muestra inmediatamente el bloqueo. Al regresar debe pedir Face ID; si iOS no dispone de biometría, se utiliza el código configurado previamente. La app **no** está certificada con controles de seguridad bancaria.
5. En Ajustes se corrige el texto de las **notificaciones**: selector de hora en una fila propia, sin encoger la descripción. Se elimina **ABRIR MIS GOOGLE SHEETS**.
6. Tras guardar una **factura como borrador**, aparece «COMPARTIR PDF DEL BORRADOR (WHATSAPP)». El iPhone abre Compartir para elegir WhatsApp u otra aplicación instalada. **NO ENVÍA AUTOMÁTICAMENTE**: el usuario selecciona destinatario y confirma el envío. El PDF incluye la mención **«BORRADOR - NO EMITIDA»** y NO cuenta como factura fiscal emitida. El archivo PDF temporal se borra de caché al terminar.
7. El almacenamiento respeta filas antiguas: los cambios se guardan en la pestaña auxiliar `CF_Registros_v2`, sin reescribir columnas legacy. Se mantiene Google OAuth por usuario y comprobación de titularidad del libro.

## Compilar desde GitHub Actions

1. Descomprime el ZIP; sube **todo el contenido de su raíz** a la rama `v78-google-test`, incluyendo `.github/workflows/build-ios.yml`, `google-login-entry.js`, `package.json`, `tests`, y `www`. No añadas los proyectos de V78 previos.
2. En Actions lanza **Build unsigned iOS IPA** sobre esa rama. Workflow instala dependencias, corre las pruebas y prepara el bundle nativo. Necesita Internet para obtener los paquetes npm.
3. Si termina, descarga el artefacto **`ControlFiscal-V76-Seguridad-Google-Facturas-20261022-IPA`**.
4. Instala con Sideloadly el archivo **`ControlFiscal_V76_Seguridad_Google_Facturas_20261022.ipa`**.
5. Comprueba en Ajustes, al final, la etiqueta de compilación **`UI76-20261022-R2`**. Si no aparece, prueba de nuevo la rama y el artefacto correctos.

## Prueba rápida en iPhone

- Cuenta nueva: inicia sin sesión; pulsa **CREAR CUENTA**, crea una cuenta Google con la ventana del proveedor y vuelve a **INICIAR SESIÓN**. Si no hay libro, ofrece crearlo.
- Cuenta existente: inicia con Google, comprueba que recupera tu libro y que entra directamente en Inicio después del desbloqueo.
- Sesión: marca **Mantener sesión iniciada**, cierra la app y vuelve a abrirla. Google puede requerir volver a autorizar si la sesión caducó.
- Protección: abre Compras o Ajustes, pasa a otra aplicación y vuelve. Debe aparecer Face ID o el PIN de respaldo, **sin mostrar los importes antes**.
- Ajustes: verifica el texto del recordatorio, la hora y que no aparece «Abrir mis Google Sheets».
- Facturación: entra desde la tarjeta del Inicio y desde `Fact.`; ambas deben ofrecer «Crear factura» e «Ingreso independiente». Crea un **borrador de ensayo** con clientes y conceptos ficticios. Al guardar, comparte el PDF de borrador por WhatsApp y comprueba que diga «BORRADOR - NO EMITIDA».
- Cerrar sesión: toca el botón al final de Ajustes, observa la vibración y comprueba que vuelve a Google; utiliza una segunda cuenta Google y verifica que no muestra datos de la primera.

## Límites conocidos — NO USAR PARA EMITIR FACTURAS FISCALES

- **La emisión fiscal numerada, el PDF oficial definitivo, Verifactu y envío fiscal están pendientes.** Las facturas creadas en esta versión son borradores no emitidos; el PDF de compartir sirve como documento de ensayo y queda marcado como borrador. No lo presentes como factura fiscal.
- Sin pruebas automatizadas de un iPhone real no puede certificarse Face ID, el selector Google, las sesiones persistentes ni WhatsApp. Si el dispositivo bloquea la creación de Google dentro de la ventana integrada, habrá que crear la cuenta en la interfaz oficial y regresar a la app.
- La notificación y sincronización de Google Sheets siguen pendientes de verificación con servicios reales. No uses información fiscal sensible para la primera prueba; utiliza un libro y datos de ensayo.
- La aplicación conserva un PIN local de respaldo. No alcanza por sí sola las garantías de una aplicación bancaria auditada.

**Archivos en `www`:** `index.html`, `chispas-logo.png`, `cf-google-auth.js`, `cf-google-data.js`, `cf-google-upload.js`, `cf-invoice-share.js`; el workflow genera `google-login.bundle.js` en compilación.
