'use client';

// Browsing (categories, showroom, stores, services, store profiles, catalog items, map)
// is public to everyone. Authenticated actions (booking, order placement, reviews)
// handle auth redirection at their specific interactive triggers.
export function useGuestGatedHref() {
  return (realHref: string) => realHref;
}

