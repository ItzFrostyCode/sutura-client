'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import adminApi from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import { ChevronLeft, ChevronRight, List, Map as MapIcon } from 'lucide-react';
import { FilterTabs, ListState, PAGER_BTN } from '@/components/admin/ui/AdminPrimitives';
import ReasonModal from '@/components/admin/ui/ReasonModal';
import StoreRow, { type DirectoryStore } from '@/components/admin/stores/StoreRow';
import StoreDetailsModal from '@/components/admin/stores/StoreDetailsModal';
import { useAdminList, useDebounced, useStableListHeight } from '@/components/admin/useAdminList';
import { PLAN_RING, type ShopPin } from '@/components/admin/stores/shopPins';

// Leaflet needs the browser, so the map only loads on the client.
const AdminShopsMap = dynamic(() => import('@/components/admin/stores/AdminShopsMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-sunken" />,
});

const VIEWS = [
  { value: 'list', label: 'List', Icon: List },
  { value: 'map', label: 'Map', Icon: MapIcon },
] as const;

// Pin border = the shop's plan; the small dot = open/closed, same as the public /map.
const LEGEND = [
  { color: PLAN_RING.basic, label: 'Basic', ring: true },
  { color: PLAN_RING.pro, label: 'Pro', ring: true },
  { color: PLAN_RING.premium, label: 'Premium', ring: true },
  { color: PLAN_RING.none, label: 'No plan', ring: true },
  { color: '#22c55e', label: 'Open now', ring: false },
  { color: '#ef4444', label: 'Closed now', ring: false },
];

const FILTERS = [
  { value: 'approved', label: 'Active' },
  { value: 'hidden', label: 'Hidden' },
  { value: '', label: 'All' },
];

const PER_PAGE = 5;

const PLANS = [
  { value: '', label: 'All plans' },
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
  { value: 'premium', label: 'Premium' },
];

