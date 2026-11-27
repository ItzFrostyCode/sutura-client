/**
 * Takes the person to a field that needs fixing: scrolls it to the middle of
 * the screen, moves focus into it, and flashes a highlight ring around it
 * (the `[data-attention]` style in globals.css). Used when a form's own check
 * finds something missing that the browser can't point at by itself: address
 * pickers, the map pin, uploads, pill choices, or a field on another step.
 *
 * `target` is an element id, a `data-field` name, or the element itself. If
 * it isn't on the page yet (the form just switched step), it retries for a
 * few frames. Respects "reduce motion".
 */
const FOCUSABLE = 'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const FLASH_MS = 2400;

function find(target: string | Element): HTMLElement | null {
  if (typeof target !== 'string') return target as HTMLElement;
  return document.getElementById(target) ?? document.querySelector<HTMLElement>(`[data-field="${CSS.escape(target)}"]`);
}

/** What to scroll to and ring: a visually-hidden input (file uploads) uses its label / wrapper instead. */
function visibleBox(el: HTMLElement): HTMLElement {
  const hidden = el.classList.contains('sr-only') || el.getBoundingClientRect().width < 2;
  if (!hidden) return el;
  const label = el.id ? document.querySelector<HTMLElement>(`label[for="${CSS.escape(el.id)}"]`) : null;
  return label ?? el.closest<HTMLElement>('[data-field]') ?? el.parentElement ?? el;
}

export function revealField(target: string | Element | null | undefined, attempt = 0): void {
  if (!target || typeof window === 'undefined') return;
  const el = find(target);
  if (!el) {
    if (attempt < 10) requestAnimationFrame(() => revealField(target, attempt + 1));
    return;
  }

  const box = visibleBox(el);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });

  const focusTarget = el.matches(FOCUSABLE) ? el : el.querySelector<HTMLElement>(FOCUSABLE);
  focusTarget?.focus({ preventScroll: true });

  box.setAttribute('data-attention', '');
  window.setTimeout(() => box.removeAttribute('data-attention'), FLASH_MS);
}
