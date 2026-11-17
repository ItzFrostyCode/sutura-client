/**
 * The shop dashboard's form and button pieces, made the same as the customer side's (components/service-order/orderUi):
 * 48px fields with 16px text (no iOS zoom), rounded-xl, one quiet focus ring, 48px buttons with 16px semibold labels.
 * Colors are the semantic tokens (ink, line, surface, sunken), so inside the dashboard they still come out in the
 * Espresso Atelier palette (.theme-espresso in globals.css, where ink is the deep espresso) and dark mode keeps working.
 */
export const PLAIN_FIELD = 'h-12 w-full min-w-0 rounded-xl border border-line bg-surface px-4 text-base text-ink placeholder:text-ink-faint transition-shadow focus:border-ink focus:outline-none focus:ring-4 focus:ring-ink/5 disabled:bg-sunken disabled:text-ink-faint';
export const PLAIN_LABEL = 'mb-1.5 block text-base font-medium text-ink';
const BTN_BASE = 'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 font-semibold transition-[background-color,border-color,transform] active:scale-[0.98] disabled:cursor-default disabled:opacity-40 disabled:active:scale-100';
/** A real button, secondary: an outline like the customer side's "Back to the shop". */
export const BTN = `${BTN_BASE} h-12 border border-line bg-surface text-base text-ink hover:border-line-strong`;
/** The one main button of a screen: solid ink, like the customer side's "Place order". */
export const BTN_PRIMARY = `${BTN_BASE} h-12 border border-ink bg-ink text-base text-white hover:bg-ink/90`;
/** A smaller secondary button, for actions inside a row (still a 40px target). */
export const BTN_SM = `${BTN_BASE} h-10 border border-line bg-surface px-3 text-sm text-ink hover:border-line-strong`;
/** An icon-only square button (no side padding, so the icon is never squeezed out). */
export const BTN_ICON = `${BTN_BASE} h-10 w-10 border border-line bg-surface px-0! text-ink hover:border-line-strong`;
/** A quiet button with no outline, for optional extras such as "Not listed? Type it". */
export const BTN_GREY = `${BTN_BASE} h-12 bg-sunken text-base text-ink hover:bg-sunken-hover`;
