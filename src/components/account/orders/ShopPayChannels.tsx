'use client';

import React, { useState } from 'react';
import PaymentChannelView from '@/components/store-storefront/tabs/about/PaymentChannelView';
import QrZoomModal, { type ZoomQr } from '@/components/store-storefront/tabs/about/QrZoomModal';
import type { ShopPaymentMethod } from './usePayForOrder';

const BRAND: Record<string, string> = { gcash: '#005CE6', maya: '#00A651', bank_transfer: '#4B5563' };

/**
 * The shop's payment accounts, drawn exactly like the Payment Method card on the shop's About tab
 * (brand badge, QR to enlarge, account name, number with Copy). `action` adds a button under each one.
 */
export default function ShopPayChannels({ methods, action }: Readonly<{ methods: ShopPaymentMethod[]; action?: (m: ShopPaymentMethod) => React.ReactNode }>) {
  const [zoom, setZoom] = useState<ZoomQr | null>(null);

  return (
    <>
      <ul className="space-y-4">
        {methods.map((m) => (
          <li key={m.id} className="space-y-3">
            <PaymentChannelView
              title={m.name}
              brandColor={BRAND[m.kind] ?? BRAND.bank_transfer}
              numberLabel={m.kind === 'bank_transfer' ? 'Account number' : 'Number'}
              numberValue={m.account_number}
              nameValue={m.account_name}
              qrPath={m.qr_path}
              onPreviewQr={(url, title, number, name) => setZoom({ url, title, number, name })}
            />
            {m.instructions && <p className="mobile-caption whitespace-pre-wrap text-ink-muted">{m.instructions}</p>}
            {action?.(m)}
          </li>
        ))}
      </ul>
      <QrZoomModal qr={zoom} onClose={() => setZoom(null)} />
    </>
  );
}
