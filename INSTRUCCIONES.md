# Control Fiscal V78 — Fase 7B.3

## Cambio respecto a 7B.2
Se recupera la detección del plugin nativo usada en V76 (`Capacitor.Plugins.BiometricAuthNative` y alternativa `BiometricAuth`) con compatibilidad para `internalAuthenticate`, manteniendo como respaldo `registerPlugin`.

GitHub Actions ahora comprueba que `AparajitaCapacitorBiometricAuth` aparece en `ios/App/CapApp-SPM/Package.swift` después de `cap sync ios`. Si falta, la compilación falla con un mensaje explícito. Conserva Google OAuth, los módulos fiscales y el PIN existentes.

## Prueba controlada
1. Sustituir archivos en rama `v78-google-test` y borrar `.md` antiguos; dejar solo `INSTRUCCIONES.md`.
2. Ejecutar GitHub Actions. Confirmar el paso **Verify native biometric dependency (V76)**.
3. Si la compilación finaliza, instalar la IPA y comprobar Face ID. Si falla, compartir el texto exacto del paso fallido.
4. No utilizar datos fiscales reales hasta completar la revisión de seguridad.

Nota: la verificación de SPM confirma registro de dependencia, no prueba por sí sola el funcionamiento del diálogo nativo en el iPhone.
