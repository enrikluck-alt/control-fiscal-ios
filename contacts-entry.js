/* R22 corregida: selección voluntaria de UN contacto mediante el selector nativo.
 * No se lee ni se sincroniza toda la agenda del teléfono.
 * En Android seleccionamos solo el número: no necesita READ_CONTACTS.
 */
import { Capacitor } from '@capacitor/core';
import { CapacitorContacts, ContactProperty } from '@capgo/capacitor-contacts';

function firstValue(values) {
  if (!Array.isArray(values)) return '';
  const item = values.find(x => x && (x.isPrimary || x.pref)) || values[0];
  return typeof item === 'string' ? item : String(item?.value ?? item?.number ?? '');
}

export function normalizePickedContact(result) {
  const contact = result?.contacts?.[0];
  if (!contact) return null; // cancelación o ninguna selección
  return {
    displayName: String(contact.displayName || [contact.givenName, contact.familyName].filter(Boolean).join(' ') || ''),
    phoneNumbers: [{ value: firstValue(contact.phoneNumbers) }].filter(x => x.value),
    emails: [{ value: firstValue(contact.emailAddresses) }].filter(x => x.value),
  };
}

export async function pickOneContact() {
  const options = Capacitor.getPlatform() === 'android'
    ? { property: ContactProperty.PhoneNumber }
    : { fields: ['displayName', 'givenName', 'familyName', 'phoneNumbers', 'emailAddresses'] };
  const result = await CapacitorContacts.pickContact(options);
  return normalizePickedContact(result);
}

window.CFNativeContactPicker = { pickContact: pickOneContact };
