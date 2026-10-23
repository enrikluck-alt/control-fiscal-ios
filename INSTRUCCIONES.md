# Control Fiscal V76-Google — R12 · Notificaciones, sonido y correcciones de interfaz

**Identificador visible en Ajustes:** `UI76-20261023-R12`

Esta entrega conserva las pantallas originales V76 y los módulos de la R11; modifica principalmente Ajustes, notificaciones, soporte e Inventario. No se ha probado aún la IPA en un iPhone real ni se ha ejecutado Xcode en este entorno. Los datos fiscales reales requieren las precauciones de las versiones anteriores, especialmente con facturas emitidas y numeración concurrente.

## Instalación

1. Extrae el ZIP y sube su contenido **completo**, incluida la carpeta oculta `.github`, a la rama **`v78-google-test`**. No modifiques `main`.
2. Abre GitHub Actions → `Build unsigned iOS IPA` → `Run workflow` y elige dicha rama.
3. Descarga el artefacto **`ControlFiscal-V76-Google-R12-Notificaciones-IPA`** y dentro la IPA `ControlFiscal_V76_Google_R12_Notificaciones_Imagenes.ipa`.
4. Instálala con Sideloadly y verifica la marca `UI76-20261023-R12` al final de Ajustes.
5. Comprueba que en la IPA aparecen los archivos de sonido `cf_claro.wav`, `cf_pulso.wav` y `cf_calma.wav` en la raíz de `Payload/ControlFiscal.app/` (el workflow valida que estén).

## Ajustes — tema blanco

Se refuerza el contraste en el **índice principal de Ajustes**: los títulos y los botones de navegación pasan a oscuro sobre blanco. Prueba tanto el índice como Diseño, Notificaciones, Audio y Cuenta. Las preferencias existentes se conservan.

## Sugerencias — menú nativo de compartir

En Ajustes → Sugerencias y errores se mantiene el formulario. Al pulsar «Preparar correo» hay una vibración corta; tras confirmar se abre la hoja nativa de compartir de iOS. Elige Mail o tu aplicación de correo y envía la sugerencia a **Electrochispas@outlook.es** (es el destinatario provisional que ya figuraba en versiones anteriores). La app incluye esta dirección en el texto compartido, **pero debes indicarla como destinatario en tu aplicación de correo si ésta no la rellena**. Control Fiscal no tiene servidor de recepción ni puede verificar automáticamente que el correo se haya enviado.

Si el menú de compartir no se abre, se ofrece un enlace a Mail y la opción de copiar el texto. No se adjuntan automáticamente documentos, compras o facturas de la cuenta.

## Notificaciones iOS — configurar y comprobar

En Ajustes → **Notificaciones**:

- Elige la **hora del recordatorio** (por ejemplo, 09:00).
- Marca **«Aviso diario de documentación pendiente»** para activarlo; desmárcalo para cancelarlo. Esta preferencia se conserva al cerrar la aplicación.
- Pulsa **«Permitir notificaciones»** si aún no has concedido el permiso de iOS. Para funcionar, iOS debe autorizar alertas y, para oír sonidos, tener el sonido permitido. El modo Silencio o Concentración puede afectar a su presentación.
- Pulsa **«Enviar aviso de prueba»**: se programa una notificación local para **8 segundos más tarde**. Bloquea el iPhone para comprobar que aparece. Esto prueba el funcionamiento real del plugin nativo; si falla, la app muestra el motivo.
- Las notificaciones de compras/facturas pendientes se programan a diario **solo cuando hay documentación pendiente y la casilla está activada**. Al actualizar la información o desactivar la casilla se reprograman o cancelan. Si cambias datos externamente en Drive, abre la app para que recalcule el estado.

En **Agenda**, al guardar un evento que tenga aviso seleccionado, la aplicación pide autorización de iOS si aún no la tiene y programa el aviso. Si no se concede, el evento queda guardado y aparece una advertencia de que **no se ha programado** la notificación. No es necesario conceder permiso a Google Calendar para estos avisos locales. Los avisos cubren eventos de los próximos 90 días y se actualizan al cargar Agenda.

