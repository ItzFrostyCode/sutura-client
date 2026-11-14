'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { readAuth, type SavedAuth } from '@/lib/authStorage';
import { ACCOUNTS_KEY, forgetAccount, homeOf, isShopAccount, parseAccounts, refreshAccount, rememberAccount } from '@/lib/savedAccounts';

const subscribe = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
};
const snapshot = () => {
  try {
    return localStorage.getItem(ACCOUNTS_KEY);
  } catch {
    return null;
  }
};

/** The other accounts this browser remembers, and a one-tap switch to one (see lib/savedAccounts.ts). */
export function useAccountSwitch() {
  const userId = useAuthStore((s) => s.user?.id);
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  const others = useMemo(() => parseAccounts(raw).filter((a) => a.user.id !== userId), [raw, userId]);
  const [switching, setSwitching] = useState(false);

  const switchTo = async (target: SavedAuth) => {
    setSwitching(true);
    const fresh = await refreshAccount(target);
    if (!fresh) {
      // That login expired: sign in to it again; the current account stays.
      forgetAccount(target.user.id);
      window.location.assign(isShopAccount(target) ? '/login?as=store&add=1' : '/login?add=1');
      return;
    }
    const current = readAuth();
    if (current) rememberAccount(current);
    rememberAccount(fresh);
    useAuthStore.getState().setAuth(fresh.user, fresh.token, fresh.store ?? undefined, fresh.staffProfile ?? undefined);
    // A full load, so nothing the previous account fetched stays on screen. Other tabs follow (AuthHydrator).
    window.location.assign(homeOf(fresh));
  };

  return { others, switchTo, switching };
}
