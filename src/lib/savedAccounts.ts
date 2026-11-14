import axios from 'axios';
import api from './axios';
import type { SavedAuth } from './authStorage';

/**
 * Accounts this browser can switch between without the password — "Log in as Shop Owner" keeps the customer account
 * (a Gmail customer and an @sutura shop are separate logins). Only that "add an account" sign-in fills it, and logging
 * out forgets every one and ends their sessions, so a shared computer never offers someone else's account.
 */
export const ACCOUNTS_KEY = 'sutura_accounts';
const MAX = 3;
const SHOP_ROLES = ['store_owner', 'branch_manager', 'staff'];

export function parseAccounts(raw: string | null): SavedAuth[] {
  try {
    const list = JSON.parse(raw ?? '[]');
    return Array.isArray(list) ? list.filter((a) => a && typeof a.token === 'string' && a.user?.id) : [];
  } catch {
    return [];
  }
}

function read(): SavedAuth[] {
  try {
    return parseAccounts(localStorage.getItem(ACCOUNTS_KEY));
  } catch {
    return [];
  }
}

function write(list: SavedAuth[]): void {
  try {
    if (list.length) localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
    else localStorage.removeItem(ACCOUNTS_KEY);
  } catch {
    // Storage blocked: switching just isn't offered.
  }
}

/** Remember (or refresh) an account, newest first. */
export function rememberAccount(account: SavedAuth): void {
  write([account, ...read().filter((a) => a.user.id !== account.user.id)].slice(0, MAX));
}

export function forgetAccount(userId: number): void {
  write(read().filter((a) => a.user.id !== userId));
}

/** On log out: forget them all and end their sessions on the server. */
export function forgetAllAccounts(): void {
  const list = read();
  if (!list.length) return;
  write([]);
  for (const a of list) {
    void axios.post(`${api.defaults.baseURL}/auth/logout`, null, {
      headers: { Authorization: `Bearer ${a.token}`, Accept: 'application/json' },
    }).catch(() => {});
  }
}

export function isShopAccount(a: Pick<SavedAuth, 'user' | 'staffProfile'>): boolean {
  return !!a.staffProfile || !!a.user.roles?.some((r) => SHOP_ROLES.includes(r.name));
}

/** Where an account lands after switching to it. */
export function homeOf(a: SavedAuth): string {
  if (!isShopAccount(a)) return '/account';
  const owner = a.user.roles?.some((r) => r.name === 'store_owner');
  return owner && !a.store ? '/onboarding' : '/dashboard';
}

/** The saved login, checked with the server (logins last 7 days) and with its latest details; null when it has expired. */
export async function refreshAccount(a: SavedAuth): Promise<SavedAuth | null> {
  try {
    const res = await axios.get(`${api.defaults.baseURL}/auth/me`, {
      headers: { Authorization: `Bearer ${a.token}`, Accept: 'application/json' },
    });
    const d = res.data?.data;
    if (!d?.user) return null;
    return { token: a.token, user: d.user, store: d.store ?? d.staff_profile?.store ?? null, staffProfile: d.staff_profile ?? null };
  } catch {
    return null;
  }
}
