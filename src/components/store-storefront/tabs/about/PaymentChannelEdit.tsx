import React, { useState } from 'react';
import { QrCode, Upload, Loader2, X } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';

interface ProviderNameField {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly placeholder: string;
  readonly value: string;
}

interface PaymentChannelEditProps {
  readonly title: string;
  readonly badgeLabel: string;
  readonly badgeClass?: string;
  readonly dotColor: string;
  readonly numberId: string;
  readonly numberName: string;
  readonly numberLabel: string;
  readonly numberPlaceholder: string;
  readonly numberValue: string;
  readonly nameId: string;
  readonly nameName: string;
  readonly nameValue: string;
  readonly providerField?: ProviderNameField;
  readonly qrPath?: string | null;
  readonly onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  readonly onRemoveQr?: () => void;
  readonly onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PaymentChannelEdit({
  title,
  badgeLabel,
  badgeClass = 'bg-blue-50 text-blue-700 border-blue-200',
  dotColor,
  numberId,
  numberName,
  numberLabel,
  numberPlaceholder,
  numberValue,
  nameId,
  nameName,
  nameValue,
  providerField,
  qrPath,
  onUpload,
  onRemoveQr,
  onChange,
}: PaymentChannelEditProps) {
  const [uploading, setUploading] = useState(false);

  return (
    <div className="p-4 rounded-xl border border-line bg-canvas/40 space-y-3.5">
      {/* Channel Header */}
      <div className="flex items-center justify-between pb-2 border-b border-line/60">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
          <span className="text-sm font-bold text-ink">{title}</span>
        </div>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${badgeClass}`}>
          {badgeLabel}
        </span>
      </div>

      {/* Main Channel Layout */}
      <div className="flex flex-col min-[440px]:flex-row gap-4 items-start pt-0.5">
        {/* Left: QR Upload (explicitly marked optional) */}
        <div className="flex flex-col items-center shrink-0 w-full min-[440px]:w-32">
          <div className="relative w-28 h-28 min-[440px]:w-32 min-[440px]:h-32 rounded-xl border border-line bg-surface flex items-center justify-center overflow-hidden shadow-xs">
            {qrPath ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getMediaUrl(qrPath)} alt={`${title} QR Code`} className="w-full h-full object-contain p-1.5" />
                {onRemoveQr && (
                  <button
                    type="button"
                    onClick={onRemoveQr}
                    title="Remove QR code"
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-ink-faint p-2 text-center select-none">
                <QrCode size={28} strokeWidth={1.5} />
                <span className="text-[11px] mt-1 font-medium text-ink-muted">No QR image</span>
                <span className="text-[10px] text-ink-faint">(Optional)</span>
              </div>
            )}
          </div>

          <label className="w-full mt-2 inline-flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold text-taupe hover:text-white hover:bg-taupe bg-surface border border-line px-2.5 py-2 rounded-lg transition-colors min-h-[44px]">
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            <span>{uploading ? 'Uploading...' : (qrPath ? 'Replace QR' : 'Upload QR')}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={async (e) => {
                if (onUpload) {
                  setUploading(true);
                  await onUpload(e);
                  setUploading(false);
                  e.target.value = '';
                }
              }}
            />
          </label>
        </div>

        {/* Right: Inputs */}
        <div className="flex-1 min-w-0 space-y-3 w-full">
          {providerField && (
            <div className="space-y-1">
              <label htmlFor={providerField.id} className="block text-xs font-semibold text-ink-body">
                {providerField.label} <span className="text-ink-faint text-[11px] font-normal">(Optional)</span>
              </label>
              <input
                id={providerField.id}
                name={providerField.name}
                type="text"
                value={providerField.value}
                onChange={onChange}
                placeholder={providerField.placeholder}
                className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink text-base sm:text-sm focus:outline-none focus:border-taupe min-h-[48px]"
              />
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor={numberId} className="block text-xs font-semibold text-ink-body">
              {numberLabel}
            </label>
            <input
              id={numberId}
              name={numberName}
              type="text"
              value={numberValue}
              onChange={onChange}
              placeholder={numberPlaceholder}
              className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink text-base sm:text-sm font-mono focus:outline-none focus:border-taupe min-h-[48px]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor={nameId} className="block text-xs font-semibold text-ink-body">
              Account Name <span className="text-ink-faint text-[11px] font-normal">(Optional)</span>
            </label>
            <input
              id={nameId}
              name={nameName}
              type="text"
              value={nameValue}
              onChange={onChange}
              placeholder="e.g. Juan Dela Cruz"
              className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink text-base sm:text-sm focus:outline-none focus:border-taupe min-h-[48px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
