import React, { useState } from 'react';
import { Copy, Check, User, Maximize2, QrCode } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';

interface PaymentChannelViewProps {
  readonly title: string;
  readonly badgeLabel?: string;
  readonly brandColor?: string;
  readonly numberLabel: string;
  readonly numberValue?: string | null;
  readonly nameValue?: string | null;
  readonly qrPath?: string | null;
  readonly onPreviewQr?: (url: string, title: string, number?: string | null, name?: string | null) => void;
}

export default function PaymentChannelView({
  title,
  badgeLabel,
  brandColor = '#005CE6',
  numberLabel,
  numberValue,
  nameValue,
  qrPath,
  onPreviewQr,
}: PaymentChannelViewProps) {
  const [copied, setCopied] = useState(false);

  const hasContent = Boolean(numberValue || qrPath);
  if (!hasContent) return null;

  const handleCopy = async () => {
    if (!numberValue) return;
    try {
      await navigator.clipboard.writeText(numberValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const resolvedQrUrl = qrPath ? getMediaUrl(qrPath) : null;

  return (
    <div className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-xs space-y-4">
      {/* 1. Channel Header: Brand Badge & Action Hint (No 'E-Wallet' jargon) */}
      <div className="flex items-center justify-between pb-2.5 border-b border-line/70">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center px-3 py-1 rounded-md text-white text-xs font-bold tracking-wide shadow-xs"
            style={{ backgroundColor: brandColor }}
          >
            {title}
          </span>
          {badgeLabel && (
            <span className="text-xs font-medium text-ink-muted">
              {badgeLabel}
            </span>
          )}
        </div>
        <span className="text-xs text-ink-muted">
          Direct Payment
        </span>
      </div>

      {/* 2. Body: When QR code IS present (side-by-side scan & send layout) */}
      {resolvedQrUrl ? (
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
          {/* QR Code thumbnail with tap-to-enlarge action */}
          <div className="flex flex-col items-center shrink-0 w-full sm:w-32">
            <button
              type="button"
              onClick={() => onPreviewQr?.(resolvedQrUrl, title, numberValue, nameValue)}
              className="relative w-28 sm:w-32 aspect-[327/592] rounded-xl border border-line bg-surface overflow-hidden shadow-xs hover:border-taupe hover:shadow-md transition-all cursor-pointer group"
              title="Click to enlarge QR code"
              aria-label={`Enlarge ${title} QR code`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolvedQrUrl}
                alt={`${title} QR Code`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs gap-1.5 font-semibold">
                <Maximize2 size={16} />
                <span>Enlarge</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onPreviewQr?.(resolvedQrUrl, title, numberValue, nameValue)}
              className="mt-1.5 text-xs font-semibold text-taupe hover:underline flex items-center gap-1 transition-colors cursor-pointer"
            >
              <QrCode size={13} />
              <span>Tap to enlarge</span>
            </button>
          </div>

          {/* Account Details beside the QR code */}
          <div className="flex-1 min-w-0 space-y-3 w-full">
            {nameValue && (
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                  Account Name
                </span>
                <p className="text-sm sm:text-base font-bold text-ink truncate">
                  {nameValue}
                </p>
              </div>
            )}

            {numberValue && (
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                  {numberLabel}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-bold font-mono tracking-wider text-ink select-all break-all">
                    {numberValue}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg bg-sunken hover:bg-line text-ink text-xs font-semibold transition-colors cursor-pointer shrink-0"
                    title="Copy number"
                    aria-label="Copy number"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <p className="text-xs text-ink-muted pt-2 border-t border-line/60">
              Scan the QR code or enter / copy the number to pay.
            </p>
          </div>
        </div>
      ) : (
        /* 3. Body: When QR code is NOT present (clean single-row layout — NO nested boxes) */
        <div className="space-y-3">
          {nameValue && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-ink pb-2.5 border-b border-line/60">
              <User size={14} className="text-ink-muted shrink-0" />
              <span className="text-ink-muted font-normal">Account Name:</span>
              <span className="font-bold text-ink truncate">{nameValue}</span>
            </div>
          )}

          {numberValue && (
            <div className="flex items-center justify-between gap-3 py-1">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                  {numberLabel}
                </span>
                <span className="text-base sm:text-lg font-bold font-mono tracking-wider text-ink select-all block truncate mt-0.5">
                  {numberValue}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-sunken hover:bg-line text-ink inline-flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                title="Copy number"
                aria-label="Copy number"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          )}

          <p className="text-xs text-ink-muted pt-2 border-t border-line/60">
            Enter or copy the number to pay.
          </p>
        </div>
      )}
    </div>
  );
}
