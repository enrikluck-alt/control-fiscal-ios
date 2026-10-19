# Control Fiscal V78 — Fase 1 (preparación, NO apta para datos reales)

Este paquete conserva el frontend V77 y configura en el flujo de compilación iOS el esquema URL de retorno del cliente Google OAuth iOS. Incluye `oauth-config.json` con los identificadores públicos. **No implementa todavía inicio de sesión Google**, creación de tablas en el Drive del usuario ni aislamiento del backend. No debe desplegarse como V78 final ni utilizarse con datos fiscales reales.

## Trabajo pendiente imprescindible
1. Integrar flujo OAuth nativo iOS mediante SDK/plugin mantenido y validar `state`/PKCE según el flujo elegido, manejo seguro de credenciales y cierre de sesión.
2. Reemplazar la autenticación V77 (correo/contraseña propia y sesión de Apps Script central).
3. Sustituir las operaciones de Sheets/Drive hechas por Apps Script ejecutándose como administrador por operaciones autorizadas por **cada usuario**. No basta con crear carpetas individuales.
4. Inventariar y migrar **todas** las acciones del frontend: compras, facturación/PDF, inventario, proveedores, agenda, adjuntos, etc.; conservar PIN/Face ID.
5. Diseñar creación y descubrimiento del libro propio, incluyendo reinstalaciones, revocación de permisos, archivos duplicados y cuotas. Probar el alcance real de `drive.file`.
6. Crear canal separado de metadatos y sugerencias para administración, sin acceso a documentos fiscales.
7. Pruebas con dos cuentas reales distintas, restauración en otro dispositivo, aislamiento, copias de seguridad y validación de facturación legal.

## Estado
Solo fase de preparación. El Apps Script V77 **no se incluye como backend de producción V78**, porque su arquitectura centralizada no cumple el requisito de privacidad del nuevo diseño.
