# Control Fiscal V78 — Fase 8E (candidata de diagnóstico)

Base: Fase 8C proporcionada por el usuario. No modificar `main`; subir a la rama `v78-google-test`.

Cambios: se restaura la pantalla inicial V77 sin mover nodos de la interfaz durante el arranque; los módulos Google se abren solo al pulsar. La opción `CapacitorHttp.enabled` pasa a `false` para evitar la interceptación global de `fetch`/XHR. Las llamadas explícitas a `CapacitorHttpNative` siguen existiendo.

**Importante:** la causa nativa `swift_dynamicCastFailure` del informe IPS no está confirmada; esta versión es una prueba controlada, no una reparación demostrada. Si vuelve a cerrarse, obtener un nuevo informe IPS.

Primero comprobar que abre; luego Ajustes → Conectar cuenta Google y Google Sheets; finalmente módulos. La Fase 8C es el respaldo.
