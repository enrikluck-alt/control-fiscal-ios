# Control Fiscal V78 — Fase 8F: diagnóstico nativo mínimo

Esta versión es una PRUEBA DE AISLAMIENTO, no una versión funcional de Control Fiscal. Está basada en el ZIP 8C proporcionado por el usuario.

## Qué contiene
- `www/index.html`: pantalla local mínima. Sin OAuth, Google Sheets, peticiones de red ni módulos fiscales.
- Dependencias nativas: únicamente `@capacitor/core` y `@capacitor/ios` 8.5.2.
- `respaldo_www_8c/`: copia íntegra del frontend 8C; NO se carga ni se empaqueta como interfaz.
- Se mantiene el `appId` original para comprobar el mismo contexto de instalación; la nueva IPA sustituirá a la anterior.
- No modifica ni borra ningún documento de Google Drive.

## Compilación
1. Usa solo la rama `v78-google-test` (NO `main`). Sube los archivos del ZIP respetando rutas, eliminando archivos antiguos de la rama que no estén en este ZIP, especialmente el viejo contenido de `www` y cualquier carpeta `ios` generada.
2. GitHub → Actions → `Build iOS Fase 8F - Diagnostico sin plugins` → Run workflow.
3. Descarga el artefacto `ControlFiscal-IPA`, extrae `ControlFiscal.ipa` e instálalo con Sideloadly.
4. Abre la aplicación sin tocar nada. Si permanece abierta, pulsa `Comprobar puente de Capacitor`.
5. Comunica si se mantiene abierta y qué muestra la prueba. Si se cierra, adjunta el nuevo archivo `.ips`.

## Interpretación
- Si la pantalla se mantiene abierta: el núcleo nativo básico puede arrancar; el fallo probablemente depende de un plugin, configuración o inicialización eliminados de esta prueba. NO identifica aún el responsable.
- Si se cierra: el problema también se reproduce sin plugins adicionales ni JS fiscal; hay que revisar firma, iOS, Capacitor y registros nativos.

**No borrar la app para probar salvo necesidad**: una desinstalación completa puede eliminar datos locales. Los datos en Google Sheets permanecen independientes.

## Corrección 8F1 del error `Missing script: build:google`
El fallo anterior ocurrió porque se ejecutó el workflow ANTIGUO «Build Google native login JS bundle», que todavía llamaba a `npm run build:google`.

**Selecciona expresamente** en GitHub Actions el workflow **«Build iOS Fase 8F1 - Diagnostico CORREGIDO»**. Si sigue apareciendo el paso «Build Google native login JS bundle», estás ejecutando el workflow antiguo o no has sustituido `.github/workflows/build-ios.yml` en la rama correcta.

Se añade además un script `build:google` de compatibilidad que crea un archivo JavaScript inerte, sin login ni llamadas de red, para evitar el error de script inexistente si accidentalmente se ejecuta un workflow anterior. El workflow de diagnóstico 8F1 no llama a ese script y comprueba que no exista el bundle.

Comprueba que la ejecución de Actions corresponde a `v78-google-test` y al commit que acabas de subir.
