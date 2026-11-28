import { List, Map as MapIcon } from 'lucide-react';

export type MapListView = 'map' | 'list';

interface MapListToggleProps {
  readonly view: MapListView;
  readonly onChange: (view: MapListView) => void;
}

/**
 * Phone and tablet: one tap between the full map and the full list of shops (the Yelp / Google Maps pattern). A round
 * 48px icon button, so the search bar beside it keeps the width; the icon shows where it takes you (list on the map,
 * map on the list) and its spoken name says so. Solid surface, no glass.
 */
export default function MapListToggle({ view, onChange }: MapListToggleProps) {
  const toList = view === 'map';
  return (
    <button
      type="button"
      onClick={() => onChange(toList ? 'list' : 'map')}
      aria-label={toList ? 'Show the list of shops' : 'Show the map'}
      title={toList ? 'List' : 'Map'}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface text-ink transition-colors hover:border-ink active:bg-sunken"
    >
      {toList ? <List size={20} aria-hidden /> : <MapIcon size={20} aria-hidden />}
    </button>
  );
}
