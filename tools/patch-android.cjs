/* R30: aplica los ajustes Android a la plataforma recién creada por Capacitor.
 * Puede ejecutarse más de una vez sin duplicar configuraciones.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const appDir = path.join(root, 'android/app');
const manifest = path.join(appDir, 'src/main/AndroidManifest.xml');
if (!fs.existsSync(manifest)) {
  console.error('ERROR: falta android/. Ejecuta npx cap add android antes de este paso.');
  process.exit(1);
}
let xml = fs.readFileSync(manifest,'utf8');
const permissions = [
  'android.permission.INTERNET',
  'android.permission.POST_NOTIFICATIONS',
];
for (const name of permissions) {
  if (!xml.includes(`android:name="${name}"`)) {
    xml = xml.replace(/<application\b/, `    <uses-permission android:name="${name}" />\n    <application`);
  }
}
// Evita reescribir permisos existentes del proyecto o solicitar lectura íntegra de la agenda.
fs.writeFileSync(manifest, xml);

const javaFile = path.join(appDir, 'src/main/java/com/chispassound/controlfiscal/MainActivity.java');
if (fs.existsSync(javaFile)) {
  // Integración indicada por el plugin SocialLogin para manejar callbacks nativos.
  const java = `package com.chispassound.controlfiscal;

import android.content.Intent;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;
import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {
    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN &&
            requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            PluginHandle handle = getBridge().getPlugin("SocialLogin");
            if (handle == null) {
                Log.i("ControlFiscal", "SocialLogin no registrado");
                return;
            }
            Plugin plugin = handle.getInstance();
            if (plugin instanceof SocialLoginPlugin) {
                ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
            }
        }
    }
    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
}
`;
  fs.writeFileSync(javaFile, java);
  console.log('MainActivity.java adaptada para SocialLogin.');
} else {
  console.warn('AVISO: MainActivity.java no encontrada en la ruta esperada; revísala en Android Studio.');
}
console.log('Manifest Android actualizado (Internet y notificaciones; sin acceso completo a contactos).');
