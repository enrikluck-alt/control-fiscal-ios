# Control Fiscal V76–Google · R5 (correcciones de usabilidad)

**Proyecto de pruebas.** Conserva las ventanas V76 y la cuenta Google personal. No emitas facturas fiscales definitivas sin comprobar los requisitos legales y los datos de numeración.

## Instalar

1. Descomprime y sube **todos los archivos** a `v78-google-test` (no modificar `main`). Incluye `.github/workflows/build-ios.yml`.
2. Ejecuta `Build unsigned iOS IPA` en GitHub Actions sobre esa rama.
3. Descarga **ControlFiscal-V76-Google-Correcciones-UX-R5-IPA**. Instala `ControlFiscal_V76_Google_Correcciones_R5.ipa` mediante Sideloadly.
4. Comprueba en la parte inferior de Ajustes `UI76-20261022-R5`.

## Correcciones de R5

- Blanco/negro: se ha extendido la paleta a tarjetas de gráficos, licitaciones, opciones de numeración, facturación y los ejemplos de la guía. Comprueba contraste de texto y botones en ambos temas.
- Edición sin zoom automático: todos los campos `input`, `select` y `textarea` usan al menos 16 px; el zoom de accesibilidad del dispositivo sigue permitido. No se bloquea el pellizco voluntario.
- Licitaciones: el enlace abre primero una página **HTTPS oficial del Gobierno de España** (`administracion.gob.es`) que explica cómo entrar a la plataforma pública. Si el destino gubernamental posterior muestra alerta de certificado, no aceptes el riesgo.
- Google: se inicia el plugin nativo en cuanto carga la app y se quita la espera artificial de 600 ms. Si marcas mantener sesión, intenta recuperar la autorización guardada por el plugin; si Google no entrega un token válido, vuelve al acceso sin borrar el libro o afirmar falsamente que expiró. El inicio de sesión manual verificado no fuerza un segundo PIN/Face ID inmediato si ya existe PIN local; **al enviar la app a segundo plano y regresar se mantiene el bloqueo de seguridad**. En una cuenta sin PIN se solicitará configurarlo.
- Editor de facturas: ahora explica con ejemplos visuales `texto fijo`, `año (2/4)` e `incremental (ancho:inicio)`; el ejemplo `F` + `4` + `-` + `3:1` se representa como `F2026-001`.
- Guía: ampliada a 11 apartados con demostraciones visuales ilustrativas, sin datos reales.
- Información: descripción de módulos, autor, funcionamiento y seguridad.
- Comparar precios: Ajustes → Información y herramientas → Comparar precios. Permite introducir producto y abrir Idealo o Google Shopping, además de **ordenar de menor a mayor ofertas que el usuario haya verificado y añadido manualmente**. **No** hay extracción automática ni cobertura de todas las tiendas: requiere un servicio de datos comercial y autorización de los proveedores. Las ofertas no se guardan en Google Sheets.

## Comprobación en iPhone

1. Abrir la app con **Mantener sesión** activado; si hay autorización nativa válida y libro previamente seleccionado, deberá verificar automáticamente, sin paso artificial de espera. Si no hay autorización, aparecerá «reconectar» con el libro intacto.
2. Entrar manualmente con Google: si ya has configurado el PIN local, no debe solicitarlo por segunda vez inmediatamente. Salir de la app y volver: debe bloquear con Face ID o PIN.
3. Cambiar entre **Negro/Blanco**. Comprueba Resumen (gráfico y licitaciones), Facturación (Crear factura / Registrar ingreso), Opciones de factura, Guía e Información.
4. Tocar los campos de número en Opciones de factura: no debe ampliarse toda la interfaz; desliza en el modal sin desplazamiento horizontal.
5. Comprobar que el enlace gubernamental abre una conexión segura. Si se ve una alerta de seguridad en el sitio enlazado desde el portal, no ignores el certificado.
6. Abrir la nueva Guía desde Ajustes y comprobar los once apartados y ejemplos.
7. Comparar precios: escribir un modelo, abrir buscadores oficiales y añadir varias ofertas de prueba: la tabla local debe ordenarlas de menor a mayor.
8. Repetir una factura de ensayo R4, guardar y recuperar borrador, agenda e inventario.

## Límites

- No se ha probado Xcode nativo en este entorno. Google OAuth, Face ID y sitios externos deben comprobarse en iPhone.
- Restaurar una sesión depende de que Google conserve autorización nativa utilizable y de los permisos OAuth. No es correcto guardar un token permanente en `localStorage` para evitar volver a identificarse.
- El buscador de precios **no tiene integración de tiendas ni precios en vivo dentro de la app**. Ningún programa puede asegurar precios de «todas las tiendas» sin cobertura de datos y acuerdos.
- Las facturas numeradas, el PDF y Google Sheets conservan las limitaciones y advertencias legales de R4. No modificar a mano las filas de `CF_Facturas_Emitidas`.
