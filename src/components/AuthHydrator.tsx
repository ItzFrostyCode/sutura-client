'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Mounted once in the root layout. useAuthStore always starts in the
 * SSR-safe "logged out" shape so the client's first paint matches the
 * server-rendered HTML exactly (no hydration mismatch); this effect then
 * reads the real token from localStorage after mount, updating the store
 * via a normal post-hydration re-render instead of during hydration itself.
 */
export default function AuthHydrator() {
  useEffect(() => {
    useAuthStore.getState().hydrate();
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('sutura_token') : null;
    if (token) {
      import('@/lib/axios').then(({ default: api }) => {
        api.get('/auth/me')
          .then((res) => {
            if (res.data?.success && res.data?.data?.user) {
              const { user, shop, staff_profile } = res.data.data;
              useAuthStore.getState().setAuth(user, token, shop, staff_profile);
            }
          })
          .catch((err) => {
            if (err?.response?.status === 401) {
              useAuthStore.getState().logout();
            }
          });
      });
    }
  }, []);

  return null;
}
