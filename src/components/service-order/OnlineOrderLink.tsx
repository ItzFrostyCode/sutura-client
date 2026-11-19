'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import NoGcashAlert from './NoGcashAlert';

// One check per shop per page load: does it have an active GCash account (any branch)?
const gcashCheck = new Map<string, Promise<boolean>>();
function shopHasGcash(slug: string): Promise<boolean> {
  let pending = gcashCheck.get(slug);
  if (!pending) {
    pending = api
      .get(`/public/stores/${slug}/payment-methods`, { params: { any_branch: 1 } })
      .then((res) => ((res.data?.data ?? []) as { kind: string }[]).some((m) => m.kind === 'gcash'))
      // Unknown (network error): let the order form decide, it checks again.
      .catch(() => true);
    gcashCheck.set(slug, pending);
  }
  return pending;
}

/** null while checking, then whether the shop takes GCash. */
export function useShopHasGcash(slug: string | null | undefined): boolean | null {
  const [has, setHas] = useState<boolean | null>(null);
  useEffect(() => {
    if (!slug) return;
    let alive = true;
    shopHasGcash(slug).then((v) => { if (alive) setHas(v); });
    return () => { alive = false; };
  }, [slug]);
  return has;
}

/**
 * "Online Order" / "Place Order": opens the order form, unless payment is due
 * up front and the shop has no GCash account, then it shows a pop-up instead.
 * Repair requests (their own form, paid at pickup) are never blocked.
 */
export default function OnlineOrderLink({
  href,
  storeSlug,
  paymentRequired = true,
  className,
  onClick,
  children,
}: Readonly<{
  href: string;
  storeSlug: string;
  /** False when the service asks for no payment before production. */
  paymentRequired?: boolean;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}>) {
  const repair = href.includes('/repair-request');
  const hasGcash = useShopHasGcash(repair || !paymentRequired ? null : storeSlug);
  const [alertOpen, setAlertOpen] = useState(false);

  return (
    <>
      <Link
        href={href}
        className={className}
        onClick={(e) => {
          if (hasGcash === false) {
            e.preventDefault();
            setAlertOpen(true);
            return;
          }
          onClick?.();
        }}
      >
        {children}
      </Link>
      <NoGcashAlert open={alertOpen} onClose={() => setAlertOpen(false)} storeSlug={storeSlug} />
    </>
  );
}
