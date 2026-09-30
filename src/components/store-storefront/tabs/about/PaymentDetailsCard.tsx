import React from 'react';
import { Wallet, Upload, Loader2 } from 'lucide-react';
import { StoreSettingsData } from '@/components/settings/useSettings';
import EditableCard from './EditableCard';

interface PaymentDetailsCardProps {
  readonly formData: StoreSettingsData;
  readonly onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  readonly isEditing: boolean;
  readonly saving: boolean;
  readonly onEdit: () => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
  readonly onGcashQrUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  readonly onBankQrUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

const inputClass = 'w-full px-3 py-2 bg-canvas border border-line text-ink text-sm focus:outline-none focus:border-taupe';
const labelClass = 'text-xs font-medium text-ink-body';

function Field({ id, label, name, value, onChange, placeholder }: {
  readonly id: string; readonly label: string; readonly name: string; readonly value: string;
  readonly onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; readonly placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className={labelClass}>{label}</label>
      <input id={id} name={name} type="text" value={value} onChange={onChange} placeholder={placeholder} className={inputClass} />
    </div>
  );
}

function QrSlot({ path, uploading, onUpload }: { readonly path: string; readonly uploading: boolean; readonly onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 border border-line bg-canvas overflow-hidden shrink-0 flex items-center justify-center">
        {path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={path} alt="QR code" className="w-full h-full object-contain" />
        ) : (
          <Upload size={16} className="text-ink-faint" />
        )}
      </div>
      <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-taupe hover:text-[#8A7063] bg-canvas hover:bg-sunken border border-line px-3 py-2 transition-colors">
        {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
        <span>{uploading ? 'Uploading...' : 'Upload QR'}</span>
        <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={onUpload} />
      </label>
    </div>
  );
}

export default function PaymentDetailsCard({
  formData, onChange, isEditing, saving, onEdit, onCancel, onSave, onGcashQrUpload, onBankQrUpload,
}: PaymentDetailsCardProps) {
  const [uploadingGcash, setUploadingGcash] = React.useState(false);
  const [uploadingBank, setUploadingBank] = React.useState(false);
  const hasAny = formData.gcash_number || formData.bank_name;

  return (
    <EditableCard
      icon={<Wallet size={16} className="text-taupe" />}
      title="Payment Details"
      isEditing={isEditing}
      saving={saving}
      onEdit={onEdit}
      onCancel={onCancel}
      onSave={onSave}
      editBody={
        <div className="space-y-4">
          <p className="text-xs text-ink-muted">
            Where customers send GCash/bank payments — printed on receipts. The system only tracks payment status, it never moves money itself.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field id="gcash-number" label="GCash Number" name="gcash_number" value={formData.gcash_number} onChange={onChange} placeholder="09XX XXX XXXX" />
            <Field id="gcash-name" label="GCash Account Name" name="gcash_account_name" value={formData.gcash_account_name} onChange={onChange} />
          </div>
          <QrSlot
            path={formData.gcash_qr_path}
            uploading={uploadingGcash}
            onUpload={async (e) => { setUploadingGcash(true); await onGcashQrUpload(e); setUploadingGcash(false); e.target.value = ''; }}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-line/60">
            <Field id="bank-name" label="Bank Name" name="bank_name" value={formData.bank_name} onChange={onChange} placeholder="e.g. BDO, BPI" />
            <Field id="bank-number" label="Bank Account Number" name="bank_account_number" value={formData.bank_account_number} onChange={onChange} />
            <Field id="bank-account-name" label="Bank Account Name" name="bank_account_name" value={formData.bank_account_name} onChange={onChange} />
          </div>
          <QrSlot
            path={formData.bank_qr_path}
            uploading={uploadingBank}
            onUpload={async (e) => { setUploadingBank(true); await onBankQrUpload(e); setUploadingBank(false); e.target.value = ''; }}
          />
        </div>
      }
    >
      {hasAny ? (
        <div className="space-y-1.5 text-sm">
          {formData.gcash_number && (
            <div className="flex justify-between gap-3"><span className="text-ink-muted text-xs">GCash</span><span className="text-ink-body font-medium">{formData.gcash_number} {formData.gcash_account_name && `(${formData.gcash_account_name})`}</span></div>
          )}
          {formData.bank_name && (
            <div className="flex justify-between gap-3"><span className="text-ink-muted text-xs">Bank</span><span className="text-ink-body font-medium">{formData.bank_name} — {formData.bank_account_number}</span></div>
          )}
        </div>
      ) : (
        <p className="mobile-body-sm text-ink-muted">No payment details set yet.</p>
      )}
    </EditableCard>
  );
}
