import React, { useState } from 'react';
import { QrCode, Upload, Loader2, X } from 'lucide-react';

interface PaymentChannelEditProps {
  readonly title: string;
  readonly badgeLabel: string;
  readonly badgeColor: 'blue' | 'amber';
  readonly dotColor: string;
  readonly numberId: string;
  readonly numberName: string;
  readonly numberLabel: string;
  readonly numberPlaceholder: string;
  readonly numberValue: string;
  readonly nameId: string;
  readonly nameName: string;
  readonly nameValue: string;
  readonly qrPath?: string | null;
  readonly onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  readonly onRemoveQr?: () => void;
  readonly onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PaymentChannelEdit({
  title,
  badgeLabel,
  badgeColor,
  dotColor,
  numberId,
  numberName,
  numberLabel,
  numberPlaceholder,
  numberValue,
  nameId,
  nameName,
  nameValue,
  qrPath,
  onUpload,
  onRemoveQr,
  onChange,
}: PaymentChannelEditProps) {
  const [uploading, setUploading] = useState(false);

  const badgeClass =
    badgeColor === 'blue'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <div className="p-3.5 sm:p-4 rounded-xl border border-line bg-canvas/40 space-y-3">
      {/* Channel Header */}
      <div className="flex items-center justify-between pb-2 border-b border-line/60">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
          <span className="text-xs sm:text-sm font-bold text-ink">{title}</span>
        </div>
        <span className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded border ${badgeClass}`}>
          {badgeLabel}
        </span>
      </div>

      {/* Main Channel Layout */}
      <div className="flex flex-col min-[420px]:flex-row gap-3 sm:gap-4 items-start pt-0.5">
        {/* Left: QR Placeholder on top, Upload button at the bottom */}
        <div className="flex flex-col items-center shrink-0 w-full min-[420px]:w-28 sm:w-32">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl border border-line bg-surface flex items-center justify-center overflow-hidden shadow-xs">
            {qrPath ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrPath} alt={`${title} QR Code`} className="w-full h-full object-contain p-1.5" />
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
                <QrCode size={30} strokeWidth={1.5} />
                <span className="text-[10px] mt-1 font-medium text-ink-muted">No QR image</span>
              </div>
            )}
          </div>

          <label className="w-full mt-2 inline-flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold text-taupe hover:text-white hover:bg-taupe bg-surface border border-line px-2.5 py-2 rounded-lg transition-colors min-h-[38px]">
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            <span>{uploading ? 'Uploading...' : 'Upload QR'}</span>
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

        {/* Right: Number on top, Name (optional) at the bottom */}
        <div className="flex-1 min-w-0 space-y-2.5 w-full">
          <div className="space-y-1">
            <label htmlFor={numberId} className="block text-xs font-medium text-ink-body">
              {numberLabel}
            </label>
            <input
              id={numberId}
              name={numberName}
              type="text"
              value={numberValue}
              onChange={onChange}
              placeholder={numberPlaceholder}
              className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink text-xs sm:text-sm focus:outline-none focus:border-taupe min-h-[42px]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor={nameId} className="block text-xs font-medium text-ink-body">
              Account Name <span className="text-ink-faint text-[11px]">(Optional)</span>
            </label>
            <input
              id={nameId}
              name={nameName}
              type="text"
              value={nameValue}
              onChange={onChange}
              placeholder="e.g. Juan Dela Cruz"
              className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink text-xs sm:text-sm focus:outline-none focus:border-taupe min-h-[42px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
