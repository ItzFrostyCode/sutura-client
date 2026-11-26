import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import EditableCard from './EditableCard';
import PaymentChannelEdit from './PaymentChannelEdit';
import PaymentChannelView from './PaymentChannelView';
import QrZoomModal from './QrZoomModal';

interface PaymentDetailsData {
  gcash_number?: string | null;
  gcash_account_name?: string | null;
  gcash_qr_path?: string | null;
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
  readonly onRemoveGcashQr?: () => void;
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
  onRemoveGcashQr,
}: PaymentDetailsCardProps) {
  const [zoomQr, setZoomQr] = useState<{
    url: string;
    title: string;
    number?: string | null;
    name?: string | null;
  } | null>(null);

  return (
    <>
      <EditableCard
        icon={<Wallet size={16} className="text-taupe" />}
        title="Payment Method"
        isEditing={isEditing}
        saving={saving}
        canEdit={canEdit}
        onEdit={onEdit}
        onCancel={onCancel}
        onSave={onSave}
        editBody={
          <div className="space-y-4">
            <p className="text-xs text-ink-muted">
              Configure your shop GCash payment details for customer payments and deposits.
            </p>

            <PaymentChannelEdit
              title="GCash"
              badgeLabel="Direct Payment"
              dotColor="#005CE6"
              numberId="gcash-number"
              numberName="gcash_number"
              numberLabel="Number"
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
          </div>
        }
      >
        <PaymentChannelView
          title="GCash"
          brandColor="#005CE6"
          numberLabel="Number"
          numberValue={formData.gcash_number}
          nameValue={formData.gcash_account_name}
          qrPath={formData.gcash_qr_path}
          onPreviewQr={(url, title, num, name) =>
            setZoomQr({ url, title, number: num, name })
          }
        />
      </EditableCard>

      <QrZoomModal qr={zoomQr} onClose={() => setZoomQr(null)} />
    </>
  );
}
