# Control Fiscal — buzón de sugerencias en Google Cloud (R16)

**Estado**: código listo para preparar despliegue; **no** se ha desplegado, autenticado ni probado en Cloud Run. Por defecto la aplicación muestra un mensaje de configuración pendiente y NO afirma haber enviado nada.

## Esquema

`Control Fiscal iOS → Google Sign-In ID token → Cloud Run HTTPS POST /api/feedback → Firestore: feedback`.

- El token de identidad Google se comprueba **en el backend**, validando firma y `aud` con `google-auth-library`.
- Se guardan `googleUserId`, `email`, `name`, `kind`, `message`, `appVersion`, `platform`, `language`, `createdAt` y `status:nueva`.
- **No se transmiten** compras, libros de Drive, datos fiscales, facturas, ni tokens de Drive.
- Los clientes no pueden leer sugerencias: no existe endpoint de lectura. Solo personal con permisos IAM puede acceder a Firestore Console.
- El backend valida tamaño, tipo y limita envíos a 10/día y 30 segundos entre mensajes por identidad.
- No subas ninguna clave JSON al ZIP ni al repositorio.

## Activación en Google Cloud

1. En Google Cloud Console crea/selecciona un proyecto (el mismo de OAuth, si procede). Activa Cloud Run, Cloud Build, Artifact Registry y Firestore. Activa facturación y crea una base Firestore (Native mode). La región y coste dependen del proyecto.
2. Crea la cuenta de servicio de ejecución de Cloud Run con el rol **Cloud Datastore User** para guardar documentos (usa el mínimo permiso necesario). No uses credenciales de tu Drive personal.
3. En **Google Auth Platform → Clients** identifica el OAuth Client ID para iOS. Ese Client ID debe estar entre las audiencias aceptadas por el backend. Para Android, agrega el Web Client ID que realmente aparezca en los ID tokens del plugin; **verifica la audiencia**, no presupongas que es la misma.
4. Con Cloud Shell, sube el directorio `cloud-feedback` al proyecto y ejecuta, sustituyendo ID/proyecto/cuenta/región según tu configuración:

```bash
cd cloud-feedback
PROJECT_ID="TU_PROYECTO"
REGION="europe-southwest1"
SERVICE_ACCOUNT="control-fiscal-feedback@${PROJECT_ID}.iam.gserviceaccount.com"
OAUTH_CLIENT_ID="TU_CLIENT_ID.apps.googleusercontent.com"
gcloud config set project "$PROJECT_ID"
gcloud run deploy control-fiscal-feedback \
  --source . --region "$REGION" \
  --service-account "$SERVICE_ACCOUNT" \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_CLIENT_IDS=$OAUTH_CLIENT_ID"
```

El servicio usa invocación pública a nivel de red porque la aplicación se ejecuta con una cuenta Google personal y **verifica obligatoriamente el ID token en cada envío**, además de validar la audiencia. `--allow-unauthenticated` **no** significa que las sugerencias se acepten sin autenticación en la aplicación.

5. Copia la URL `https://control-fiscal-feedback-....run.app` que devuelve Cloud Run y colócala en `www/cf-feedback-config.js` como `endpoint:'https://...'`. Sube el ZIP modificado al branch `v78-google-test` y compila una nueva IPA. La URL no es secreta y no debe llevar un token.
6. Prueba con una sugerencia ficticia, comprueba recepción y respuesta, y abre **Google Cloud Console → Firestore → Bases de datos → (default) → Datos → colección `feedback`**. Podrás cambiar el campo `status` de `nueva` a `revisada` o `resuelta`, con tus permisos. Nunca se concede permiso de lectura de Firestore a los usuarios por defecto.
7. Para producción configura política de privacidad, conservación/borrado de mensajes, límites de gasto y alertas. La función captura email y nombre del remitente en el buzón, no sus registros fiscales. No despliegues datos reales sin cumplir estos requisitos.

**IMPORTANTE**: habilitar solo Gmail API no influye en este buzón. Gmail API puede seguir siendo necesaria para enviar PDFs por correo dentro de la aplicación (función distinta). Tampoco se soluciona un 403 de Gmail con solo activar su API: el usuario debe autorizar el scope, estar en el grupo tester si el cliente OAuth está en pruebas, y el consent screen debe permitirlo.

## Verificación de seguridad

- Llamada sin ID token → HTTP 401.
- ID token válido pero de otro cliente OAuth → HTTP 401.
- Mensaje corto o con tipo no permitido → HTTP 400.
- Abuso repetido → HTTP 429.
- Nunca se expone una ruta GET de la colección `feedback`.
- Cuenta de servicio con mínimo permiso y Firestore Rules cerradas para SDK de cliente (Admin SDK ignora estas reglas y usa IAM).

## Reglas Firestore opcionales (si también activas SDK web/móvil)

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if false; }
  }
}
```
