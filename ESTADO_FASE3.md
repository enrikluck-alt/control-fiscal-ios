# Control Fiscal V78 — Fase 3: capa experimental Drive/Sheets

**NO APTO PARA DATOS REALES NI PARA DISTRIBUCIÓN.**

## Implementado
- `www/drive-v78.js`: solicitudes Google Drive v3 / Sheets v4 usando un token OAuth de usuario (no de administrador).
- Descubrimiento de hojas etiquetadas con `appProperties.controlFiscalVersion=78`.
- Creación de un libro nuevo en el Drive del usuario con pestañas provisionales y etiquetado para recuperación tras reinstalación.
- Lectura y añadido de filas básicos, todavía sin adaptar al esquema V77.
- Si hay varios libros V78, se detiene para evitar escoger uno arbitrariamente.

## Sin implementar (bloqueante)
- Login Google nativo iOS, token OAuth y refresh seguro. NO HAY TOKEN NI LOGIN CONECTADO.
- Confirmar comportamiento de `drive.file` para descubrimiento tras reinstalar, en un dispositivo real.
- Conectar las funciones reales de compras/facturas/inventario/agenda a este módulo.
- Migrar estructura completa de datos V77 (las pestañas actuales son solo marcadores).
- Aislar por completo los caminos JSONP y caché local de V77.
- Concurrencia de altas y escrituras, permisos de administrador, facturación legal, backup y pruebas con dos cuentas.

La V77 continúa bloqueada y este módulo no se invoca automáticamente. No introducir información real.