// sutura2's Shop Directory. Hide/Restore reuse the existing post-moderation
// endpoints (Admin\ModerationController), which notify the owner and lock
// the shop so neither the owner nor a renewal can un-hide it.
export default function AdminStoresPage() {
  const toast = useToast();
  const [filter, setFilter] = useState('approved');
  const [plan, setPlan] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hiding, setHiding] = useState<DirectoryStore | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [pins, setPins] = useState<ShopPin[]>([]);
  const [pinsLoading, setPinsLoading] = useState(false);
  const [pinsError, setPinsError] = useState<string | null>(null);
  const query = useDebounced(search);
  // "See in Shops" from Reports opens this list already searched (?search=Shop name), across all tabs.
  useEffect(() => {
    const preset = new URLSearchParams(window.location.search).get('search');
    if (preset) {
      setSearch(preset);
      setFilter('');
    }
  }, []);
  // Active = approved and visible to customers; Hidden = hidden by an admin or a lapsed plan.
  const base = { plan, search: query, page, per_page: PER_PAGE };
  const params = filter === 'hidden'
    ? { ...base, visibility: 'hidden' }
    : filter === 'approved'
      ? { ...base, status: 'approved', visibility: 'visible' }
      : base;
  const { items, meta, loading, error, reload } = useAdminList<DirectoryStore>('/admin/stores', params);
  // A shorter last page keeps the list's height, so pressing Next doesn't jump to the top.
  const stable = useStableListHeight<HTMLDivElement>(`${filter}|${plan}|${query}`);

  // Map view: every active shop with a pin at once (not paged), same plan and search filters as the list.
  useEffect(() => {
    if (view !== 'map') return;
    let cancelled = false;
    setPinsLoading(true);
    setPinsError(null);
    adminApi.get('/admin/stores/map', { params: { plan, search: query } })
      .then((res) => { if (!cancelled) setPins(res.data.data ?? []); })
      .catch((err) => { if (!cancelled) setPinsError(getErrorMessage(err, 'Could not load the shop map.')); })
      .finally(() => { if (!cancelled) setPinsLoading(false); });
    return () => { cancelled = true; };
  }, [view, plan, query]);

  // Next / Previous: show the new page from its first shop, not from where the pager sits.
  const goToPage = (n: number) => {
    setPage(n);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  // One pin per branch, so shops are counted by their id.
  const shopCount = new Set(pins.map((p) => p.store_id)).size;

  const hide = async (reason: string) => {
    if (!hiding) return;
    try {
      await adminApi.put(`/admin/stores/${hiding.id}/hide`, { reason });
      toast.success(`${hiding.name} is hidden from customers.`);
      setHiding(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not hide this shop.'));
      throw err;
    }
  };

  const restore = async (store: DirectoryStore) => {
    try {
      const res = await adminApi.put(`/admin/stores/${store.id}/unhide`);
      toast.success(res.data.message);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not restore this shop.'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Shops" description="Every shop on SUTURA, with its plan and branches.">
        {view === 'list' && <FilterTabs options={FILTERS} value={filter} onChange={(v) => { setFilter(v); setPage(1); }} />}
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-sm">
          <SearchInput bold onCanvasBackground value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search shop, city, or owner" />
        </div>
        <div className="flex gap-1 overflow-x-auto hide-scrollbar admin-field p-1 shadow-2xs sm:ml-auto" role="radiogroup" aria-label="Plan">
          {PLANS.map((p) => (
            <button
              key={p.value}
              type="button"
              role="radio"
              aria-checked={plan === p.value}
              onClick={() => { setPlan(p.value); setPage(1); }}
              className={`min-h-9 shrink-0 whitespace-nowrap rounded-lg px-3.5 text-sm transition-colors ${plan === p.value ? 'bg-ink font-semibold text-white' : 'text-ink-body hover:bg-sunken hover:text-ink'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 gap-1 admin-field p-1 shadow-2xs" role="radiogroup" aria-label="View">
          {VIEWS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={view === value}
              onClick={() => setView(value)}
              className={`inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 text-sm transition-colors sm:flex-none ${view === value ? 'bg-ink font-semibold text-white' : 'text-ink-body hover:bg-sunken hover:text-ink'}`}
            >
              <Icon size={15} aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'map' && (
        <section className="admin-card overflow-hidden" aria-label="Map of active shops">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line px-5 py-3 text-sm">
            <p className="text-ink-body">
              {pinsLoading ? 'Loading shops…' : (
                <>
                  <span className="font-semibold tabular-nums text-ink">{shopCount}</span> active {shopCount === 1 ? 'shop' : 'shops'}
                  <span className="text-ink-faint"> · </span>
                  <span className="font-semibold tabular-nums text-ink">{pins.length}</span> {pins.length === 1 ? 'location' : 'locations'}
                </>
              )}
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 sm:ml-auto" aria-label="Pin legend">
              {LEGEND.map((l) => (
                <li key={l.label} className="inline-flex items-center gap-1.5 text-ink-muted">
                  {l.ring
                    ? <span className="h-3.5 w-3.5 rounded-full border-[3px] bg-white" style={{ borderColor: l.color }} aria-hidden="true" />
                    : <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} aria-hidden="true" />}
                  {l.label}
                </li>
              ))}
            </ul>
          </div>
          {pinsError || (!pinsLoading && pins.length === 0) ? (
            <ListState loading={false} error={pinsError ?? ''} empty={pins.length === 0} emptyText="No active shops with a map location match." />
          ) : (
            <div className="relative z-0 h-[min(65vh,560px)] min-h-80">
              <AdminShopsMap pins={pins} />
            </div>
          )}
        </section>
      )}

      {view === 'list' && <div ref={stable.ref} style={stable.style}>
        {(loading || error || items.length === 0) && (
          <div className="admin-card">
            <ListState loading={loading} error={error} empty={items.length === 0} emptyText="No shops match." />
          </div>
        )}
        {!loading && !error && items.length > 0 && (
          <ul className="space-y-3">
            {items.map((store) => <StoreRow key={store.id} store={store} onHide={setHiding} onRestore={restore} onOpen={(s) => setOpenId(s.id)} />)}
          </ul>
        )}
      </div>}

      {view === 'list' && meta && meta.last_page > 1 && (
        <nav className="relative flex min-h-11 items-center justify-center" aria-label="Pages">
          <p className="text-sm text-ink-body">
            Page {meta.current_page} of {meta.last_page}
            <span className="text-ink-faint"> · {meta.total} shops</span>
          </p>
          <div className="absolute right-0 flex gap-2">
            <button type="button" aria-label="Previous page" disabled={meta.current_page <= 1} onClick={() => goToPage(meta.current_page - 1)} className={PAGER_BTN}>
              <ChevronLeft size={17} />
            </button>
            <button type="button" aria-label="Next page" disabled={meta.current_page >= meta.last_page} onClick={() => goToPage(meta.current_page + 1)} className={PAGER_BTN}>
              <ChevronRight size={17} />
            </button>
          </div>
        </nav>
      )}

      <StoreDetailsModal storeId={openId} onClose={() => setOpenId(null)} />

      <ReasonModal
        isOpen={hiding !== null}
        title={`Hide ${hiding?.name ?? 'store'}?`}
        description="The shop profile disappears from search, the map, and its public page until you restore it. The owner is notified with your reason."
        confirmLabel="Hide Shop"
        onClose={() => setHiding(null)}
        onConfirm={hide}
      />
    </div>
  );
}
