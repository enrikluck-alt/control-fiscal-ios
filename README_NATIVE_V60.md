# Control Fiscal Native V60

Cambios principales:
- Tema claro corregido en Facturación, Compras, Agenda, Inventario y modales.
- Campos Desde/Hasta del gestor se adaptan al iPhone y en pantallas pequeñas pasan a una sola columna.
- Recordatorios nativos de iPhone para documentación pendiente, con banner, sonido y lista.
- Hora de recordatorio configurable desde Ajustes (por defecto 09:00).
- Face ID nativo corregido añadiendo `NSFaceIDUsageDescription` durante la compilación.
- Se mantiene código de 4 cifras como respaldo.

## GitHub
Sustituye los archivos del proyecto por esta versión, incluyendo `.github/workflows/build-ios.yml` y `package.json`.

## Apps Script
No hay cambios de Apps Script específicos para esta versión; puedes mantener el que ya tienes funcionando.

## Notificaciones
En el iPhone, entra en Ajustes → Control Fiscal → Notificaciones y permite las notificaciones si iOS las solicita. Después, dentro de Ajustes de Control Fiscal, pulsa “Activar recordatorios”.

## Face ID
La compilación añade automáticamente `NSFaceIDUsageDescription` a `Info.plist`, requisito del plugin de Face ID para iOS.
