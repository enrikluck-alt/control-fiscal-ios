# Control Fiscal R18 — Configurar Firebase Authentication + Firestore

## Objetivo y privacidad

El buzón `control_fiscal_sugerencias` de Firestore guarda **exclusivamente sugerencias, incidencias y consultas**. El desarrollador podrá consultar esos mensajes en Firebase Console. No se envían compras, facturas, materiales, ubicaciones de eventos, fotos, planos, ficheros Drive ni contenido de Google Sheets a Firestore. Cada usuario conserva sus datos fiscales en su propia cuenta Google.

Los clientes de la app solo tienen permiso de **crear** una sugerencia con su UID de Firebase, y nunca de leerlas. El propietario del proyecto puede leerlas mediante la consola autorizada de Firebase/GCP.

## Paso 1 — Crear Firestore (aún pendiente en la cuenta)

1. Abre https://console.firebase.google.com/ y selecciona el proyecto Firebase **que YA has creado**, no uno nuevo.
2. Abre **Compilación / Build → Firestore Database → Crear base de datos**.
3. Selecciona Firestore en **modo nativo / Native mode**, edición Standard si se ofrece, y elige una región europea compatible. La ubicación es una decisión importante y no siempre se puede cambiar después.
4. Elige las reglas **bloqueadas / modo producción** durante la creación. No actives el modo de prueba que permite operaciones temporales desde clientes.
5. Termina el asistente y abre la pestaña **Reglas**.
6. Copia el bloque específico de `firestore.rules` incluido en este ZIP y pulsa **Publicar**.
   - **Si el proyecto tiene otras colecciones en uso, NO sustituyas todas las reglas:** integra solo el bloque `match /control_fiscal_sugerencias/{suggestionId}` en el archivo existente, dentro de `match /databases/{database}/documents`.
   - Nunca añadas `allow read, write: if true` para que “funcione”.
   - Si ya tienes reglas estrictas para el resto del proyecto, consérvalas.
7. Deja la colección vacía: `control_fiscal_sugerencias` aparecerá después de enviar correctamente el primer mensaje desde la app. No es necesario crearla manualmente.

## Paso 2 — Verificar Authentication

1. Ve a **Authentication → Sign-in method**.
2. Confirma que el proveedor **Google** aparece habilitado y que el correo de soporte es correcto.
3. Conserva Google OAuth de la app para Drive/Sheets. Firebase Authentication es una segunda autenticación para proteger el buzón, no reemplaza los permisos de Google Drive.

## Paso 3 — Vincular el proyecto real a R18

1. En Firebase Console, abre engranaje → **Configuración del proyecto → General**.
2. Copia únicamente **Project ID** y **Web API Key** del proyecto. Son parámetros de configuración públicos; **no** envíes JSON de cuentas de servicio, contraseñas, tokens ni secretos OAuth.
3. Abre `www/cf-firebase-config.js` del ZIP y sustituye las cadenas vacías:

```javascript
window.CFFirebaseConfig = Object.freeze({
  apiKey: 'TU_WEB_API_KEY',
  projectId: 'TU_PROJECT_ID'
});
```

4. Sube el proyecto completo a la rama de pruebas `v78-google-test` (incluye la carpeta `.github`). Ejecuta **Actions → Build unsigned iOS IPA**.
5. Instala la nueva IPA (versión de interfaz `UI76-20261025-R18`). La configuración debe estar integrada **en esta nueva compilación**, no en R17.

**Importante:** la API Key pública no sustituye las reglas de seguridad. Si la clave tiene restricciones en Google Cloud Console, comprueba que no bloqueen Identity Toolkit; no elimines restricciones de una clave ajena o de producción sin revisarlas.

## Paso 4 — Probar conexión desde el iPhone

1. Inicia sesión con Google en la app.
2. Ve a Firebase Console → Authentication → Users y comprueba que aparece el usuario que inició sesión (cuenta de prueba, si puedes).
3. En Control Fiscal → Ajustes, comprueba el estado «Firebase Authentication conectado».
4. Enviar una sugerencia con texto de prueba de 12 a 2700 caracteres.
5. En Firebase Console → Firestore Database → Datos debe aparecer `control_fiscal_sugerencias` con un documento `cf_...` que contenga `uid`, `tipo`, `mensaje`, `estado: pendiente`, `fecha` del servidor.
6. Prueba con otra cuenta para verificar que NO puede leer o enumerar sugerencias de otros usuarios.

## Errores frecuentes

- **“Buzón no configurado”**: falta `apiKey`/`projectId` en `www/cf-firebase-config.js` o la IPA instalada procede de R17. Recompila.
- **HTTP 403 / permission denied**: comprueba proyecto, reglas publicadas, proveedor Google, usuario conectado y que la operación sea `create` con sus propios datos.
- **`accounts:signInWithIdp` / OAuth error**: revisa la configuración de Google Authentication y las credenciales OAuth existentes. No elimines los permisos de Drive/Sheets para «arreglar» Firebase.
- **Colección no aparece**: no se ha enviado aún una sugerencia confirmada, o se está mirando otro proyecto.
- **Problema de facturación/cuota**: consulta el plan y las cuotas del proyecto; el uso gratuito puede cubrir pruebas pequeñas, pero no todas las operaciones son ilimitadas.

## Lo que esta revisión NO puede hacer sin tu acceso

Este paquete NO puede crear la base de datos dentro de tu cuenta, publicar reglas ni instalar la IPA en tu iPhone. No se ha conectado aquí a tu consola Firebase real. Tampoco se han realizado pruebas de navegación en un iPhone físico. Es importante completar y probar cada paso antes de publicar la app.
