'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowDown, ArrowUp, Download, FileSpreadsheet, Loader2, RefreshCw, Settings } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import PlanPill from '@/components/admin/ui/PlanPill';
import Badge from '@/components/shared/Badge';
import { Pager, StatCard } from '@/components/admin/ui/AdminPrimitives';
import { formatDate, useAdminList, useDebounced, useStableListHeight } from '@/components/admin/useAdminList';
import PaymentReviewModal from '@/components/admin/payments/PaymentReviewModal';
import GcashSettingsModal from '@/components/admin/payments/GcashSettingsModal';
import {
  methodLabel, peso, presetRange, REFUND_STATUS_LABEL, STATUS_BADGE, paymentStatusLabel, TYPE_CLASS, TYPE_LABEL,
  type DatePreset, type PaymentStats, type PlatformPayment,
} from '@/components/admin/payments/paymentTypes';
import adminApi from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';

const STATUSES = [
  { value: 'pending', label: 'Processing' },
  { value: 'approved', label: 'Paid' },
  { value: 'rejected', label: 'Failed / Rejected' },
  { value: '', label: 'All' },
];
const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: '', label: 'Any date' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'month', label: 'This month' },
  { value: 'custom', label: 'Custom…' },
];
const PER_PAGE = 5;
const SELECT_CLASS ='min-h-11 border border-line-strong bg-surface px-3 text-sm text-ink focus:border-ink focus:outline-none';

export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={null}>
      <PaymentsPageContent />
    </Suspense>
  );
}

