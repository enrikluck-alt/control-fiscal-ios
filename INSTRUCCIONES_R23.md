# Instalar Control Fiscal R23 desde Windows

1. Extrae este ZIP completo en una carpeta nueva.
2. En GitHub, sube **todo el contenido** a la rama `v78-google-test`, incluidos `.github/`, `www/`, `tools/`, `tests/`, `package.json` y `contacts-entry.js`.
3. En Actions → `Build unsigned iOS IPA` → `Run workflow`, selecciona `v78-google-test`.
4. Descarga el artefacto `ControlFiscal-V76-Google-R23-Admin-Agenda-Fechas-IPA` cuando GitHub muestre todos los pasos en verde.
5. Instala con Sideloadly como en versiones anteriores y verifica en Ajustes `UI76-20261027-R23`.
6. Abre una cuenta de usuario normal: en Ajustes → Sugerencias y errores **no** debe aparecer nada de administración.
7. Abre la cuenta administradora que tiene tu UID configurado en las reglas de Firestore: al estar conectada a Google y Firebase, en Ajustes → Sugerencias y errores aparecerá automáticamente `ADMINISTRACIÓN · BUZÓN DE SUGERENCIAS`, sin botón de prueba.
8. Prueba Agenda con un día que contenga muchos movimientos: verás puntos de colores y `+N`. Pulsa `+N` para ver el listado y entrar al registro original.
9. Revisa los selectores de fecha del gestor, del ingreso independiente, facturas de material, compras y edición de Agenda en vertical y horizontal.

## Configuración y privacidad

- No hace falta desplegar de nuevo el panel web de Firebase Hosting.
- No hace falta modificar las reglas de Firestore que ya publicaste, siempre que el UID administrador esté configurado correctamente.
- **No vuelvas a publicar directamente `firestore.rules` desde el ZIP**, porque contiene el marcador genérico `REEMPLAZAR_UID_ADMIN` y sobrescribiría el UID real de tu proyecto.
- El administrador solo puede leer las sugerencias que autorizan las reglas de Firestore; no obtiene acceso a libros fiscales de otros usuarios.
- La autorización automática usa el token Firebase ya obtenido durante el inicio de sesión Google. Si Firebase aún no ha autenticado ese inicio, el enlace no aparece; no se muestra una espera interminable ni una opción manual a los usuarios normales.

Esta revisión incluye solamente `CAMBIOS_R23.md` e `INSTRUCCIONES_R23.md` entre los documentos de versión. No contiene los `.md` antiguos.
