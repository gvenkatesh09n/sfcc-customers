import { Customer } from './customer.entity';

/**
 * Entity field -> SFCC payload key, as built by
 * int_google_pubsub/.../events/customerRegistrationEvent + CustomerRegistrationHelper.
 * (Note SFCC's inconsistent casing, e.g. `Customer_addresses_address_country-code`, `Language`.)
 */
export const SFCC_FIELD_MAP: Record<string, string> = {
  customerNo: 'customer__customer-no',
  firstName: 'customer__profile__first-name',
  lastName: 'customer__profile__last-name',
  email: 'customer_profile_email',
  phone: 'customer_addresses_address_phone',
  companyName: 'customer_addresses_address_company-name',
  billingCountry: 'Customer_addresses_address_country-code',
  sellingCountry: 'country__code',
  address1: 'customer_addresses_address_address1',
  address2: 'customer_addresses_address_address2',
  postalCode: 'customer_addresses_address_postal-code',
  city: 'customer_addresses_address_city',
  stateCode: 'customer__addresses__address__state-code',
  region: 'customer_addresses_address_region',
  district: 'customer_addresses_address_district',
  vat: 'vat',
  language: 'Language',
  sapDebtorId: 'sapDebtorId',
  sapCustomerNo: 'sapCustomerNo',
};

/** Map an SFCC payload to Customer columns. SFCC sends '' for empty values -> null. */
export function mapSfccPayload(
  payload: Record<string, unknown>,
): Partial<Customer> {
  const out: Record<string, string | null> = {};
  for (const [field, sfccKey] of Object.entries(SFCC_FIELD_MAP)) {
    const raw = payload[sfccKey];
    if (raw === undefined || raw === null || raw === '') {
      out[field] = null;
    } else if (typeof raw === 'object') {
      out[field] = JSON.stringify(raw);
    } else {
      out[field] = String(raw as string | number | boolean);
    }
  }
  return out as Partial<Customer>;
}
