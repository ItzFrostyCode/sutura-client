import React, { useState } from 'react';
import { Wallet, X } from 'lucide-react';
import EditableCard from './EditableCard';
import PaymentChannelEdit from './PaymentChannelEdit';
import PaymentChannelView from './PaymentChannelView';

interface PaymentDetailsData {
  gcash_number?: string | null;
  gcash_account_name?: string | null;
  gcash_qr_path?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
  bank_qr_path?: string | null;
}

interface PaymentDetailsCardProps {
  readonly formData: PaymentDetailsData;
  readonly onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly isEditing?: boolean;
  readonly saving?: boolean;
  readonly canEdit?: boolean;
  readonly onEdit?: () => void;
  readonly onCancel?: () => void;
  readonly onSave?: () => void;
  readonly onGcashQrUpload?: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  readonly onBankQrUpload?: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  readonly onRemoveGcashQr?: () => void;
  readonly onRemoveBankQr?: () => void;
}

export default function PaymentDetailsCard({
  formData,
  onChange,
  isEditing = false,
  saving = false,
  canEdit = true,
  onEdit,
  onCancel,
  onSave,
  onGcashQrUpload,
  onBankQrUpload,
  onRemoveGcashQr,
  onRemoveBankQr,
}: PaymentDetailsCardProps) {
  const [zoomQr, setZoomQr] = useState<{ url: string; title: string } | null>(null);

  const hasGcash = Boolean(formData.gcash_number || formData.gcash_qr_path);
  const hasQrPh = Boolean(formData.bank_account_number || formData.bank_qr_path);
  const hasAny = hasGcash || hasQrPh;

  return (
    <>
      <EditableCard
        icon={<Wallet size={16} className="text-taupe" />}
        title="Payment Details"
        isEditing={isEditing}
        saving={saving}
        canEdit={canEdit}
        onEdit={onEdit}
        onCancel={onCancel}
        onSave={onSave}
        editBody={
          <div className="space-y-4">
            <p className="text-xs text-ink-muted">
              Where customers send payments (printed on receipts and available on your store profile).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: GCash / Maya */}
              <PaymentChannelEdit
                title="GCash / Maya"
                badgeLabel="E-Wallet"
                badgeColor="blue"
                dotColor="#0057e0"
                numberId="gcash-number"
                numberName="gcash_number"
                numberLabel="GCash / Maya Number"
                numberPlaceholder="09XX XXX XXXX"
                numberValue={formData.gcash_number || ''}
                nameId="gcash-name"
                nameName="gcash_account_name"
                nameValue={formData.gcash_account_name || ''}
                qrPath={formData.gcash_qr_path}
                onUpload={onGcashQrUpload}
                onRemoveQr={onRemoveGcashQr}
                onChange={onChange}
              />

              {/* Right Column: QR Ph */}
              <PaymentChannelEdit
                title="QR Ph"
                badgeLabel="All Banks & Wallets"
                badgeColor="amber"
                dotColor="#e52427"
                numberId="qrph-number"
                numberName="bank_account_number"
                numberLabel="Account / QR Ph Number"
                numberPlaceholder="09XX XXX XXXX or Account #"
                numberValue={formData.bank_account_number || ''}
                nameId="qrph-name"
                nameName="bank_account_name"
                nameValue={formData.bank_account_name || ''}
                qrPath={formData.bank_qr_path}
                onUpload={onBankQrUpload}
                onRemoveQr={onRemoveBankQr}
                onChange={onChange}
              />
            </div>
          </div>
        }
      >
        {hasAny ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PaymentChannelView
              title="GCash / Maya"
              badgeLabel="E-Wallet"
              badgeColor="blue"
              dotColor="#0057e0"
              numberLabel="GCash / Maya Number"
              numberValue={formData.gcash_number}
              nameValue={formData.gcash_account_name}
              qrPath={formData.gcash_qr_path}
              onPreviewQr={(url, title) => setZoomQr({ url, title })}
            />

            <PaymentChannelView
              title="QR Ph"
              badgeLabel="All Banks & Wallets"
              badgeColor="amber"
              dotColor="#e52427"
              numberLabel="Account / QR Ph Number"
              numberValue={formData.bank_account_number}
              nameValue={formData.bank_account_name}
              qrPath={formData.bank_qr_path}
              onPreviewQr={(url, title) => setZoomQr({ url, title })}
            />
          </div>
        ) : (
          <p className="mobile-body-sm text-ink-muted">No payment details set yet.</p>
        )}
      </EditableCard>

      {/* QR Zoom Preview Modal */}
      {zoomQr && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${zoomQr.title} QR Code preview`}
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          onClick={() => setZoomQr(null)}
        >
          <div
            className="bg-surface rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-line"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h4 className="text-sm font-bold text-ink">{zoomQr.title} QR Code</h4>
              <button
                type="button"
                onClick={() => setZoomQr(null)}
                className="w-8 h-8 rounded-full hover:bg-canvas flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="bg-white p-3 rounded-xl border border-line flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={zoomQr.url} alt={`${zoomQr.title} QR Code`} className="w-64 h-64 object-contain" />
            </div>
            <p className="text-xs text-ink-muted">Scan using GCash, Maya, or any QR Ph banking app</p>
          </div>
        </div>
      )}
    </>
  );
}
