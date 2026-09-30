// Where shop owners pay SUTURA (shop application fee and plan upgrades).
// Override with NEXT_PUBLIC_SUTURA_GCASH_NUMBER / NEXT_PUBLIC_SUTURA_GCASH_NAME.
export const PLATFORM_GCASH = {
  number: process.env.NEXT_PUBLIC_SUTURA_GCASH_NUMBER || '09777044683',
  name: process.env.NEXT_PUBLIC_SUTURA_GCASH_NAME || 'JWA',
};
