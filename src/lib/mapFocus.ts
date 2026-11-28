import type { Map as LeafletMap } from 'leaflet';

export interface FocusPad { readonly top?: number; readonly left?: number; readonly bottom?: number }

/** Street level, as Google Maps does for "my location": close enough to see the block you are on. */
export const FOCUS_ZOOM = 16;

/**
 * Centre the map on a place and zoom IN to street level — never out: a map that is already closer keeps its zoom.
 * `pad` is the room a side panel or bottom sheet covers; the place is put in the middle of the part still showing.
 */
export function focusOn(map: LeafletMap, lat: number, lng: number, pad?: FocusPad, animate = true): void {
  const zoom = Math.max(map.getZoom(), FOCUS_ZOOM);
  const dx = (pad?.left ?? 0) / 2;
  const dy = ((pad?.top ?? 0) - (pad?.bottom ?? 0)) / 2;
  const at = map.project([lat, lng], zoom);
  map.setView(map.unproject([at.x - dx, at.y - dy], zoom), zoom, { animate });
}

/** A page that shows the search map opens it held on the person (`?focus=me`); other destinations are left as they are. */
export function withFocusParam(target: string): string {
  if (!target.startsWith('/search')) return target;
  const url = new URL(target, 'http://sutura.local');
  url.searchParams.set('focus', 'me');
  return `${url.pathname}${url.search}`;
}

/** Same-site paths only (never `//host` or a full URL), for `returnTo` / `continueTo` style parameters. */
export function safeLocalPath(path: string | null): string | null {
  return path && path.startsWith('/') && !path.startsWith('//') ? path : null;
}
