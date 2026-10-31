/* R30: configura solamente el ID OAuth WEB público para Android.
 * Nunca introducir una API key privada, secretos ni claves de firma aquí.
 */
const fs = require('node:fs');
const path = require('node:path');
const value = String(process.argv[2] || process.env.CF_ANDROID_WEB_CLIENT_ID || '').trim();
if (!/^\d{6,}-[a-z0-9-]+\.apps\.googleusercontent\.com$/.test(value)) {
  console.error('ERROR: facilita el ID de cliente OAuth de tipo Aplicación web (termina en .apps.googleusercontent.com).');
  console.error('Ejemplo de uso: npm run configure:android -- 123456789012-abc.apps.googleusercontent.com');
  process.exit(1);
}
const output = path.join(__dirname, '..', 'www', 'cf-android-config.js');
fs.writeFileSync(output, '/* Google OAuth Client ID WEB (público), exclusivo de Android. */\n' +
  'window.CFAndroidGoogleConfig = Object.freeze({ webClientId: ' + JSON.stringify(value) + ' });\n');
console.log('Configuración OAuth WEB Android escrita. ID de cliente no mostrado.');
