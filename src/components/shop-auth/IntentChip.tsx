'use client';

import { useEffect, useState } from 'react';
import { currentShopIntent, type ShopIntent } from '@/lib/shopIntent';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** What this sign-up is for, from the address or an earlier click: confirms the choice made on the shop landing page. */
export function useShopIntentLabel(): { chip: string | null; title: string; lede: string } {
  const [intent, setIntent] = useState<ShopIntent | null>(null);
  useEffect(() => { setIntent(currentShopIntent(window.location.search)); }, []);

  if (intent?.trial) return { chip: 'Free trial · 14 days · Basic', title: 'Start Your Free Trial', lede: '14 days of SUTURA free, from the day your shop is approved. Nothing to pay.' };
  if (intent?.plan) {
    const name = cap(intent.plan);
    return { chip: `${name} plan · ${intent.cycle === 'yearly' ? 'Yearly' : 'Monthly'}`, title: 'Register Your Shop', lede: `Create your account now. You confirm the ${name} plan and pay when you apply.` };
  }
  return { chip: null, title: 'Open a Shop', lede: 'Start with your email. You add your shop’s details after you confirm it.' };
}

export default function IntentChip({ label }: { readonly label: string | null }) {
  if (!label) return null;
  return <p className="mb-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">{label}</p>;
}
