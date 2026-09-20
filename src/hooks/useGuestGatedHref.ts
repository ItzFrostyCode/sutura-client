'use client';

import { useAuthStore } from '@/store/useAuthStore';

// Guest Mode: browsing (categories, showroom, shops, services, map) stays
// open to everyone, but actually viewing a shop's own page is a login-
// gated action — a guest tapping through gets sent to /login instead of
// the real destination. Used at every card/link that opens a shop's page
// (CatalogItemCard, the Home/Map/Search/Shops-list shop cards) so the rule
// lives in one place instead of a scattered isAuthenticated check per file.
export function useGuestGatedHref() {
  const { isAuthenticated } = useAuthStore();
  return (realHref: string) => (isAuthenticated ? realHref : '/login');
}
