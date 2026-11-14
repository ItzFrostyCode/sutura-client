'use client';

import { useEffect } from 'react';
import { clearTabCaches, useAuthStore } from '@/store/useAuthStore';
import { AUTH_KEY, readAuth } from '@/lib/authStorage';

/**
 * Mounted once in the root layout. useAuthStore always starts in the
 * SSR-safe "logged out" shape so the client's first paint matches the
 * server-rendered HTML exactly (no hydration mismatch); this effect then
 * reads the browser's login (localStorage) after mount, updating the store
 * via a normal post-hydration re-render instead of during hydration itself.
 *
 * It also keeps tabs in step, like Facebook: log out in one tab and the others log out; log in (or switch account)
 * in one and the others reload as that account.
 */
export default function AuthHydrator() {
  useEffect(() => {
    useAuthStore.getState().hydrate();
    const token = useAuthStore.getState().token;
    if (token) {
      import('@/lib/axios').then(({ default: api }) => {
        api.get('/auth/me')
          .then((res) => {
            if (res.data?.success && res.data?.data?.user) {
              const { user, store, staff_profile } = res.data.data;
              useAuthStore.getState().setAuth(user, token, store, staff_profile);
            }
          })
          .catch((err) => {
            if (err?.response?.status === 401) {
              useAuthStore.getState().logout();
            }
          });
      });
    }

    // Fires only in the OTHER tabs when one of them changes the login.
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== localStorage || (e.key !== AUTH_KEY && e.key !== null)) return;
      const next = readAuth();
      const current = useAuthStore.getState().token;
      if (next && next.token === current) {
        // Same login, fresher details (profile edit, shop approved): update in place, no reload.
        useAuthStore.setState({ user: next.user, store: next.store, staffProfile: next.staffProfile });
        return;
      }
      if (!next && !current) return;
      // Logged out, logged in, or a different account: start this tab over as the new login. Protected pages then
      // send a signed-out tab to the login page through their own guards.
      clearTabCaches();
      window.location.reload();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return null;
}
