// Shared by the server layout (inline head script) and LocationSplash.

/** Set on <html> by BOOT_SPLASH_SCRIPT before first paint when the splash should show. */
export const BOOT_CLASS = 'sutura-boot';

// Runs in <head> before the page paints (app/layout.tsx), so the splash is
// the first thing on screen — no flash of the landing page, no hydration
// flicker. It shows on every full load of the landing page (first visit,
// refresh, hard refresh, after clearing site data); in-app navigation back
// to "/" doesn't reload the document, so it doesn't replay there.
export const BOOT_SPLASH_SCRIPT = `try{if(location.pathname==='/'){document.documentElement.classList.add('${BOOT_CLASS}')}}catch(e){}`;
