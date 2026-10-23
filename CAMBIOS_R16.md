# Control Fiscal R16: cuatro incidencias reportadas

**Rama objetivo:** `v78-google-test`; no subir a `main` sin pruebas iOS.  
**ID visible:** `UI76-20261023-R16`.  
**Estado:** 103 pruebas locales pasan. Compilación GitHub e instalación física **pendientes**.

## 1. PDF verdadero con zoom interno

En R15 se ampliaba el elemento HTML que contenía el `iframe`; la representación del PDF dentro de él no cambiaba. En R16 `www/cf-pdf-viewer.js` carga **pdfjs-dist 4.10.38** incluido localmente, convierte el PDF privado descargado de Drive en páginas `<canvas>` y vuelve a dibujarlas cuando se cambia el zoom (50 % a 400 %). Añade observador de páginas visibles para evitar dibujar todas las páginas simultáneamente y permite mover la página mediante scroll. La opción **Imprimir** sigue enviando el PDF original a la hoja de compartir/impresión, no un dibujo rasterizado. No se utiliza un CDN ni se cambia la titularidad del PDF.

**Build:** `npm install` → `npm run build:pdf` → `npx cap sync ios` (el workflow ya incluye esta orden). PDF.js se obtiene de npm; archivos esperados en `www/vendor/pdf.min.mjs`, `www/vendor/pdf.worker.min.mjs` y `www/vendor/LICENSE-pdfjs.txt`.

## 2. Idiomas

`cf-i18n.js` traduce ahora opciones de selección con valores estables, atributos `placeholder`, `title` y `aria-label`, además de textos fijos. `cf-i18n-extended.js` aporta **258 nuevas frases** para inglés, francés, alemán, italiano y portugués. Sigue existiendo la opción **Automático** (idioma del teléfono). Los nombres de clientes y los datos fiscales son intocables. Algunos párrafos de la guía y determinados avisos del código siguen en español: aún **no es una traducción total**.

## 3. Isla Dinámica y giro horizontal

Nuevo estilo `cf-r16-pdf-and-safe-areas` en `www/index.html`: los elementos principales, las ventanas y el acceso Google respetan `env(safe-area-inset-top/left/right/bottom)`; en horizontal y pantallas táctiles bajas se deja un margen lateral preventivo para proteger la cámara incluso si el WebView no informa correctamente el recorte. Valida el iPhone real girando a ambos lados y usando el control de **Bloquear en vertical**.

## 4. Buzón de sugerencias en Google Cloud

La app conserva el cliente privado de R15, que **no utiliza Gmail** para recibir sugerencias. El endpoint sigue siendo una cadena vacía en `www/cf-feedback-config.js` por seguridad: **no se ha desplegado Cloud Run, por tanto aún NO está habilitado**. Debes seguir `cloud-feedback/README.md` con el proyecto Cloud del propietario y pegar la URL HTTPS del servicio. Tras desplegar, compila otra IPA. El listado estará en **Firestore → Data → colección `feedback`**, visible solo para el administrador autorizado. No incluir claves de cuenta de servicio en la app.

## Comprobación tras compilar

1. Instala R16 en iPhone y verifica el código de versión en Ajustes.
2. En Compras, adjunta un PDF de prueba de varias páginas: comprueba que el **texto de dentro** se amplía, reduce y se redibuja, no solo el marco; prueba Ajustar, Imprimir, Volver.
3. Pasa el idioma del iPhone a inglés/francés/alemán/italiano/portugués y selecciona Automático. Revisa Compras, Facturación, Agenda y Ajustes; anota cualquier texto aislado en español que aún aparezca.
4. Gira el iPhone a izquierda y derecha. La Isla Dinámica y la zona del indicador de inicio no deben tapar menús o botones. Repite con teclado, acceso Google y PDF abierto.
5. Activa Cloud Run en tu proyecto y comprueba el envío de una sugerencia de prueba. **Antes del despliegue el mensaje debe fallar y NO afirmar que se ha recibido.**
