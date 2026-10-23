import React from 'react';
import { Loader2, Upload } from 'lucide-react';
import { PLAIN_FIELD, BTN_SM } from '@/components/shared/plainForm';

interface Props {
  readonly method: string;
  readonly reference: string;
  readonly setReference: (r: string) => void;
  readonly receiptUrl: string;
  readonly setReceiptUrl: (u: string) => void;
  readonly uploadingReceipt: boolean;
  readonly setUploadingReceipt: (v: boolean) => void;
  readonly uploadReceipt: (file: File | undefined, onDone: (url: string) => void, setUploading: (v: boolean) => void) => Promise<void>;
}

const LABEL = 'text-sm font-medium text-ink';

const COPY: Record<string, { reference: string; proof: string; attach: string; placeholder: string }> = {
  gcash: { reference: 'GCash reference no.', proof: 'GCash receipt screenshot', attach: 'Attach screenshot', placeholder: 'e.g. 9021 849 2049' },
  paymaya: { reference: 'Maya reference no.', proof: 'Maya receipt screenshot', attach: 'Attach screenshot', placeholder: 'e.g. 9021 849 2049' },
  other: { reference: 'Reference no. (optional)', proof: 'Proof of payment (photo)', attach: 'Attach photo', placeholder: 'e.g. transfer or check no.' },
};

/** Reference number and receipt screenshot for GCash, Maya and other payments. */
export function CashierNonCashPanel({ method, reference, setReference, receiptUrl, setReceiptUrl, uploadingReceipt, setUploadingReceipt, uploadReceipt }: Props) {
  const copy = COPY[method] ?? COPY.other;
  return (
    <div className="space-y-4 rounded-xl bg-sunken/70 p-4">
      <div className="space-y-1.5">
        <label htmlFor="ref-no" className={`${LABEL} block`}>{copy.reference}</label>
        <input id="ref-no" type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder={copy.placeholder} className={PLAIN_FIELD} />
      </div>

      <div className="space-y-1.5">
        <span className={`${LABEL} block`}>{copy.proof} <span className="text-danger">*</span></span>
        {receiptUrl ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={receiptUrl} alt={copy.proof} className="h-20 w-20 rounded-xl object-cover" />
            <label className={`${BTN_SM} ${uploadingReceipt ? 'opacity-40' : ''}`}>
              {uploadingReceipt && <Loader2 size={14} className="animate-spin" />}
              <span>Change</span>
              <input type="file" accept="image/*" className="hidden" disabled={uploadingReceipt} onChange={(e) => uploadReceipt(e.target.files?.[0], setReceiptUrl, setUploadingReceipt)} />
            </label>
            <button type="button" onClick={() => setReceiptUrl('')} className="min-h-11 cursor-pointer text-[13px] font-medium text-rose-600 hover:underline">Remove</button>
          </div>
        ) : (
          <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-surface text-[13px] font-medium text-ink-muted transition-colors hover:bg-sunken">
            {uploadingReceipt ? <Loader2 size={15} className="animate-spin text-taupe" /> : <Upload size={15} />}
            <span>{uploadingReceipt ? 'Uploading…' : copy.attach}</span>
            <input type="file" accept="image/*" className="hidden" disabled={uploadingReceipt} onChange={(e) => uploadReceipt(e.target.files?.[0], setReceiptUrl, setUploadingReceipt)} />
          </label>
        )}
      </div>
    </div>
  );
}
