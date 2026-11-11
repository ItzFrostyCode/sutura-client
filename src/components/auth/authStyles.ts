/**
 * The one set of form classes for every sign-in, sign-up, password and application screen (customer and shop), so they
 * read as one design: soft 12px corners, 48px+ fields at 16px (no iOS zoom), a 52px primary button, sentence-case labels.
 */
export const FIELD = 'auth-field w-full min-h-12 rounded-xl px-3.5 py-3 border border-line-strong bg-white text-ink text-base placeholder:text-ink-faint focus:outline-none focus:border-ink focus:ring-2 focus:ring-espresso/10 transition-colors disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-muted aria-[invalid=true]:border-danger';
export const LABEL = 'block text-sm font-medium text-ink mb-2';
export const PRIMARY_BTN = 'flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 text-base font-semibold text-white transition-[background-color,transform] hover:bg-espresso active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40';
export const OUTLINE_BTN = 'flex min-h-[52px] w-full items-center justify-center rounded-xl border border-ink px-5 text-center text-base font-semibold text-ink transition-colors hover:bg-sunken';
/** "Continue with Google": white, hairline border, the same height as the primary button. */
export const GOOGLE_BTN = 'flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl border border-line-strong bg-white px-5 text-base font-medium text-ink transition-colors hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60';
export const ERROR_BOX = 'mb-5 rounded-xl border border-danger/30 bg-danger/5 p-3.5 text-sm text-danger';
export const SUCCESS_BOX = 'mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800';
/** Screen title on every auth screen (the one H1). */
export const TITLE = 'text-display mobile-h1 text-ink';
/** A plain underlined text link with a 44px tap height. */
export const TEXT_LINK = 'inline-flex min-h-11 items-center font-semibold text-ink underline underline-offset-2 hover:text-espresso';
/** The Show / Hide word inside a password field: a 48px-tall hit area, flush with the input. */
export const SHOW_BTN = 'absolute bottom-0 right-1 flex h-12 items-center px-3 text-sm font-medium text-ink underline underline-offset-2';
/** Attributes for every email input: no auto-capitalise or spell-check, the email keyboard on phones. */
export const EMAIL_INPUT_PROPS = { type: 'email', inputMode: 'email', autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false } as const;
