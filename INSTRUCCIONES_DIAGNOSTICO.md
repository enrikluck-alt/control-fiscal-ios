# V78 - Prueba sin bucle de sesión

Esta versión elimina `social.logout()` del botón de diagnóstico. El inicio de sesión puede mostrar el selector de cuenta de Google, pero ya no se fuerza el cierre previo.

1. Subir **el contenido** del ZIP a la raíz de la rama `v78-google-test`.
2. Ejecutar `Build unsigned iOS IPA` e instalar la IPA.
3. Pulsar **Comprobar acceso Google** una sola vez.
4. Enviar una captura del diagnóstico; incluye HTTP 403 y el mensaje de error, pero nunca tokens.

No se crean archivos ni se activan operaciones fiscales.

Si el selector de cuenta se repite sin volver a la aplicación, detenerse y comunicarlo; el problema sería de flujo de autenticación y no del permiso Drive.
