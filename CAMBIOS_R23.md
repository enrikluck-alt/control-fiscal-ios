# Control Fiscal R23 · Correcciones de administración, Agenda y fechas

## 1. Buzón de administración integrado (corrección importante)
- Reparado el arranque de `cf-r21-features.js`: ahora se pasa correctamente `window` al módulo. En R22 la inicialización anterior podía fallar antes de registrar las funciones del administrador.
- Eliminados el botón «Comprobar mi acceso de administrador» y el texto de espera. Las cuentas sin acceso no ven ninguna opción ni diagnóstico administrativo.
- El acceso aparece silenciosamente en Ajustes → Sugerencias y errores cuando Firebase ha entregado un token de identidad válido y las reglas de Firestore autorizan la lectura de la colección.
- Comprobación automática al establecer sesión y al recibir un token Firebase, sin provocar otro cuadro de inicio de sesión. El panel se oculta inmediatamente al cambiar de cuenta y nunca usa un UID administrativo escrito en la app.
- Límite de 8 segundos en la petición silenciosa para no producir una espera infinita (sin afectar a la pantalla). Si falta token o falla la conexión, simplemente no se muestra la opción; las sugerencias siguen pudiéndose enviar.

## 2. Agenda uniforme
- Los 42 días del calendario conservan un alto fijo (76 px en teléfonos estrechos; 82 px en pantallas anchas; 70 px en horizontal bajo).
- Globos pequeños: azul para eventos, amarillo para compras, morado para facturas, verde para ingresos y naranja para cobros pendientes.
- Si hay más de 3 elementos el día muestra 2 globos y un contador `+N`. Al tocarlo se abre el listado completo del día, con acceso a eventos y documentos.
- Los globos son botones con descripciones accesibles; un clic sobre una operación abre su ficha, sin crear nuevas filas.

## 3. Formularios y fechas
- Inputs de fecha/hora con tamaño flexible, máximo 100% y tipografía mínima útil para iOS.
- Los formularios de dos columnas que incluyen fechas se convierten en una sola columna en pantallas pequeñas, incluidos filtros del gestor, facturas de material y Agenda.
- Correcciones a los controles WebKit y a la elección nativa de fecha/hora para evitar recortes de iconos y desbordes.

## 4. Integridad
- Se mantienen todas las funcionalidades y archivos de las revisiones hasta R22, incluida la corrección del plugin de contactos.
- No se han cambiado las reglas de Firestore ya publicadas ni Firebase Hosting.
- La compilación conserva la interfaz V76 y genera IPA de R23, verificando el contenido.
- 154 pruebas de Node correctas y comprobación visual del calendario en Chromium (simulación de tamaños vertical y horizontal).
- NO se ha compilado con Xcode ni verificado en un iPhone físico.
