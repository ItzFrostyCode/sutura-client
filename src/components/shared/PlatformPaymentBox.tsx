'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check, Copy, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import { PLATFORM_GCASH } from '@/lib/platformPayment';

const peso = (n: number) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface PlatformPaymentBoxProps {
  readonly amount: number;
  readonly note?: string;
  readonly planName?: string;
}

export default function PlatformPaymentBox({ amount, note, planName }: PlatformPaymentBoxProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    // Generate QR Ph-compatible payload string for GCash/Maya scan
    const qrPayload = `00020101021226${String(PLATFORM_GCASH.number.length + 14).padStart(2, '0')}0010com.sutura01${String(PLATFORM_GCASH.number.length).padStart(2, '0')}${PLATFORM_GCASH.number}520459995303608540${String(amount).length}${amount}5802PH59${String(PLATFORM_GCASH.name.length).padStart(2, '0')}${PLATFORM_GCASH.name}6010Davao City6304`;
    
    QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 260,
      color: {
        dark: '#1e1c1a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => {
        // Fallback simple payload
        QRCode.toDataURL(`GCASH:${PLATFORM_GCASH.number}?amount=${amount}&name=${encodeURIComponent(PLATFORM_GCASH.name)}`, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 260,
        }).then(setQrDataUrl);
      });
  }, [amount]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PLATFORM_GCASH.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="border border-line bg-surface overflow-hidden shadow-xs">
      {/* Top Banner: QR Ph header */}
      <div className="bg-ink text-white px-4 py-3 sm:px-5 sm:py-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-line">
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-taupe block">
            QR Ph · Automatic Payment
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Scan with GCash or Maya
          </h3>
        </div>
        <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded text-xs text-white/90">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span className="font-medium">Secure Checkout</span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <p className="text-xs sm:text-sm text-ink-muted mb-4">
          Open your e-wallet app, scan the code, and confirm the exact amount.
          {planName && <span className="font-medium text-ink"> ({planName} package)</span>}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] gap-5 items-stretch">
          {/* Left: QR Code Card */}
          <div className="flex flex-col items-center justify-center p-4 bg-white border border-line-strong/30 rounded-sm">
            <div className="relative w-[210px] h-[210px] flex items-center justify-center bg-white">
              {qrDataUrl ? (
                <>
                  <Image
                    src={qrDataUrl}
                    alt="QR Ph Payment Code"
                    width={210}
                    height={210}
                    className="w-full h-full object-contain"
                    unoptimized
                  />
                  {/* Center QR Ph official style emblem */}
                  <div className="absolute inset-0 m-auto w-10 h-10 bg-white rounded-md shadow-md border-2 border-white flex items-center justify-center pointer-events-none">
                    <div className="relative w-7 h-7 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-[3px] border-[#0052cc] border-t-[#e52427] border-r-[#e52427]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#f6b900]" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-sunken animate-pulse rounded" />
              )}
            </div>

            {/* Supported Networks Branding */}
            <div className="mt-3 pt-2.5 border-t border-line/50 w-full flex items-center justify-center gap-3">
              <span className="text-[11px] font-black tracking-tight text-[#e52427]">
                QR<span className="text-[#0052cc]">Ph</span>
              </span>
              <span className="text-line-strong">|</span>
              <span className="text-[11px] font-bold text-[#0057e0]">
                GCash
              </span>
              <span className="text-line-strong">|</span>
              <span className="text-[11px] font-bold text-[#14b8a6]">
                maya
              </span>
            </div>
          </div>

          {/* Right: Amount & Steps */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <span className="text-xs uppercase tracking-wider font-semibold text-ink-muted">
                  Amount Due
                </span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Waiting for payment
                </span>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-ink mt-2 tracking-tight">
                {peso(amount)}
              </p>
            </div>

            {/* Numbered Steps */}
            <ol className="space-y-2 text-xs sm:text-sm text-ink-body border-l-2 border-taupe/40 pl-3.5 my-2">
              <li>
                <strong className="text-ink font-semibold">1.</strong> Open <span className="font-semibold text-[#0057e0]">GCash</span> or <span className="font-semibold text-[#14b8a6]">Maya</span> and tap <strong className="text-ink">Scan QR</strong>.
              </li>
              <li>
                <strong className="text-ink font-semibold">2.</strong> Scan this code and confirm the exact amount <span className="font-semibold text-ink">({peso(amount)})</span>.
              </li>
              <li>
                <strong className="text-ink font-semibold">3.</strong> Enter your reference number and upload the screenshot receipt below.
              </li>
            </ol>

            {/* Manual Account Details fallback */}
            <div className="bg-sunken p-2.5 border border-line text-xs">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-ink-muted block text-[10px] uppercase font-semibold">Manual Send (GCash / Maya)</span>
                  <span className="font-mono font-bold text-ink text-sm tracking-wider">{PLATFORM_GCASH.number}</span>
                  <span className="text-ink-muted ml-2">({PLATFORM_GCASH.name})</span>
                </div>
                <button
                  type="button"
                  onClick={copy}
                  aria-label="Copy account number"
                  className="px-2.5 py-1.5 border border-line-strong bg-surface text-ink text-xs font-semibold flex items-center gap-1 hover:bg-canvas transition-colors"
                >
                  {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {note && (
              <p className="text-[11px] text-ink-muted leading-tight">
                {note}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
