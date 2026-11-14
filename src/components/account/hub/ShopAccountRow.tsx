'use client';

import { ArrowLeftRight, LogIn } from 'lucide-react';
import HubRow from './HubRow';
import { useAccountSwitch } from '@/hooks/useAccountSwitch';
import { isShopAccount } from '@/lib/savedAccounts';

/**
 * The Me hub's way into a shop account without signing out of this customer account (Gmail and @sutura are separate
 * logins): "Log in as Shop Owner" the first time, then "Switch to Shop Account" in one tap.
 */
export default function ShopAccountRow() {
  const { others, switchTo, switching } = useAccountSwitch();
  const shop = others.find(isShopAccount);

  if (shop) {
    return (
      <HubRow
        onClick={() => void switchTo(shop)}
        disabled={switching}
        Icon={ArrowLeftRight}
        title={switching ? 'Switching…' : 'Switch to Shop Account'}
        subtitle={shop.store?.name ?? shop.user.email}
      />
    );
  }
  return <HubRow href="/login?as=store&add=1" Icon={LogIn} title="Log in as Shop Owner" subtitle="Your customer account stays signed in" />;
}
