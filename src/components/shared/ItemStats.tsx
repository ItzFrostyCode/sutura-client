import { Heart, Star } from 'lucide-react';

interface ItemStatsProps {
  readonly rating?: number | string | null;
  readonly reviewsCount?: number | null;
  readonly sold?: number | null;
  readonly saves?: number | null;
  readonly className?: string;
}

/**
 * Rating | sold | saves — the one stats line of every service and design card (the Shops list, Search, the shop page,
 * Discover), always all three, on one line, so a card reads the same wherever it is.
 */
export default function ItemStats({ rating, sold, saves, className = '' }: ItemStatsProps) {
  const r = Number(rating);
  const shown = Number.isFinite(r) && r > 0 ? r.toFixed(1) : '0.0';
  return (
    <div className={`flex items-center gap-1.5 text-xs text-ink-muted ${className}`}>
      <span className="flex shrink-0 items-center gap-0.5">
        <Star size={10} className="shrink-0 fill-amber-400 text-amber-500" aria-hidden />
        <span className="font-semibold text-ink">{shown}</span>
        <span className="sr-only">out of 5</span>
      </span>
      <span className="text-ink-faint" aria-hidden>|</span>
      <span className="truncate">{sold ?? 0} sold</span>
      <span className="text-ink-faint" aria-hidden>|</span>
      <span className="flex shrink-0 items-center gap-0.5 text-rose-600" title={`${saves ?? 0} saved`}>
        <Heart size={10} className="shrink-0 fill-rose-500 text-rose-500" aria-hidden />
        <span>{saves ?? 0}</span>
      </span>
    </div>
  );
}