### Audio de notificaciones

Nuevo apartado **Ajustes → Audio de notificaciones** con cuatro opciones: sonido del sistema o tres sonidos propios cortos (Claro, Pulso y Calma). Puedes pulsar **Escuchar sonido** y **Probar en el iPhone**. Los archivos WAV se incluyen tanto en `www/sounds/` como en la raíz de la aplicación iOS al construir la IPA. Son sonidos originales de esta entrega, no archivos copiados de terceros. Apple exige que los sonidos personalizados estén en el paquete de la app y duren menos de 30 segundos.

**Limitación:** iOS puede silenciar las alertas por los ajustes del dispositivo, el modo Concentración o los permisos. Ninguna app puede imponer una notificación o sonido si el sistema los bloquea. No se incluyen Live Activities en esta versión.

## Inventario

- Los botones de **tipos de material** se disponen en **cuadrícula** de ancho adaptable; ya no es necesario desplazarse horizontalmente para cambiar de tipo.
- Las fichas de inventario muestran las fotos asociadas. Las imágenes privadas subidas a Drive se descargan para su visualización usando la cuenta Google activa; no se publican los archivos.
- El editor conserva la imagen asociada al reabrir un artículo, evitando perderla al cambiar otros campos.
- «Ver galería de fotografías» busca en Openverse/Wikimedia, añade una búsqueda **genérica** cuando el modelo exacto no arroja resultados y corta las peticiones que tarden demasiado. Muestra imágenes seleccionables con sus licencias. Si no hay imágenes, permite subir tu propia foto.
- Esta galería **no es Google Imágenes** y las imágenes genéricas pueden no corresponder al producto. Comprueba siempre que es la foto correcta antes de guardarla. Fuentes externas pueden bloquear miniaturas y no se garantiza que todas estén disponibles.

## Pruebas de regresión y límites

- **81/81 pruebas automatizadas locales superadas**: 75 de versiones anteriores y 6 adicionales de activación/desactivación del aviso, hora, cuenta de pendientes, WAV, imágenes y envío de sugerencias.
- Comprobada la sintaxis JavaScript de los scripts incrustados y externos, y la estructura YAML de GitHub Actions.
- La comprobación visual automatizada con Chromium no pudo ejecutarse: `net::ERR_BLOCKED_BY_ADMINISTRATOR`. No se declara superada.
- **Pendiente de iPhone y GitHub Actions:** compilar Xcode, permiso real de notificaciones, sonido mientras la app está en segundo plano, mostrar imágenes externas, hoja de compartir y contraste en dispositivos físicos.
- **Facturación:** sigue existiendo el riesgo conocido de numeración concurrente en Google Sheets. No emitas facturas reales simultáneamente desde varios dispositivos hasta incorporar numeración atómica y validación fiscal. Las facturas emitidas continúan protegidas; no se ha alterado su histórico en este parche.

### Orden de prueba propuesto

1. Tema **blanco** → índice de Ajustes (comprueba títulos); negro → compara.
2. Sugerencias → escribe 20 caracteres → pulsa Enviar → confirma → comprueba que aparece el menú nativo de compartir; prueba la vibración.
3. Notificaciones → elige 09:15, activa casilla, permite notificaciones → **Enviar aviso de prueba** → bloquea el iPhone y comprueba el sonido a los 8 segundos.
4. Audio → selecciona Claro, Pulso y Calma → Escuchar; pulsa Probar en el iPhone y verifica que cambia el sonido.
5. Agenda → guarda un evento ficticio próximo, con aviso 15 min antes; confirma que no sale error de programación. Si Calendar falla por OAuth, el aviso local debe seguir disponible.
6. Inventario → crea un tipo Altavoces → verifica cuadrícula → añade un artículo con foto propia → guarda → vuelve y comprueba miniatura y vista previa.
7. Compras y Facturación → comprueba que la navegación y registros antiguos siguen igual.
