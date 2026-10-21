# Control Fiscal V76-Google — Cerrar sesión + vibración

Esta actualización conserva el proyecto anterior y corrige la conexión del botón CERRAR SESIÓN de Ajustes, que antes dependía de que se inicializara la interfaz V78. Ahora el manejador se instala siempre, incluso si la interfaz original sigue activa.

Al tocar el botón se solicita vibración háptica nativa mediante @capacitor/haptics y se pide confirmación. Si se confirma, se invoca el cierre de sesión Google existente, se verifica que no quede una sesión activa y se recarga la aplicación para mostrar el acceso. Si falla, se muestra el error debajo del botón. No elimina datos de Google Drive ni usa el Apps Script anterior para cerrar la sesión.

## Compilar

1. Descomprimir y subir todo el contenido a la rama `v78-google-test` (no modificar `main`).
2. Ejecutar el workflow `Build unsigned iOS IPA` en GitHub Actions.
3. Instalar la IPA mediante Sideloadly.
4. Ir a Ajustes, pulsar CERRAR SESIÓN, comprobar vibración y confirmar. Probar acceso con otra cuenta.

**Nota:** la vibración real depende del dispositivo y del soporte del plugin en iOS. La integración se ha validado estáticamente, no en un iPhone. Si aparece un error de cierre de sesión, copiar el texto mostrado debajo del botón.