function PaymentsPageContent() {
  const toast = useToast();
  const searchParams = useSearchParams();

  // Default: the queue in order (pending, oldest first — the server's default for pending).
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [planId, setPlanId] = useState('');
  const [type, setType] = useState('');
  const [channel, setChannel] = useState('');
  const [preset, setPreset] = useState<DatePreset>('');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [sort, setSort] = useState<{ by: 'date' | 'amount'; dir: '' | 'asc' | 'desc' }>({ by: 'date', dir: '' });
  const [page, setPage] = useState(1);
  const query = useDebounced(search);
  const range = preset === 'custom' ? custom : presetRange(preset);

  const filters = { q: query, status, plan_id: planId, type, channel, from: range.from, to: range.to };
  const { items, meta, raw, loading, error, reload } = useAdminList<PlatformPayment>('/admin/payments', {
    ...filters, sort: sort.by, dir: sort.dir || undefined, page, per_page: PER_PAGE,
  });
  const counts = (raw.counts ?? {}) as Record<string, number>;
  // A shorter last page keeps the table's height (until a filter or sort changes).
  const stable = useStableListHeight<HTMLDivElement>(JSON.stringify({ ...filters, sort }));

  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [statsError, setStatsError] = useState('');
  const loadStats = () => adminApi.get('/admin/payments/stats')
    .then((res) => setStats(res.data.data))
    .catch((err) => setStatsError(getErrorMessage(err, 'Could not load the totals.')));
  useEffect(() => { loadStats(); }, []);
  // After a Re-sync or a decision: the row may have moved tabs, and the totals changed.
  const refreshAll = () => { reload(); loadStats(); };

  const [plans, setPlans] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => {
    adminApi.get('/admin/subscription-plans').then((res) => setPlans(res.data.data ?? [])).catch(() => setPlans([]));
  }, []);

  // ?review=ID (from the bell) opens that payment.
  const [reviewing, setReviewing] = useState<number | null>(() => {
    const id = Number(searchParams.get('review'));
    return Number.isInteger(id) && id > 0 ? id : null;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const resetPage = () => setPage(1);
  const toggleSort = (by: 'date' | 'amount') => {
    setSort((s) => {
      const current = s.dir || (status === 'pending' && s.by === 'date' ? 'asc' : 'desc');
      return { by, dir: s.by === by ? (current === 'asc' ? 'desc' : 'asc') : 'desc' };
    });
    resetPage();
  };
  const sortDir = (by: 'date' | 'amount') => sort.by !== by ? null : (sort.dir || (status === 'pending' && by === 'date' ? 'asc' : 'desc'));

  const exportCsv = async () => {
    setExporting(true);
    try {
      const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined));
      const res = await adminApi.get('/admin/payments/export', { params: clean, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sutura-payments-${new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not export the payments.'));
    } finally {
      setExporting(false);
    }
  };

  // Branded .xlsx (SUTURA logo and colours) from the same CSV export, so it holds exactly the same rows.
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const exportExcel = async () => {
    setExportingXlsx(true);
    try {
      const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined));
      const res = await adminApi.get('/admin/payments/export', { params: clean, responseType: 'blob' });
      const { parseCsv, downloadBrandedXlsx, suturaLogo } = await import('@/lib/brandedExport');
      const [columns = [], ...body] = parseCsv(await (res.data as Blob).text());
      const rows = body.filter((l) => l.some((v) => v !== ''));
      const money = ['Amount due', 'Amount sent', 'Refunded'].map((c) => columns.indexOf(c)).filter((i) => i >= 0);
      const sentCol = columns.indexOf('Amount sent');
      const statusCol = columns.indexOf('Status');
      const paidTotal = rows.reduce((sum, r) => sum + (r[statusCol] === 'paid' ? Number(r[sentCol]) || 0 : 0), 0);
      const statusLabel = STATUSES.find((x) => x.value === status)?.label ?? 'All';
      await downloadBrandedXlsx({
        fileName: `sutura-payments-${new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })}.xlsx`,
        sheetName: 'Payments',
        org: 'SUTURA',
        title: 'Plan payments',
        subtitle: `${statusLabel}${range.from || range.to ? ` · ${range.from || '…'} to ${range.to || '…'}` : ''} · generated ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}`,
        meta: [['Records', rows.length], ['Total paid (amount sent)', paidTotal]],
        tables: [{ columns, rows, money }],
      }, await suturaLogo());
    } catch (err) {
      toast.error(getErrorMessage(err, "The Excel file couldn't be created. Try again, or use Export CSV."));
    } finally {
      setExportingXlsx(false);
    }
  };

  const s = stats;
  const skeleton = <span className="inline-block h-8 w-20 animate-pulse bg-sunken align-middle" aria-hidden="true" />;
  const hasFilters = Boolean(query || planId || type || range.from || range.to);
  const emptyText = s?.total === 0
    ? 'No payments yet. Payments will show up here once shops subscribe.'
    : status === 'pending' && !hasFilters ? 'Nothing processing. Every GCash payment has gone through.' : 'No payments match these filters.';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="All platform payments in one place."
        actions={
          <button type="button" onClick={() => setSettingsOpen(true)} className="inline-flex min-h-11 items-center gap-2 border border-line-strong bg-surface px-4 text-sm text-ink hover:bg-sunken cursor-pointer">
            <Settings size={16} aria-hidden="true" /> GCash account
          </button>
        }
      />

      {/* Same card + alignment rules as the Overview row. */}
      <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6" aria-busy={!s || undefined}>
        <StatCard label="Processing" value={s ? s.to_verify : skeleton} hint="Waiting for GCash to confirm" />
        {/* Money: whole pesos, a size smaller, so it fits a narrow card (exact amount on hover). */}
        <StatCard label="Paid this month" value={s ? <Money value={s.paid_this_month} /> : skeleton} valueClassName="text-2xl" hint="Verified payments, after refunds" />
        <StatCard label="Total revenue" value={s ? <Money value={s.total_revenue} /> : skeleton} valueClassName="text-2xl"
          hint={s && s.refunded_total > 0 ? `All time, after ${peso(s.refunded_total)} refunded` : 'All time, verified only'} />
        <StatCard label="Failed / Rejected" value={s ? s.rejected_open : skeleton} hint="Didn't go through" />
        <StatCard label="Active subscriptions" value={s ? s.active_subscriptions : skeleton} hint="Paid or on trial" />
        <StatCard label="Payments" value={s ? s.total : skeleton} hint={s ? `${s.paid} paid, ${s.pending} pending` : undefined} />
      </div>
      {statsError && <p role="alert" className="text-sm text-danger">{statsError}</p>}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex overflow-x-auto hide-scrollbar border-b border-line" role="tablist" aria-label="Payment status">
          {STATUSES.map((o) => (
            <button key={o.value || 'all'} type="button" role="tab" aria-selected={status === o.value}
              onClick={() => { setStatus(o.value); setSort({ by: 'date', dir: '' }); resetPage(); }}
              className={`min-h-12 shrink-0 whitespace-nowrap border-b-2 px-4 text-sm transition-colors ${status === o.value ? 'border-ink font-semibold text-ink' : 'border-transparent text-ink-muted hover:text-ink'}`}>
              {o.label}
              {o.value && <span className="ml-1.5 text-ink-faint tabular-nums">{counts[o.value] ?? 0}</span>}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="lg:w-80">
            <SearchInput bold onCanvasBackground value={search} onChange={(v) => { setSearch(v); resetPage(); }} placeholder="Shop, owner, email, GCash ref no., sender" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            <select aria-label="Plan" value={planId} onChange={(e) => { setPlanId(e.target.value); resetPage(); }} className={SELECT_CLASS}>
              <option value="">All plans</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select aria-label="Payment type" value={type} onChange={(e) => { setType(e.target.value); resetPage(); }} className={SELECT_CLASS}>
              <option value="">All types</option>
              {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select aria-label="Payment method" value={channel} onChange={(e) => { setChannel(e.target.value); resetPage(); }} className={SELECT_CLASS}>
              <option value="">All methods</option>
              <option value="online">GCash</option>
              <option value="receipt">GCash · Receipt</option>
            </select>
            <select aria-label="Date submitted" value={preset} onChange={(e) => { setPreset(e.target.value as DatePreset); resetPage(); }} className={SELECT_CLASS}>
              {DATE_PRESETS.map((d) => <option key={d.value || 'any'} value={d.value}>{d.label}</option>)}
            </select>
            {preset === 'custom' && (
              <>
                <input type="date" aria-label="From" value={custom.from} max={custom.to || undefined} onChange={(e) => { setCustom((c) => ({ ...c, from: e.target.value })); resetPage(); }} className={SELECT_CLASS} />
                <input type="date" aria-label="To" value={custom.to} min={custom.from || undefined} onChange={(e) => { setCustom((c) => ({ ...c, to: e.target.value })); resetPage(); }} className={SELECT_CLASS} />
              </>
            )}
          </div>
          <button type="button" onClick={exportCsv} disabled={exporting} className="inline-flex min-h-11 items-center justify-center gap-2 border border-line-strong bg-surface px-4 text-sm text-ink hover:bg-sunken cursor-pointer disabled:opacity-50 lg:ml-auto">
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} aria-hidden="true" />} Export CSV
          </button>
          <button type="button" onClick={() => void exportExcel()} disabled={exportingXlsx} className="inline-flex min-h-11 items-center justify-center gap-2 border border-line-strong bg-surface px-4 text-sm text-ink hover:bg-sunken cursor-pointer disabled:opacity-50">
            {exportingXlsx ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} aria-hidden="true" />} Export Excel
          </button>
        </div>
      </div>

      {/* Fits the page at every width: a fixed table on wide screens, cards below that. */}
      <div className="admin-card overflow-hidden">
        <div ref={stable.ref} style={stable.style}>
        <table className="hidden w-full table-fixed text-left text-sm xl:table">
          <colgroup>
            <col className="w-[12%]" /><col className="w-[13%]" /><col className="w-[15%]" /><col className="w-[9%]" />
            <col className="w-[10%]" /><col className="w-[12%]" /><col className="w-[11%]" /><col className="w-[8%]" /><col className="w-[10%]" />
          </colgroup>
          <thead className="border-b-2 border-line-strong">
            <tr className="text-eyebrow">
              <th scope="col" className="px-3 py-3 font-semibold">Type</th>
              <th scope="col" className="px-3 py-3 font-semibold">Shop</th>
              <th scope="col" className="px-3 py-3 font-semibold">Owner</th>
              <th scope="col" className="px-3 py-3 font-semibold">Plan</th>
              <SortHeader label="Amount" dir={sortDir('amount')} onClick={() => toggleSort('amount')} align="right" />
              <th scope="col" className="px-3 py-3 font-semibold">Sender</th>
              <SortHeader label="Submitted" dir={sortDir('date')} onClick={() => toggleSort('date')} />
              <th scope="col" className="px-3 py-3 font-semibold">Status</th>
              <th scope="col" className="px-3 py-3 font-semibold"><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && Array.from({ length: PER_PAGE }).map((_, i) => (
              <tr key={`sk-${i}`} aria-hidden="true">
                {Array.from({ length: 9 }).map((__, j) => <td key={j} className="px-3 py-4"><div className="h-4 animate-pulse bg-sunken" /></td>)}
              </tr>
            ))}
            {!loading && !error && items.map((p) => (
              <tr key={p.id} className={`align-top hover:bg-canvas ${needsReview(p) ? 'bg-amber-50/40' : ''}`}>
                {/* Type first (owners send a receipt; the ref no. is shown under it when there is one). */}
                <td className="px-3 py-3 break-words text-sm">
                  <span className={TYPE_CLASS[p.type]}>{TYPE_LABEL[p.type]}</span>
                  <span className="block text-xs text-ink-body">{methodLabel(p)}</span>
                  {p.payment_reference && <span className="block truncate font-mono text-xs tabular-nums text-ink-muted" title={p.payment_reference}>{p.payment_reference}</span>}
                  <WarningNote count={p.warning_count} />
                </td>
                <td className="px-3 py-3 break-words font-semibold text-ink">{p.store?.name}</td>
                <td className="px-3 py-3 text-ink"><span className="block break-words">{p.owner?.name}</span><span className="block truncate text-xs text-ink-muted" title={p.owner?.email}>{p.owner?.email}</span></td>
                <td className="px-3 py-3 text-ink">{p.plan?.name ? <PlanPill plan={p.plan.name} /> : '—'}<span className="mt-1 block text-xs capitalize text-ink-muted">{p.billing_cycle}</span></td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-ink">{peso(p.amount_due)}</td>
                <td className="px-3 py-3 break-words text-ink">{p.sender_name ?? '—'}{p.sender_number && <span className="block text-xs tabular-nums text-ink-muted">{p.sender_number}</span>}</td>
                <td className="px-3 py-3 tabular-nums text-ink-body">{formatDate(p.created_at)}<span className="block text-xs text-ink-muted">{timeOf(p.created_at)}</span></td>
                <td className="px-3 py-3"><Badge variant={STATUS_BADGE[p.status]} className="whitespace-nowrap">{paymentStatusLabel(p, true)}</Badge><RefundNote payment={p} /></td>
                <td className="px-3 py-3 text-right"><RowAction payment={p} onOpen={setReviewing} onSynced={refreshAll} /></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Below xl: one card per payment, nothing to scroll sideways. */}
        <ul className="admin-divide xl:hidden">
          {loading && Array.from({ length: PER_PAGE }).map((_, i) => (
            <li key={`skc-${i}`} className="space-y-2 p-4" aria-hidden="true">
              <div className="h-4 w-1/2 animate-pulse bg-sunken" /><div className="h-4 w-3/4 animate-pulse bg-sunken" />
            </li>
          ))}
          {!loading && !error && items.map((p) => (
            <li key={p.id} className={`space-y-3 p-4 ${needsReview(p) ? 'bg-amber-50/40' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words font-semibold text-ink">{p.store?.name}</p>
                  <p className="text-xs text-ink-muted"><span className={TYPE_CLASS[p.type]}>{TYPE_LABEL[p.type]}</span> · {p.plan?.name} · <span className="capitalize">{p.billing_cycle}</span></p>
                </div>
                <p className="shrink-0 text-right font-semibold tabular-nums text-ink">{peso(p.amount_due)}</p>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                {p.payment_reference && (
                  <>
                    <dt className="text-ink-muted">Reference</dt>
                    <dd className="min-w-0 break-words font-mono text-xs tabular-nums text-ink">{p.payment_reference}</dd>
                  </>
                )}
                <dt className="text-ink-muted">Method</dt>
                <dd className="text-ink">{methodLabel(p)}</dd>
                <dt className="text-ink-muted">Owner</dt>
                <dd className="min-w-0 break-words text-ink">{p.owner?.name}<span className="block truncate text-xs text-ink-muted">{p.owner?.email}</span></dd>
                <dt className="text-ink-muted">Sender</dt>
                <dd className="min-w-0 break-words text-ink">{p.sender_name ?? '—'}{p.sender_number ? ` · ${p.sender_number}` : ''}</dd>
                <dt className="text-ink-muted">Submitted</dt>
                <dd className="tabular-nums text-ink-body">{formatDate(p.created_at, true)}</dd>
              </dl>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={STATUS_BADGE[p.status]}>{paymentStatusLabel(p)}</Badge>
                  <RefundNote payment={p} />
                  <WarningNote count={p.warning_count} />
                </div>
                <RowAction payment={p} onOpen={setReviewing} onSynced={refreshAll} />
              </div>
            </li>
          ))}
        </ul>
        {!loading && error && <p role="alert" className="px-4 py-12 text-center text-sm text-danger">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <p className="px-4 py-12 text-center text-sm text-ink-muted">{emptyText}</p>
        )}
        </div>
        <Pager meta={meta} onPage={setPage} />
      </div>

      <PaymentReviewModal paymentId={reviewing} onClose={() => setReviewing(null)} onDecided={refreshAll} />
      <GcashSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

/** ₱78,546 — or ₱1.25M from a million up — with the exact amount on hover. */
function Money({ value }: { readonly value: number }) {
  const text = value >= 1_000_000
    ? `₱${(value / 1_000_000).toLocaleString('en-PH', { maximumFractionDigits: 2 })}M`
    : `₱${Math.round(value).toLocaleString('en-PH')}`;
  return <span title={peso(value)}>{text}</span>;
}

const needsReview = (p: PlatformPayment) => p.status === 'pending' && p.type !== 'new_shop';
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });

// "Refunded ₱300.00" under the status, for GCash payments sent back.
function RefundNote({ payment }: { readonly payment: PlatformPayment }) {
  if (!payment.refund_status) return null;
  const tone = payment.refund_status === 'failed' ? 'text-danger' : 'text-ink-body';
  return <span className={`block text-xs font-medium ${tone}`}>{REFUND_STATUS_LABEL[payment.refund_status]} {peso(payment.refund_amount)}</span>;
}

function WarningNote({ count }: { readonly count: number }) {
  if (!count) return null;
  return <span className="mt-1 flex items-center gap-1 font-sans text-xs text-amber-700"><AlertTriangle size={12} aria-hidden="true" /> {count} to check</span>;
}

function RowAction({ payment, onOpen, onSynced }: {
  readonly payment: PlatformPayment; readonly onOpen: (id: number) => void; readonly onSynced: () => void;
}) {
  const toast = useToast();
  const [syncing, setSyncing] = useState(false);
  // Same box for every action, sized to stay inside its column; the filled one is the thing to do.
  const base = 'inline-flex min-h-10 w-full max-w-24 items-center justify-center gap-1.5 border px-2 text-sm cursor-pointer';

  // A GCash checkout still processing: nothing to review, only ask GCash again (a missed webhook).
  if (payment.status === 'pending' && payment.channel === 'online') {
    const resync = async () => {
      setSyncing(true);
      try {
        await adminApi.post(`/admin/payments/${payment.id}/sync`);
        toast.success('Checked with GCash.');
        onSynced();
      } catch (err) {
        toast.error(getErrorMessage(err, 'GCash could not be reached. Try again in a moment.'));
      } finally {
        setSyncing(false);
      }
    };
    return (
      <button type="button" onClick={resync} disabled={syncing} title="Ask GCash for this payment's status"
        className={`${base} max-w-28 whitespace-nowrap border-ink bg-ink font-semibold text-white hover:bg-ink/90 disabled:opacity-60`}>
        {syncing ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={14} aria-hidden="true" />} Re-sync
      </button>
    );
  }
  // An old receipt upload still waiting (from before GCash checkout): review it as before.
  return needsReview(payment) ? (
    <button type="button" onClick={() => onOpen(payment.id)} className={`${base} border-ink bg-ink font-semibold text-white hover:bg-ink/90`}>Review</button>
  ) : (
    <button type="button" onClick={() => onOpen(payment.id)} className={`${base} border-line-strong bg-surface text-ink hover:bg-sunken`}>View</button>
  );
}

function SortHeader({ label, dir, onClick, align = 'left' }: {
  readonly label: string; readonly dir: 'asc' | 'desc' | null; readonly onClick: () => void; readonly align?: 'left' | 'right';
}) {
  return (
    <th scope="col" aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'} className={`px-3 py-3 font-semibold ${align === 'right' ? 'text-right' : ''}`}>
      <button type="button" onClick={onClick} className={`inline-flex items-center gap-1 uppercase tracking-[inherit] cursor-pointer hover:text-ink ${dir ? 'text-ink' : ''}`}>
        {label}
        {dir === 'asc' ? <ArrowUp size={12} aria-hidden="true" /> : dir === 'desc' ? <ArrowDown size={12} aria-hidden="true" /> : <ArrowDown size={12} className="opacity-30" aria-hidden="true" />}
      </button>
    </th>
  );
}
