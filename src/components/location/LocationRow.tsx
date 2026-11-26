import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface LocationRowProps {
  readonly icon: ReactNode;
  readonly title: ReactNode;
  readonly subtitle?: ReactNode;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  /** Hide the arrow when something else (a menu) sits to the right. */
  readonly chevron?: boolean;
  /** Square corners, for rows stacked inside a rounded group (the group rounds the outside). */
  readonly flat?: boolean;
}

/** One tappable place: a plain icon, two lines of text and a soft rounded highlight when touched. No lines, no icon circles. */
export default function LocationRow({ icon, title, subtitle, onClick, disabled, chevron = true, flat = false }: LocationRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-[64px] w-full cursor-pointer items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-sunken active:bg-sunken disabled:cursor-default disabled:opacity-50 ${flat ? '' : 'rounded-2xl'}`}
    >
      {/* A fixed box, so every row's text starts at the same line whatever the icon's size. */}
      <span className="flex h-7 w-7 shrink-0 items-center justify-center text-taupe">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="mobile-body-md block line-clamp-2 break-words font-medium text-ink">{title}</span>
        {subtitle && <span className="mobile-body-sm mt-0.5 block line-clamp-2 break-words text-ink-muted">{subtitle}</span>}
      </span>
      {chevron && <ChevronRight size={18} className="shrink-0 text-ink-faint" />}
    </button>
  );
}
