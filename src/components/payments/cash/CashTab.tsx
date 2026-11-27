'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { scrollToListTop } from '@/lib/scrollToListTop';
import Link from 'next/link';
import { Banknote, ChevronLeft, ChevronRight, Download, ExternalLink, FileSpreadsheet, Loader2, Search } from 'lucide-react';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { useBranch } from '@/context/BranchContext';
import { useToast } from '@/context/ToastContext';

type Period = 'today' | 'week' | 'month' | 'all';
const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All time' },
];
const PERIOD_TOTAL_LABEL: Record<Period, string> = {
  today: 'Total cash today', week: 'Total cash this week', month: 'Total cash this month', all: 'Total cash, all time',
};

interface CashRow {
  id: number;
  paid_at: string | null;
  job_order_id: number | null;
  order_number: string | null;
  order_payment_status: string | null;
  customer: string | null;
  type: string | null;
  amount: number;
  received_by: string | null;
  branch: string | null;
  notes: string | null;
  /** Where the order stands now (for the detail pop-up). */
  order: { service: string | null; status: string; total: number; paid: number; balance: number; discount: number } | null;
}
interface Sum { amount: number; count: number }
interface CashData {
  rows: CashRow[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
  period_total: Sum;
  today: Sum;
  week: Sum;
  month: Sum;
  by_staff: { name: string; amount: number; count: number }[];
}

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const count = (n: number) => `${n} ${n === 1 ? 'payment' : 'payments'}`;
const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' });
const time = (iso: string) => new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' });
const TYPE_LABEL: Record<string, string> = { deposit: 'Deposit', partial: 'Partial', full: 'Full', balance: 'Balance' };
const PER_PAGE = 7;

function TypeTag({ type }: Readonly<{ type: string | null }>) {
  const t = type ?? 'partial';
  const settled = t === 'balance' || t === 'full';
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${settled ? 'bg-sage/15 text-[#56704F]' : 'bg-[#F1ECE7] text-taupe-dark'}`}>
      {TYPE_LABEL[t] ?? t}
    </span>
  );
}

function StatusTag({ status }: Readonly<{ status: string | null }>) {
  if (!status) return null;
  const paid = status === 'paid';
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-[11px] font-bold capitalize ${paid ? 'border-[#CFE3CB] bg-[#EEF5EC] text-[#3F6B3A]' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
      {status}
    </span>
  );
}

/**
 * Payments → Cash: every order payment taken in cash, for counting the drawer.
 * Owner and branch manager only (the Payments page is too); managers see their own branch.
 */
export default function CashTab() {
  const { store } = useAuthStore();
  const { selectedBranchId, branches } = useBranch();
  const toast = useToast();
  const [period, setPeriod] = useState<Period>('month');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<CashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'csv' | 'xlsx' | null>(null);
  const [page, setPage] = useState(1);
  // Changing page brings the list's top back into view.
  const listTopRef = useRef<HTMLDivElement>(null);
  const goToPage = (n: number) => { setPage(n); scrollToListTop(listTopRef.current); };
  const [viewing, setViewing] = useState<CashRow | null>(null);

  // Branch column only when looking at every branch of a multi-branch shop.
  const showBranch = selectedBranchId === null && branches.length > 1;

  useEffect(() => {
    // A new search starts again at page 1 (the branch switch remounts the page, so it does too).
    const t = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Filters for the list, the totals and the downloads (downloads take every page).
  const params = useMemo(
    () => ({ period, ...(query ? { q: query } : {}), ...(selectedBranchId ? { branch_id: selectedBranchId } : {}) }),
    [period, query, selectedBranchId],
  );

  const load = useCallback(() => {
    if (!store?.id) return;
    setLoading(true);
    api.get(`/stores/${store.id}/cash-payments`, { params: { ...params, page, per_page: PER_PAGE } })
      .then((res) => setData(res.data.data))
      .catch((err) => toast.error(getErrorMessage(err, 'Could not load cash payments.')))
      .finally(() => setLoading(false));
  }, [store?.id, params, page, toast]);
  useEffect(load, [load]);

  const fetchCsv = async (): Promise<Blob> => {
    const res = await api.get(`/stores/${store!.id}/cash-payments/export`, { params, responseType: 'blob' });
    return res.data as Blob;
  };
  const stamp = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

  const downloadCsv = async () => {
    if (!store?.id) return;
    setBusy('csv');
    try {
      const blob = await fetchCsv();
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: `cash-payments-${period}-${stamp()}.csv` });
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not export the cash payments.'));
    } finally { setBusy(null); }
  };

  const downloadExcel = async () => {
    if (!store?.id || !data) return;
    setBusy('xlsx');
    try {
      const { parseCsv, downloadBrandedXlsx, shopOrSuturaLogo } = await import('@/lib/brandedExport');
      const [rawColumns = [], ...body] = parseCsv(await (await fetchCsv()).text());
      // Branch column only when it says something (all branches of a multi-branch shop).
      const keep = rawColumns.map((c, i) => [c, i] as const).filter(([c]) => showBranch || c !== 'Branch').map(([, i]) => i);
      const columns = keep.map((i) => rawColumns[i]);
      const rows = body.filter((l) => l.some((v) => v !== '')).map((l) => keep.map((i) => l[i] ?? ''));
      const money = ['Amount (PHP)', 'Cash given', 'Change'].map((c) => columns.indexOf(c)).filter((i) => i >= 0);
      const amountCol = columns.indexOf('Amount (PHP)');
      const branchName = branches.find((b) => b.id === selectedBranchId)?.name;
      await downloadBrandedXlsx({
        fileName: `cash-payments-${period}-${stamp()}.xlsx`,
        sheetName: 'Cash',
        org: store.name ?? 'SUTURA',
        title: 'Cash payments',
        subtitle: `${PERIODS.find((p) => p.id === period)?.label}${branchName ? ` · ${branchName}` : ''} · generated ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}`,
        meta: [
          ['Payments', data.period_total.count],
          ['Total cash', data.period_total.amount],
          ...data.by_staff.map((s) => [`Received by ${s.name} (this month)`, peso(s.amount)] as [string, string]),
        ],
        tables: [{
          columns, rows, money,
          total: amountCol >= 0 ? columns.map((_, i) => (i === 0 ? 'TOTAL' : i === amountCol ? data.period_total.amount : null)) : undefined,
        }],
      }, await shopOrSuturaLogo(store.id));
    } catch (err) {
      toast.error(getErrorMessage(err, "The Excel file couldn't be created. Try again, or use CSV."));
    } finally { setBusy(null); }
  };

  const rows = data?.rows ?? [];
  const staff = data?.by_staff ?? [];
  // "A & A Tailoring — Main" → "Main": the shop name is the same on every row.
  const branchLabel = (name: string | null) => {
    if (!name) return '—';
    const shop = store?.name?.trim();
    return shop && name.startsWith(shop) ? name.slice(shop.length).replace(/^[\s—–-]+/, '') || name : name;
  };

  return (
    <div className="p-4 min-[600px]:p-0">
      {/* Totals: each its own server count, so they're right however long the list gets. */}
      <dl className="grid grid-cols-2 border-b border-line md:grid-cols-4">
        {([['Cash today', data?.today], ['This week', data?.week], ['This month', data?.month]] as const).map(([label, s], i) => (
          <div key={label} className={`border-line p-4 min-[600px]:px-6 min-[600px]:py-5 ${i < 2 ? 'border-r' : ''} ${i < 2 ? 'border-b md:border-b-0' : 'md:border-r'}`}>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">{label}</dt>
            <dd className="mt-1.5 text-xl font-bold tabular-nums text-ink">{s ? peso(s.amount) : <span className="inline-block h-6 w-24 animate-pulse rounded bg-sunken align-middle" />}</dd>
            <dd className="text-xs text-ink-faint">{s ? count(s.count) : ' '}</dd>
          </div>
        ))}
        <div className="col-span-2 p-4 min-[600px]:px-6 min-[600px]:py-5 md:col-span-1">
          <dt className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Cash by staff · this month</dt>
          {data && staff.length === 0 && <dd className="mt-2 text-sm text-ink-faint">No cash taken yet this month.</dd>}
          <dd className="mt-2 space-y-1">
            {staff.slice(0, 3).map((s) => (
              <div key={s.name} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-ink-body" title={`${s.name} · ${count(s.count)}`}>{s.name}</span>
                <span className="shrink-0 font-bold tabular-nums text-ink">{peso(s.amount)}</span>
              </div>
            ))}
            {staff.length > 3 && <p className="text-xs text-ink-faint">+{staff.length - 3} more in the Excel file</p>}
          </dd>
        </div>
      </dl>

      {/* Search, period and exports */}
      <div className="flex flex-col gap-3 py-4 min-[600px]:px-5 lg:flex-row lg:items-center lg:justify-between">
        <label className="flex h-11 w-full items-center gap-2 rounded-xl border border-line bg-[#FAF6F3] px-3 lg:w-80">
          <Search size={16} className="shrink-0 text-ink-faint" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order # or customer…"
            aria-label="Search cash payments"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Period">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={period === p.id}
                onClick={() => { setPeriod(p.id); setPage(1); }}
                className={`h-10 rounded-xl border px-3.5 text-sm font-semibold transition-colors cursor-pointer ${period === p.id ? 'border-taupe bg-taupe text-white' : 'border-line bg-[#FAF6F3] text-ink hover:border-line-strong'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => void downloadExcel()} disabled={busy !== null || !rows.length} className="flex h-10 items-center gap-1.5 rounded-xl border border-line-strong bg-white px-3.5 text-sm font-semibold text-ink hover:bg-sunken disabled:opacity-50 cursor-pointer">
            {busy === 'xlsx' ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />} Excel
          </button>
          <button type="button" onClick={() => void downloadCsv()} disabled={busy !== null || !rows.length} className="flex h-10 items-center gap-1.5 rounded-xl border border-line-strong bg-white px-3.5 text-sm font-semibold text-ink hover:bg-sunken disabled:opacity-50 cursor-pointer">
            {busy === 'csv' ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} CSV
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center gap-2 py-14 text-sm text-ink-muted"><Loader2 size={16} className="animate-spin" /> Loading cash payments…</div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-14 text-center">
          <Banknote size={28} className="mb-2 text-ink-faint" aria-hidden="true" />
          <p className="text-sm font-semibold text-ink">{query ? 'No cash payments match your search' : 'No cash payments in this period'}</p>
          <p className="mt-1 text-xs text-ink-muted">Cash logged with Log Pay on Job Balances shows up here.</p>
        </div>
      ) : (
        <>
          <div ref={listTopRef} className="scroll-mt-24" aria-hidden="true" />
          {/* Phones: one card per payment */}
          <ul className="divide-y divide-line border-t border-line md:hidden">
            {rows.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => setViewing(r)} className="block w-full space-y-1.5 py-3.5 text-left cursor-pointer" aria-label={`View cash payment for ${r.order_number}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[13px] text-taupe-dark">{r.order_number}</p>
                    <p className="truncate text-sm font-semibold text-ink">{r.customer ?? 'Walk-in customer'}</p>
                  </div>
                  <p className="shrink-0 text-base font-bold tabular-nums text-[#3F6B3A]">{peso(r.amount)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
                  <TypeTag type={r.type} />
                  <StatusTag status={r.order_payment_status} />
                  {r.paid_at && <span>{day(r.paid_at)}, {time(r.paid_at)}</span>}
                </div>
                <p className="text-xs text-ink-muted">
                  {r.received_by ?? 'Unknown'}{showBranch && r.branch ? ` · ${branchLabel(r.branch)}` : ''}
                </p>
                </button>
              </li>
            ))}
          </ul>

          {/* Wider screens: table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-line bg-[#FAF6F3] text-left text-[11px] uppercase tracking-wider text-ink-muted">
                  <th className="px-5 py-3 font-bold">Date &amp; time</th>
                  <th className="px-3 py-3 font-bold">Order</th>
                  <th className="px-3 py-3 font-bold">Customer</th>
                  <th className="px-3 py-3 font-bold">Payment</th>
                  <th className="px-3 py-3 text-right font-bold">Amount</th>
                  <th className="px-3 py-3 font-bold">Received by</th>
                  {showBranch && <th className="px-3 py-3 font-bold">Branch</th>}
                  <th className="px-3 py-3 font-bold">Order</th>
                  <th className="px-5 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAF6F3]/60">
                    <td className="whitespace-nowrap px-5 py-3.5">
                      {r.paid_at && <><span className="block font-semibold text-ink">{day(r.paid_at)}</span><span className="text-xs text-ink-muted">{time(r.paid_at)}</span></>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 font-mono text-[13px] text-taupe-dark">{r.order_number}</td>
                    <td className="max-w-[180px] truncate px-3 py-3.5 text-ink">{r.customer ?? 'Walk-in customer'}</td>
                    <td className="px-3 py-3.5"><TypeTag type={r.type} /></td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-right font-bold tabular-nums text-[#3F6B3A]">{peso(r.amount)}</td>
                    <td className="max-w-[170px] truncate px-3 py-3.5 text-ink-body">{r.received_by ?? 'Unknown'}</td>
                    {showBranch && <td className="max-w-[180px] truncate px-3 py-3.5 text-ink-body" title={r.branch ?? ''}>{branchLabel(r.branch)}</td>}
                    <td className="px-3 py-3.5"><StatusTag status={r.order_payment_status} /></td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <button type="button" onClick={() => setViewing(r)} className="text-[13px] font-semibold text-taupe hover:text-taupe-hover hover:underline underline-offset-4 cursor-pointer">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {data && (
                <tfoot>
                  <tr className="border-t-2 border-taupe/40 bg-[#FAF6F3]">
                    <td colSpan={4} className="px-5 py-3 font-bold text-ink">{PERIOD_TOTAL_LABEL[period]} · {count(data.period_total.count)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-bold tabular-nums text-ink">{peso(data.period_total.amount)}</td>
                    <td colSpan={showBranch ? 6 : 5} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {data && (
            <p className="border-t border-line px-1 py-3 text-sm font-bold text-ink md:hidden">{PERIOD_TOTAL_LABEL[period]} · {count(data.period_total.count)} · {peso(data.period_total.amount)}</p>
          )}
          {data && data.meta.last_page > 1 && (
            <nav aria-label="Cash payments pages" className="flex items-center justify-between gap-3 border-t border-line py-3 min-[600px]:px-5">
              <p className="text-xs text-ink-muted tabular-nums">
                {(data.meta.current_page - 1) * data.meta.per_page + 1}–{Math.min(data.meta.current_page * data.meta.per_page, data.meta.total)} of {data.meta.total}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => goToPage(Math.max(1, page - 1))} disabled={page <= 1 || loading} aria-label="Previous page" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-ink hover:bg-sunken disabled:opacity-40 cursor-pointer">
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
                <span className="min-w-20 text-center text-sm font-semibold tabular-nums text-ink">Page {data.meta.current_page} of {data.meta.last_page}</span>
                <button type="button" onClick={() => goToPage(Math.min(data.meta.last_page, page + 1))} disabled={page >= data.meta.last_page || loading} aria-label="Next page" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-ink hover:bg-sunken disabled:opacity-40 cursor-pointer">
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            </nav>
          )}
        </>
      )}

      <CashPaymentModal row={viewing} branchLabel={showBranch ? branchLabel : null} onClose={() => setViewing(null)} />
    </div>
  );
}

/** One cash payment, and where its order stands now. */
function CashPaymentModal({ row, branchLabel, onClose }: Readonly<{
  row: CashRow | null;
  branchLabel: ((name: string | null) => string) | null;
  onClose: () => void;
}>) {
  const r = row;
  const line = (label: string, value: React.ReactNode, strong = false) => (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className={`text-right tabular-nums ${strong ? 'text-base font-bold text-ink' : 'text-sm font-medium text-ink'}`}>{value}</dd>
    </div>
  );

  return (
    <Modal
      isOpen={!!r}
      onClose={onClose}
      title={r ? `Cash payment · ${r.order_number ?? ''}` : 'Cash payment'}
      maxWidth="max-w-md"
      footer={r ? (
        <>
          <button type="button" onClick={onClose} className="h-11 rounded-xl px-4 text-sm font-semibold text-ink-body hover:bg-sunken cursor-pointer">Close</button>
          {r.job_order_id && (
            <Link href={`/dashboard/jobs/${r.job_order_id}`} className="flex h-11 items-center gap-1.5 rounded-xl bg-taupe px-4 text-sm font-semibold text-white hover:bg-taupe-hover">
              Open full order <ExternalLink size={14} aria-hidden="true" />
            </Link>
          )}
        </>
      ) : undefined}
    >
      {r && (
        <div className="space-y-5">
          <div className="rounded-xl border border-[#CFE3CB] bg-[#EEF5EC] px-4 py-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#3F6B3A]">Cash received</p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-[#2F5A2B]">{peso(r.amount)}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#3F6B3A]">
              <TypeTag type={r.type} />
              {r.paid_at && <span>{day(r.paid_at)}, {time(r.paid_at)}</span>}
            </div>
          </div>

          <dl className="divide-y divide-line">
            {line('Customer', r.customer ?? 'Walk-in customer')}
            {line('Received by', r.received_by ?? 'Unknown')}
            {branchLabel && r.branch && line('Branch', branchLabel(r.branch))}
          </dl>

          {r.notes && (
            <p className="rounded-lg border border-line bg-[#FAF6F3] px-3 py-2.5 text-sm text-ink-body">
              <span className="font-semibold text-ink">Note: </span>{r.notes}
            </p>
          )}

          {r.order && (
            <section aria-label="Order">
              <div className="mb-1 flex items-center justify-between gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Order {r.order_number}</h3>
                <StatusTag status={r.order_payment_status} />
              </div>
              <dl className="divide-y divide-line">
                {r.order.service && line('Service', r.order.service)}
                {line('Order total', peso(r.order.total))}
                {r.order.discount > 0 && line('Discount', `− ${peso(r.order.discount)}`)}
                {line('Paid so far', peso(r.order.paid))}
                {line('Balance due', r.order.balance > 0 ? <span className="text-danger">{peso(r.order.balance)}</span> : 'Fully paid', true)}
              </dl>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}
