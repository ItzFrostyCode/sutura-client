'use client';

import { useState } from 'react';
import PaymentChannelView from '@/components/store-storefront/tabs/about/PaymentChannelView';
import QrZoomModal, { type ZoomQr } from '@/components/store-storefront/tabs/about/QrZoomModal';
import { PLATFORM_GCASH } from '@/lib/platformPayment';

const peso = (n: number) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface PlatformPaymentBoxProps {
  readonly amount: number;
  readonly note?: string;
  readonly planName?: string;
}

/**
 * Where a shop pays SUTURA for its plan: the amount, then SUTURA's GCash shown exactly like a shop's Payment Method
 * card on its About tab (GCash badge, QR image to enlarge, account name, number with Copy). GCash only.
 */
export default function PlatformPaymentBox({ amount, note, planName }: PlatformPaymentBoxProps) {
  const [zoom, setZoom] = useState<ZoomQr | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3 rounded-2xl bg-surface px-4 py-3.5 ring-1 ring-line/80 sm:px-5">
        <span className="text-[15px] text-ink-muted">Amount to pay{planName ? ` · ${planName} plan` : ''}</span>
        <strong className="text-[22px] font-bold tabular-nums tracking-tight text-ink">{peso(amount)}</strong>
      </div>

      <PaymentChannelView
        title="GCash"
        brandColor="#005CE6"
        numberLabel="Number"
        numberValue={PLATFORM_GCASH.number}
        nameValue={PLATFORM_GCASH.name}
        qrPath={PLATFORM_GCASH.qrImage}
        onPreviewQr={(url, title, number, name) => setZoom({ url, title, number, name })}
      />

      <ol className="list-decimal space-y-1 pl-6 text-[13px] text-ink-body marker:text-ink-muted">
        <li>Open GCash, then scan the QR code or send to the number.</li>
        <li>Pay the exact amount: {peso(amount)}.</li>
        <li>Attach the screenshot of your GCash receipt below.</li>
      </ol>
      {note && <p className="px-1 text-[13px] text-ink-muted">{note}</p>}

      <QrZoomModal qr={zoom} onClose={() => setZoom(null)} />
    </div>
  );
}
