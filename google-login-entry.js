/* Plugins nativos enlazados con esbuild; nunca se imprimen tokens. */
import { SocialLogin } from '@capgo/capacitor-social-login';
import { Haptics } from '@capacitor/haptics';
window.ControlFiscalSocialLogin = SocialLogin;

window.CFHaptics = Haptics;
