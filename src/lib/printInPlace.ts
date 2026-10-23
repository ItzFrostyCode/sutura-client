const FRAME_ID = 'sutura-print-frame';

/**
 * Prints a /print/... page without opening a new tab. The login lives in sessionStorage, which a new tab does not
 * share, so a hidden same-origin iframe in this tab is used instead: it is already signed in, and the print page
 * calls window.print() itself once its data has loaded (inside the iframe, that prints only the page's own content).
 */
export function printInPlace(url: string): void {
  if (typeof document === 'undefined') return;
  document.getElementById(FRAME_ID)?.remove();
  const frame = document.createElement('iframe');
  frame.id = FRAME_ID;
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  frame.style.cssText = 'position:fixed; right:0; bottom:0; width:0; height:0; border:0; visibility:hidden';
  frame.src = url;
  document.body.appendChild(frame);
}
