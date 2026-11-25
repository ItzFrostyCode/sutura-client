/**
 * After Next / Previous on a paged list: bring the list's top back into view,
 * so the new page is read from its first item rather than from the pager at
 * the bottom. Works whatever scrolls (the window, or the dashboard's <main>).
 * Does nothing when the list's top is already visible. Give the target a
 * `scroll-mt-*` class so it lands below any sticky header, or pass `offset`
 * (px) when the target can't carry one.
 */
export function scrollToListTop(el: Element | null, offset = 0) {
  if (!(el instanceof HTMLElement) || typeof window === 'undefined') return;
  if (offset && !el.style.scrollMarginTop) el.style.scrollMarginTop = `${offset}px`;
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  if (el.getBoundingClientRect().top >= margin) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}
