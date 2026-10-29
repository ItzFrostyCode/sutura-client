/** Rounded pill used by every choice in the filter pop-up. */
export const chip = (on: boolean) =>
  `flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm transition-colors ${on ? 'bg-ink font-semibold text-white' : 'bg-sunken text-ink hover:bg-sunken-hover'}`;

/**
 * A tab / segment on the landing filter bar, rectangular like the shop cards. Compact (36px) on a phone and tablet; the
 * tap area is stretched to 44px with an invisible extension above and below, from 1024px it is simply 44px tall.
 */
export const barChip = (on: boolean) =>
  `relative flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border px-3 text-xs before:absolute before:inset-x-0 before:-inset-y-1 lg:h-11 lg:px-4 lg:text-sm transition-colors ${on ? 'border-ink bg-ink font-semibold text-white' : 'border-line bg-surface text-ink hover:border-ink'}`;
