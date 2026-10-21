# Control Fiscal V78 — Fase 8D (interfaz original)

- Sube el contenido de este ZIP a la rama `v78-google-test` (no a `main`).
- Compila en GitHub Actions e instala la IPA con Sideloadly.
- Al abrir la aplicación debe aparecer directamente la pantalla original V77: logo, tarjetas amarilla/morada/blancas y barra inferior fija.
- En **Ajustes > Cuenta Google y almacenamiento personal** inicia sesión y pulsa **Buscar mi libro automáticamente**. No se crea otro libro si ya existe.
- Compras, Facturación, Agenda, Stock y Clientes usan los formularios V78 conectados a Sheets, dentro del marco original. No se habilita el Apps Script antiguo.
- Los registros históricos V77 del resumen no se muestran como datos reales. La generación de facturas legales y Face ID nativo siguen pendientes.
- Prueba inicio, barra inferior, Ajustes, conexión Google y lectura/escritura de un registro ficticio. Si un módulo no se abre, conserva la IPA anterior para volver atrás.
