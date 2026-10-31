# Control Fiscal R30 — adaptación Android

- Partiendo de R29, se añade plataforma Android 8.5.2 con configuración de autenticación Google separada por sistema.
- Añadido workflow GitHub Actions `build-android.yml` para APK de prueba y SHA-1.
- Incluido `PREPARAR_ANDROID_WINDOWS.bat` para abrir el proyecto en Android Studio.
- Incluidas las herramientas `configure-android-google.cjs` y `patch-android.cjs`.
- Se mantienen Firebase, Firestore, Drive, Sheets, interfaz y workflow iOS sin cambios funcionales.
- La configuración de Web OAuth Android requiere un ID real proporcionado por el propietario; no se inventan credenciales.
- No se incluye APK ni AAB firmado; es una preparación verificable mediante compilación externa.
