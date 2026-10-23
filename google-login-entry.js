/* Plugins nativos enlazados con esbuild; nunca se imprimen tokens. */
import { SocialLogin } from '@capgo/capacitor-social-login';
import { Haptics } from '@capacitor/haptics';
window.ControlFiscalSocialLogin = SocialLogin;

window.CFHaptics = Haptics;

import { LocalNotifications } from '@capacitor/local-notifications';
window.CFLocalNotifications = LocalNotifications;

import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { jsPDF } from 'jspdf';
window.CFApp = App;
window.CFBrowser = Browser;
window.CFBiometricAuth = BiometricAuth;
window.CFFilesystem = Filesystem;
window.CFDirectory = Directory;
window.CFShare = Share;
window.CFjsPDF = jsPDF;

import { ScreenOrientation } from '@capacitor/screen-orientation';
window.CFScreenOrientation = ScreenOrientation;
