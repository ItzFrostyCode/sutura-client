import React, { useState, useEffect } from 'react';
import { Wallet, X, Copy, Check, QrCode } from 'lucide-react';
import EditableCard from './EditableCard';
import PaymentChannelEdit from './PaymentChannelEdit';
import PaymentChannelView from './PaymentChannelView';
import { getMediaUrl } from '@/lib/media';

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

  const [modalCopied, setModalCopied] = useState(false);

  // Lock background scrolling completely while the QR modal is open
  useEffect(() => {
    if (zoomQr) {
      const prevOverflow = document.body.style.overflow;
      const prevTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.touchAction = prevTouchAction;
      };
    }
  }, [zoomQr]);

  const handleCopyModalNumber = async () => {
    if (!zoomQr?.number) return;
    try {
      await navigator.clipboard.writeText(zoomQr.number);
      setModalCopied(true);
      setTimeout(() => setModalCopied(false), 2000);
    } catch {
      // clipboard blocked
    }
  };

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

      {/* High-Resolution QR Zoom Lightbox Modal */}
      {zoomQr && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${zoomQr.title} QR Code preview`}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 overscroll-none touch-none select-none animate-in fade-in duration-150"
          onClick={() => {
            setZoomQr(null);
            setModalCopied(false);
          }}
          onTouchMove={(e) => e.preventDefault()}
        >
          <div
            className="bg-surface rounded-2xl max-w-[360px] sm:max-w-[400px] w-full p-4 sm:p-4.5 text-center space-y-2.5 shadow-2xl border border-line overflow-hidden flex flex-col shrink-0 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-line">
              <div className="flex items-center gap-2">
                <QrCode size={17} className="text-taupe" />
                <h4 className="text-sm font-bold text-ink">{zoomQr.title} QR Code</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setZoomQr(null);
                  setModalCopied(false);
                }}
                aria-label="Close QR zoom"
                className="w-8 h-8 rounded-full hover:bg-canvas flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* High-Resolution QR Container (Edge-to-edge width, fits viewport without scroll) */}
            <div className="w-full flex items-center justify-center shrink-1 min-h-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getMediaUrl(zoomQr.url)}
                alt={`${zoomQr.title} QR Code`}
                className="w-full max-h-[48vh] sm:max-h-[52vh] object-contain rounded-xl shadow-xs border border-line/60"
              />
            </div>

            {/* Account Info inside Modal */}
            <div className="space-y-1.5 pt-1 text-left bg-canvas/50 p-2.5 rounded-xl border border-line/60 shrink-0">
              {zoomQr.name && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-muted">Account Name:</span>
                  <span className="font-bold text-ink truncate">{zoomQr.name}</span>
                </div>
              )}
              {zoomQr.number && (
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-ink-muted">Number:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-ink select-all">
                      {zoomQr.number}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyModalNumber}
                      className="p-1 hover:bg-sunken rounded text-ink-muted hover:text-ink transition-colors cursor-pointer"
                      title="Copy number"
                      aria-label="Copy number"
                    >
                      {modalCopied ? (
                        <Check size={13} className="text-emerald-600" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-ink-muted shrink-0">
              Scan the QR code or enter / copy the number to pay.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
