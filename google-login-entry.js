/* Plugins nativos enlazados con esbuild; nunca se imprimen tokens. */
import { SocialLogin } from '@capgo/capacitor-social-login';
import { CapacitorHttp } from '@capacitor/core';
window.ControlFiscalSocialLogin = SocialLogin;
window.CapacitorHttpNative = CapacitorHttp;
