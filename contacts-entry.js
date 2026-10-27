/* Solo se carga en las compilaciones nativas; selector de un contacto con permiso mínimo. */
import { Contacts } from '@capacitor/contacts';
window.CFNativeContactPicker = {pickContact: () => Contacts.pickContact()};
