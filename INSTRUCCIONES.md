# Control Fiscal V78 — Fase 8A

## Cambios
- Menú **Ajustes** con herramientas avanzadas de Drive y diagnóstico.
- Mantiene visibles los controles de cuenta Google para iniciar sesión y recuperar el libro.
- Mantiene íntegros el puente biométrico V76, PIN, OAuth y módulos de datos.
- No borra datos ni modifica el esquema de Sheets.
- Un único archivo INSTRUCCIONES.md.

## Prueba
1. Conservar una copia del ZIP 7B.3 que funciona.
2. Sustituir el contenido de la rama `v78-google-test` con este ZIP. Eliminar archivos .md antiguos.
3. Compilar la IPA e instalarla.
4. Verificar Face ID/PIN, sesión Google, Clientes, Inventario, Compras, Facturas, Ingresos y Agenda.
5. Entrar en Ajustes y comprobar que las herramientas avanzadas están dentro del desplegable.

## Limitaciones
Esta fase reorganiza la interfaz; no es una auditoría de seguridad ni habilita emisión fiscal legal. No usar datos reales hasta completar las revisiones.
