'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftRight, LogIn } from 'lucide-react';
import HubRow from './HubRow';
import { useAccountSwitch } from '@/hooks/useAccountSwitch';
import { isShopAccount } from '@/lib/savedAccounts';
import { useLoginModalStore } from '@/store/useLoginModalStore';

const ADD_SHOP_LOGIN = '/login?as=store&add=1';

/**
 * The Me hub's way into a shop account without signing out of this customer account (Gmail and @sutura are separate
 * logins): "Log in as Shop Owner" the first time, then "Switch to Shop Account" in one tap.
 * "Log in as Shop Owner" opens the Sign In modal (Shop tab) over this page on tablet/desktop, the full page on a phone.
 */
export default function ShopAccountRow() {
  const { others, switchTo, switching } = useAccountSwitch();
  const shop = others.find(isShopAccount);
  const router = useRouter();
  const openSignIn = useLoginModalStore((s) => s.open);

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
  const logInAsShop = () => {
    if (window.innerWidth >= 600) openSignIn(null, { portal: 'store', addAccount: true });
    else router.push(ADD_SHOP_LOGIN);
  };
  return <HubRow onClick={logInAsShop} Icon={LogIn} title="Log in as Shop Owner" subtitle="Your customer account stays signed in" />;
}
