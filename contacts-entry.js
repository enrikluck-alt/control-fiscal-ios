/* Control Fiscal R26: native contact phone picker; one explicitly chosen phone only.
 * No address book enumeration or background upload.
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
  if (!contact) return null;
  const phone = firstValue(contact.phoneNumbers);
  return {
    displayName: String(contact.displayName || [contact.givenName, contact.familyName].filter(Boolean).join(' ') || ''),
    phoneNumbers: phone ? [{ value: phone }] : [],
    emails: [{ value: firstValue(contact.emailAddresses) }].filter(x => x.value),
  };
}
export async function pickOneContact() {
  if (Capacitor.getPlatform() === 'web') throw Error('El selector de contactos requiere iOS o Android.');
  // On both platforms the property picker is permissionless and shows the native UI.
  // It avoids returning the full phone book and does not need contacts permission.
  const result = await CapacitorContacts.pickContact({ property: ContactProperty.PhoneNumber });
  return normalizePickedContact(result);
}
window.CFNativeContactPicker = { pickContact: pickOneContact };
