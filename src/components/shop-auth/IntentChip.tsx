'use client';

import { useEffect, useState } from 'react';
import { currentShopIntent, type ShopIntent } from '@/lib/shopIntent';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** What this sign-up is for, from the address or an earlier click: confirms the choice made on the shop landing page. */
export function useShopIntentLabel(): { chip: string | null; lede: string } {
  const [intent, setIntent] = useState<ShopIntent | null>(null);
  useEffect(() => { setIntent(currentShopIntent(window.location.search)); }, []);

  if (intent?.trial) return { chip: 'Free trial · 14 days · Basic', lede: 'Start your 14-day free trial of SUTURA.' };
  if (intent?.plan) {
    const name = cap(intent.plan);
    return { chip: `${name} plan · ${intent.cycle === 'yearly' ? 'Yearly' : 'Monthly'}`, lede: `Create your account now. You choose the ${name} plan when you apply.` };
  }
  return { chip: null, lede: 'Open your shop on SUTURA.' };
}

export default function IntentChip({ label }: { readonly label: string | null }) {
  if (!label) return null;
  return <p className="mb-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">{label}</p>;
}
