import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { StoreSettings } from '../../types';

interface BookingPaymentSectionProps {
  storeSettings: StoreSettings | null;
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;
  paymentReference: string;
  setPaymentReference: (val: string) => void;
  paymentReceiptUrl: string;
  uploadingReceipt: boolean;
  handleReceiptUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function BookingPaymentSection({
  storeSettings,
  paymentMethod,
  setPaymentMethod,
  paymentReference,
  setPaymentReference,
  paymentReceiptUrl,
  uploadingReceipt,
  handleReceiptUpload,
}: Readonly<BookingPaymentSectionProps>) {
  if (Number(storeSettings?.fitting_fee) <= 0) return null;

  return (
    <div className="pt-4 border-t border-line space-y-3">
      <h3 className="mobile-h3 font-semibold text-ink">Fitting Reservation Fee</h3>
      <p className="mobile-body-sm text-ink-muted font-normal">
        This store charges a ₱{Number(storeSettings?.fitting_fee).toLocaleString()} fee to reserve this slot. Select how you&apos;d like to pay it.
      </p>

      <div className="grid grid-cols-4 gap-2">
        {[
          { value: 'cash', label: 'Cash' },
          { value: 'gcash', label: 'GCash' },
          { value: 'paymaya', label: 'PayMaya' },
          { value: 'bank', label: 'Bank' },
        ].map((m) => (
          <button
            type="button"
            key={m.value}
            onClick={() => setPaymentMethod(m.value)}
            className={`touch-target-44 min-h-[44px] p-2 text-center rounded-none border text-sm font-medium transition-all cursor-pointer ${
              paymentMethod === m.value
                ? 'border-taupe bg-taupe/10 text-taupe font-semibold'
                : 'border-line bg-surface text-ink-muted hover:border-taupe/40'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {paymentMethod !== 'cash' && (
        <div className="space-y-3 p-4 bg-surface border border-line rounded-none mobile-body-sm">
          {paymentMethod === 'gcash' && (storeSettings?.gcash_number || storeSettings?.gcash_qr_path) ? (
            <div>
              <p className="text-ink-muted font-normal">
                Please send payment to {storeSettings.name}&apos;s GCash:
              </p>
              {storeSettings.gcash_account_name && (
                <p className="font-semibold text-ink mt-1">{storeSettings.gcash_account_name}</p>
              )}
              {storeSettings.gcash_number && (
                <p className="font-mono text-base font-bold text-taupe mt-1">{storeSettings.gcash_number}</p>
              )}
              {storeSettings.gcash_qr_path && (
                <div className="mt-3 w-36 h-36 relative border border-line rounded-none overflow-hidden mx-auto bg-white">
                  <Image src={getMediaUrl(storeSettings.gcash_qr_path)} alt="GCash QR" fill className="object-contain p-1" />
                </div>
              )}
            </div>
          ) : paymentMethod === 'paymaya' && (storeSettings?.paymaya_number || storeSettings?.paymaya_qr_path) ? (
            <div>
              <p className="text-ink-muted font-normal">
                Please send payment to {storeSettings.name}&apos;s PayMaya:
              </p>
              {storeSettings.paymaya_account_name && (
                <p className="font-semibold text-ink mt-1">{storeSettings.paymaya_account_name}</p>
              )}
              {storeSettings.paymaya_number && (
                <p className="font-mono text-base font-bold text-taupe mt-1">{storeSettings.paymaya_number}</p>
              )}
              {storeSettings.paymaya_qr_path && (
                <div className="mt-3 w-36 h-36 relative border border-line rounded-none overflow-hidden mx-auto bg-white">
                  <Image src={getMediaUrl(storeSettings.paymaya_qr_path)} alt="PayMaya QR" fill className="object-contain p-1" />
                </div>
              )}
            </div>
          ) : paymentMethod === 'bank' && (storeSettings?.bank_account_number || storeSettings?.bank_qr_path) ? (
            <div>
              <p className="text-ink-muted font-normal">
                Please send payment to {storeSettings.name}&apos;s bank:
              </p>
              {storeSettings.bank_name && (
                <p className="font-semibold text-ink mt-1">{storeSettings.bank_name}</p>
              )}
              {storeSettings.bank_account_name && (
                <p className="text-ink-muted mt-0.5 font-normal">{storeSettings.bank_account_name}</p>
              )}
              {storeSettings.bank_account_number && (
                <p className="font-mono text-base font-bold text-taupe mt-1">{storeSettings.bank_account_number}</p>
              )}
              {storeSettings.bank_qr_path && (
                <div className="mt-3 w-36 h-36 relative border border-line rounded-none overflow-hidden mx-auto bg-white">
                  <Image src={getMediaUrl(storeSettings.bank_qr_path)} alt="Bank QR" fill className="object-contain p-1" />
                </div>
              )}
            </div>
          ) : (
            <p className="text-ink-muted italic font-normal">
              This store hasn&apos;t set up their {paymentMethod.toUpperCase()} details yet — please confirm where to send payment with the store directly.
            </p>
          )}

          <div className="space-y-3 pt-3 border-t border-line">
            <div>
              <label htmlFor="payment-ref" className="mobile-caption font-semibold text-ink-body mb-1 block">
                Reference Number (Optional)
              </label>
              <input
                id="payment-ref"
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. 100234812"
                className="w-full form-input-mobile bg-canvas border border-line rounded-none text-base text-ink font-normal focus:outline-none focus:border-taupe"
              />
            </div>
            <div>
              <label htmlFor="receipt-upload" className="mobile-caption font-semibold text-ink-body mb-1 block">
                Proof of Payment / Receipt (Optional)
              </label>
              <input
                id="receipt-upload"
                type="file"
                accept="image/*"
                onChange={handleReceiptUpload}
                className="w-full mobile-body-sm text-ink file:mr-3 file:py-2.5 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-medium file:bg-taupe file:text-white hover:file:bg-taupe-hover cursor-pointer"
              />
              {uploadingReceipt && <p className="mobile-caption text-taupe mt-1 font-normal">Uploading receipt...</p>}
              {paymentReceiptUrl && (
                <p className="mobile-caption text-emerald-600 mt-1 flex items-center gap-1 font-normal">
                  <CheckCircle2 size={14} /> Receipt attached
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
