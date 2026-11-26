import { redirect } from 'next/navigation';

// Shops apply through /register/store, the same flow as the team lead's: the System Admin reviews the application and
// issues the shop login (…@sutura.shop) with a temporary password on approval, so there is no email link to open.
// The old email-link sign-up is retired; its links land on the application, keeping a /for-shops plan pick.
export default async function ShopSignupPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const keep = new URLSearchParams();
  for (const key of ['plan', 'cycle', 'trial']) {
    const value = q[key];
    if (typeof value === 'string' && value) keep.set(key, value);
  }
  redirect(keep.size > 0 ? `/register/store?${keep.toString()}` : '/register/store');
}
