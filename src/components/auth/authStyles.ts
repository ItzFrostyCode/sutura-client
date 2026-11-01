/**
 * The one set of form classes for every sign-in, sign-up and application screen (customer and shop), so they read as
 * one design: soft 12px corners, 48px+ fields at 16px (no iOS zoom), a 52px primary button, sentence-case labels.
 */
export const FIELD = 'w-full min-h-12 rounded-xl px-3.5 py-3 border border-line-strong bg-white text-ink text-base focus:outline-none focus:border-ink focus:ring-2 focus:ring-espresso/10 transition-colors';
export const LABEL = 'block text-sm font-medium text-ink mb-2';
export const PRIMARY_BTN = 'flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 text-base font-semibold text-white transition-[background-color,transform] hover:bg-espresso active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40';
export const OUTLINE_BTN = 'flex min-h-[52px] w-full items-center justify-center rounded-xl border border-ink px-5 text-center text-base font-semibold text-ink transition-colors hover:bg-sunken';
export const ERROR_BOX = 'mb-5 rounded-xl border border-danger/30 bg-danger/5 p-3.5 text-center text-sm text-danger';
/** The Show / Hide word inside a password field: a 48px-tall hit area, flush with the input. */
export const SHOW_BTN = 'absolute bottom-0 right-1 flex h-12 items-center px-3 text-sm font-medium text-ink underline underline-offset-2';
