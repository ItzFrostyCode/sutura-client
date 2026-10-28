/**
 * The form look from DESIGN.md (Espresso Atelier): white fields with a warm hairline, deep-espresso text and primary action,
 * a soft cream secondary button, real buttons everywhere. Colors come from the dashboard theme (see globals.css).
 */
export const PLAIN_FIELD = 'h-11 w-full rounded-xl border border-espresso/20 bg-white px-3 text-base text-espresso placeholder:text-espresso/40 focus:outline-none focus:border-espresso/60 focus:ring-2 focus:ring-espresso/15 disabled:border-espresso/10 disabled:text-espresso/40 sm:text-sm';
export const PLAIN_LABEL = 'mb-1.5 block text-sm font-medium text-espresso';
const BTN_BASE = 'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-medium transition-[background-color,transform] active:scale-[0.98] disabled:cursor-default disabled:opacity-40 disabled:active:scale-100';
/** A real button: soft cream with a warm hairline (secondary). */
export const BTN = `${BTN_BASE} h-11 border border-espresso/10 bg-espresso/[0.05] text-espresso hover:bg-espresso/[0.09]`;
/** The one main button of a screen: solid deep espresso. */
export const BTN_PRIMARY = `${BTN_BASE} h-11 border border-espresso bg-espresso text-white hover:bg-espresso/90`;
/** A smaller secondary button, for actions inside a row. */
export const BTN_SM = `${BTN_BASE} h-9 border border-espresso/10 bg-espresso/[0.05] px-3 text-espresso hover:bg-espresso/[0.09]`;
/** An icon-only square button (no side padding, so the icon is never squeezed out). */
export const BTN_ICON = `${BTN_BASE} h-9 w-9 border border-espresso/10 bg-espresso/[0.05] px-0! text-espresso hover:bg-espresso/[0.09]`;
/** A quiet button with no outline, for optional extras such as "Not listed? Type it". */
export const BTN_GREY = `${BTN_BASE} h-11 bg-espresso/[0.06] text-espresso hover:bg-espresso/10`;
