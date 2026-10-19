# Control Fiscal V78 — Fase 4: pruebas de la capa Drive

**NO INSTALAR PARA DATOS REALES. NO HAY GOOGLE SIGN-IN NATIVO IMPLEMENTADO.**

Esta entrega contiene la base acumulada de las fases anteriores y una mejora concreta:
- Test automatizado del módulo de Drive con respuestas simuladas, ejecutable con `node tests/drive-v78.test.cjs`.
- GitHub Actions ejecuta el test antes de compilar.
- Si Sheets crea un libro pero falla la etiqueta Drive, se devuelve el ID del libro creado para evitar duplicaciones por reintentos ciegos.

**Pendiente:** Google Sign-In nativo iOS, gestión segura de tokens, integración de operaciones V77, comprobación de permisos y recuperación tras reinstalar, aislamiento de cuentas, PDF, facturación, y pruebas reales con dos cuentas.

No actualizar Apps Script V77 ni cargar información fiscal real con este paquete.
