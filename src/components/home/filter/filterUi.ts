/** Rounded pill used by every choice in the filter pop-up. */
export const chip = (on: boolean) =>
  `flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm transition-colors ${on ? 'bg-ink font-semibold text-white' : 'bg-sunken text-ink hover:bg-sunken-hover'}`;
