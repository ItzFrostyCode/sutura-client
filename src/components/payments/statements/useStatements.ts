import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useBranch } from '@/context/BranchContext';
import { useToast } from '@/context/ToastContext';
import { rangeFor, type PeriodId } from './periods';

export interface StatementEntry {
  key: string; kind: 'job' | 'appointment' | 'catalog'; kind_label: string; date: string | null;
  doc_no: string | null; customer: string | null; method: string; payment_type: string | null; source: string | null;
  amount: number | null; status: string; reference: string | null; branch: string | null;
  has_receipt: boolean; receipt_available: boolean;
}
interface Summary {
  first_record_date: string | null; plan_allows_export: boolean; truncated: boolean; entries: StatementEntry[];
  totals: { records: number; with_receipt: number; amount: number; verified_amount: number };
}
export type Kind = 'job' | 'appointment' | 'catalog';
// Order payments only: appointment deposits and catalog orders were taken off the Payments page.
export const KIND_OPTIONS: { id: Kind; label: string }[] = [
  { id: 'job', label: 'Order payments' },
];

// A blob error body is JSON text — read the server's message out of it.
async function errorText(err: unknown, fallback: string): Promise<string> {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  try {
    const text = data instanceof Blob ? await data.text() : JSON.stringify(data ?? {});
    return (JSON.parse(text) as { message?: string }).message ?? fallback;
  } catch { return fallback; }
}

export function useStatements() {
  const { store } = useAuthStore();
  const { selectedBranchId } = useBranch();
  const toast = useToast();
  const [period, setPeriod] = useState<PeriodId>('this_month');
  const [custom, setCustom] = useState<[string, string]>(() => rangeFor('this_month', null));
  const [kinds, setKinds] = useState<Kind[]>(['job']);
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const [from, to] = useMemo(() => (period === 'custom' ? custom : rangeFor(period, data?.first_record_date ?? null)), [period, custom, data?.first_record_date]);
  const params = useMemo(() => ({ from, to, kinds, ...(selectedBranchId ? { branch_id: selectedBranchId } : {}) }), [from, to, kinds, selectedBranchId]);

  const load = useCallback(() => {
    if (!store?.id) return;
    setLoading(true);
    api.get(`/stores/${store.id}/receipts`, { params })
      .then((res) => { setData(res.data.data); setSelected([]); })
      .catch(() => toast.error('Could not load the statement.'))
      .finally(() => setLoading(false));
  }, [store?.id, params, toast]);

  useEffect(load, [load]);

  const save = (blob: Blob, headers: Record<string, unknown>, fallback: string) => {
    const name = /filename="?([^";]+)"?/.exec(String(headers['content-disposition'] ?? ''))?.[1] ?? fallback;
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const download = async (what: 'selected' | 'range', format: 'zip' | 'csv') => {
    if (!store?.id) return;
    setBusy(`${what}-${format}`);
    try {
      const res = await api.get(`/stores/${store.id}/receipts/export`, {
        params: { ...params, format, ...(what === 'selected' ? { keys: selected } : {}) },
        responseType: 'blob',
      });
      save(res.data, res.headers as Record<string, unknown>, `statement.${format}`);
    } catch (err) { toast.error(await errorText(err, 'Could not prepare the download.')); } finally { setBusy(null); }
  };

  // Branded .xlsx of the whole period: built from the same (Premium) CSV export so it holds
  // exactly the same records, then laid out with the shop's logo and SUTURA colours.
  const downloadExcel = async () => {
    if (!store?.id) return;
    setBusy('range-xlsx');
    try {
      const res = await api.get(`/stores/${store.id}/receipts/export`, { params: { ...params, format: 'csv' }, responseType: 'blob' });
      const { parseCsv, downloadBrandedXlsx, shopOrSuturaLogo } = await import('@/lib/brandedExport');
      const lines = parseCsv(await (res.data as Blob).text());
      const headerAt = lines.findIndex((l) => l[0] === 'Date');
      if (headerAt < 0) throw new Error('Unexpected statement format');
      const preamble = Object.fromEntries(lines.slice(0, headerAt).filter((l) => l[0]).map((l) => [l[0], l.slice(1)]));
      // Drop the "Receipt file" column: it only means something inside the ZIP download.
      const keep = lines[headerAt].map((h, i) => [h, i] as const).filter(([h]) => h !== 'Receipt file').map(([, i]) => i);
      const columns = keep.map((i) => lines[headerAt][i]);
      const rows = lines.slice(headerAt + 1).filter((l) => l.some((v) => v !== '')).map((l) => keep.map((i) => l[i] ?? ''));
      const amountCol = columns.indexOf('Amount (PHP)');
      const records = preamble['Records']?.[0] ?? String(rows.length);
      const total = preamble['Records']?.[2] ?? '';
      await downloadBrandedXlsx({
        fileName: `statement_${from}_to_${to}.xlsx`,
        sheetName: 'Statement',
        org: store.name ?? 'SUTURA',
        title: 'Payment statement',
        subtitle: `${preamble['Period']?.[0] ?? `${from} to ${to}`} · generated ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}`,
        meta: [['Records', Number(records)], ['Total (excluding rejected)', total]],
        tables: [{
          columns,
          rows,
          money: amountCol >= 0 ? [amountCol] : [],
          total: amountCol >= 0 ? columns.map((_, i) => (i === 0 ? 'TOTAL (excluding rejected)' : i === amountCol ? total : null)) : undefined,
        }],
      }, await shopOrSuturaLogo(store.id));
    } catch (err) { toast.error(await errorText(err, "The Excel file couldn't be created. Try again, or use the CSV.")); } finally { setBusy(null); }
  };

  const downloadOne = async (key: string) => {
    if (!store?.id) return;
    setBusy(key);
    try {
      const res = await api.get(`/stores/${store.id}/receipts/file`, { params: { key }, responseType: 'blob' });
      save(res.data, res.headers as Record<string, unknown>, 'receipt.png');
    } catch (err) { toast.error(await errorText(err, 'No receipt image is stored for this record.')); } finally { setBusy(null); }
  };

  const toggleKind = (k: Kind) => setKinds((cur) => (cur.includes(k) ? (cur.length > 1 ? cur.filter((x) => x !== k) : cur) : [...cur, k]));
  const toggleRow = (key: string) => setSelected((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));
  const selectableKeys = useMemo(() => (data?.entries ?? []).filter((e) => e.receipt_available).map((e) => e.key), [data]);
  const toggleAll = () => setSelected((cur) => (cur.length === selectableKeys.length ? [] : selectableKeys));

  const printHref = `/print/payments?${new URLSearchParams({ from, to, kinds: kinds.join(','), ...(selectedBranchId ? { branch_id: String(selectedBranchId) } : {}) }).toString()}`;

  return { period, setPeriod, custom, setCustom, from, to, kinds, toggleKind, data, loading, selected, toggleRow, toggleAll, selectableKeys, busy, download, downloadExcel, downloadOne, printHref };
}
