import SearchInput from '@/components/shared/SearchInput';

interface BoardToolbarProps {
  readonly search: string;
  readonly onSearch: (v: string) => void;
  readonly showMine: boolean;
  readonly mine: boolean;
  readonly onMine: (v: boolean) => void;
  readonly closedCount: number;
  readonly showClosed: boolean;
  readonly onShowClosed: (v: boolean) => void;
}

/** Search, "my orders" for staff, and a way to see cancelled or declined orders. Nothing else. */
export default function BoardToolbar({ search, onSearch, showMine, mine, onMine, closedCount, showClosed, onShowClosed }: BoardToolbarProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <SearchInput value={search} onChange={onSearch} placeholder="Search by order number or customer" className="min-w-0 flex-1" />
      <div className="flex items-center gap-2">
        {showMine && (
          <button type="button" aria-pressed={mine} onClick={() => onMine(!mine)} className={`h-11 rounded-full px-4 text-sm font-semibold ${mine ? 'bg-ink text-white' : 'bg-sunken text-ink-body'}`}>My orders</button>
        )}
        <button type="button" aria-pressed={showClosed} onClick={() => onShowClosed(!showClosed)} className={`h-11 rounded-full px-4 text-sm font-semibold ${showClosed ? 'bg-ink text-white' : 'bg-sunken text-ink-body'}`}>
          Closed{closedCount > 0 ? ` (${closedCount})` : ''}
        </button>
      </div>
    </div>
  );
}
