import Link from 'next/link';
import { GARMENT_TILES } from './categoriesDirectoryData';

/**
 * The 10 garment categories as tiles: a plain grid that wraps (no sideways carousel or arrows), so every category is
 * in view. Two columns on a phone, three from 481px, five from 600px.
 */
export default function CategoriesVisualGrid({ className = '' }: Readonly<{ className?: string }>) {
  return (
    <ul className={`grid grid-cols-2 gap-2 min-[481px]:grid-cols-3 min-[600px]:grid-cols-5 ${className}`}>
      {GARMENT_TILES.map((cat) => {
        const Icon = cat.icon;
        return (
          <li key={cat.id}>
            <Link href={cat.href}
              className="group flex h-full min-h-[104px] flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-surface p-3 text-center transition-colors hover:border-line-strong">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sunken text-ink transition-transform group-hover:scale-105">
                <Icon size={20} aria-hidden />
              </span>
              <span className="text-sm font-medium leading-snug text-ink">{cat.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
