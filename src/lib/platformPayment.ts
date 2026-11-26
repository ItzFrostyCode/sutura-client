// Where shop owners pay SUTURA (shop application fee and plan upgrades).
// Override with NEXT_PUBLIC_SUTURA_GCASH_NUMBER / NEXT_PUBLIC_SUTURA_GCASH_NAME / NEXT_PUBLIC_SUTURA_QR_IMAGE.
export const PLATFORM_GCASH = {
  number: process.env.NEXT_PUBLIC_SUTURA_GCASH_NUMBER || '09777844683',
  name: process.env.NEXT_PUBLIC_SUTURA_GCASH_NAME || 'J.WA',
  // The GCash QR image (the same one the Thread & Needle demo shop shows on its About tab). GCash only: no Maya, no bank.
  qrImage: process.env.NEXT_PUBLIC_SUTURA_QR_IMAGE || '/images/gcash_merchant_qr.png',
};
