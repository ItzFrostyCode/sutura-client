import React, { useState } from 'react';
import { Copy, Check, QrCode, User, Maximize2 } from 'lucide-react';

interface PaymentChannelViewProps {
  readonly title: string;
  readonly badgeLabel: string;
  readonly badgeColor: 'blue' | 'amber';
  readonly dotColor: string;
  readonly numberLabel: string;
  readonly numberValue?: string | null;
  readonly nameValue?: string | null;
  readonly qrPath?: string | null;
  readonly onPreviewQr?: (url: string, title: string) => void;
}

export default function PaymentChannelView({
  title,
  badgeLabel,
  badgeColor,
  dotColor,
  numberLabel,
  numberValue,
  nameValue,
  qrPath,
  onPreviewQr,
}: PaymentChannelViewProps) {
  const [copied, setCopied] = useState(false);

  const hasContent = Boolean(numberValue || qrPath);
  if (!hasContent) return null;

  const badgeClass =
    badgeColor === 'blue'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

  const handleCopy = async () => {
    if (!numberValue) return;
    try {
      await navigator.clipboard.writeText(numberValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked
    }
  };

  return (
    <div className="p-3.5 sm:p-4 rounded-xl border border-line bg-canvas/30 space-y-3">
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

      <div className="flex flex-col min-[420px]:flex-row gap-3 sm:gap-4 items-start pt-0.5">
        {/* Left: QR Code Preview */}
        {qrPath ? (
          <div className="flex flex-col items-center shrink-0 w-full min-[420px]:w-28 sm:w-32">
            <button
              type="button"
              onClick={() => onPreviewQr?.(qrPath, title)}
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl border border-line bg-white flex items-center justify-center overflow-hidden shadow-xs group cursor-pointer hover:border-taupe transition-colors"
              title="Click to enlarge QR code"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrPath} alt={`${title} QR Code`} className="w-full h-full object-contain p-1.5" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs gap-1 font-medium">
                <Maximize2 size={14} />
                <span>View</span>
              </div>
            </button>
            <span className="text-[10px] text-ink-muted mt-1.5 text-center">Tap QR to zoom</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center shrink-0 w-full min-[420px]:w-28 sm:w-32 h-28 sm:h-32 rounded-xl border border-dashed border-line bg-canvas text-ink-faint text-center p-2">
            <QrCode size={26} strokeWidth={1.5} />
            <span className="text-[10px] mt-1 text-ink-muted font-medium">Manual Transfer</span>
          </div>
        )}

        {/* Right: Number & Name */}
        <div className="flex-1 min-w-0 space-y-2.5 w-full">
          {numberValue && (
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-ink-muted block uppercase tracking-wider">
                {numberLabel}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-ink tracking-wide font-mono select-all break-all">
                  {numberValue}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 rounded-md hover:bg-sunken text-ink-muted hover:text-ink transition-colors cursor-pointer shrink-0"
                  title="Copy number"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}

          {nameValue && (
            <div className="space-y-0.5 pt-1 border-t border-line/40">
              <span className="text-[11px] font-medium text-ink-muted block uppercase tracking-wider">
                Account Name
              </span>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-ink-body">
                <User size={13} className="text-ink-muted shrink-0" />
                <span className="truncate">{nameValue}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
