import Link from 'next/link';
import { List, Map } from 'lucide-react';

const SEG = 'flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors';

/**
 * "List | Map" beside the Shops-near-you title: the list is what is on screen, the map is the same shops on the map
 * search. One discovery, two views, instead of a separate map block further down the page.
 */
export default function ListMapToggle({ mapHref }: { readonly mapHref: string }) {
  return (
    <div role="group" aria-label="Show shops as" className="inline-flex rounded-full bg-sunken p-0.5">
      <span aria-current="true" className={`${SEG} bg-surface text-ink shadow-sm`}><List size={15} /> List</span>
      <Link href={mapHref} className={`${SEG} text-ink-muted hover:text-ink`}><Map size={15} /> Map</Link>
    </div>
  );
}
