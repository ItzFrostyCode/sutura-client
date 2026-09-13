'use client';

import { useEffect, useState } from 'react';
import { ScrollText, Loader2, ChevronLeft, ChevronRight, Tag, Percent, XCircle, CalendarClock, CheckCircle2, Trash2, RotateCcw, UserMinus, Scissors, MapPinOff, ImageOff, Building2 } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import PageHeader from '@/components/shared/PageHeader';
import { TableSkeleton } from '@/components/ui/Skeleton';

interface AuditLogEntry {
  id: number;
  user: { id: number; name: string } | null;
  action: string;
  model_type: string;
  model_id: number;
  payload: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

const ACTION_META: Record<string, { label: string; icon: typeof Tag; color: string }> = {
  discount_applied:        { label: 'Discount Applied',        icon: Percent,       color: 'bg-amber-50 text-amber-700 border-amber-200' },
  payment_rejected:        { label: 'Payment Rejected',        icon: XCircle,       color: 'bg-red-50 text-red-600 border-red-200' },
  appointment_rescheduled: { label: 'Appointment Rescheduled',   icon: CalendarClock, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  appointment_completed:   { label: 'Appointment Completed',    icon: CheckCircle2,  color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  job_order_deleted:       { label: 'Job Order Deleted',        icon: Trash2,        color: 'bg-red-50 text-red-600 border-red-200' },
  job_order_restored:      { label: 'Job Order Restored',       icon: RotateCcw,     color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  staff_removed:           { label: 'Staff Removed',            icon: UserMinus,     color: 'bg-red-50 text-red-600 border-red-200' },
  service_deleted:         { label: 'Service Deleted',          icon: Scissors,      color: 'bg-red-50 text-red-600 border-red-200' },
  service_restored:        { label: 'Service Restored',         icon: RotateCcw,     color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  branch_deleted:          { label: 'Branch Deleted',           icon: MapPinOff,     color: 'bg-red-50 text-red-600 border-red-200' },
  catalog_item_deleted:    { label: 'Catalog Item Deleted',     icon: ImageOff,      color: 'bg-red-50 text-red-600 border-red-200' },
  branch_set_main:         { label: 'Set as Main Branch',       icon: Building2,     color: 'bg-amber-50 text-amber-800 border-amber-200' },
};

// Model class names come back fully-qualified (App\Models\JobOrder) — strip
// the namespace and split CamelCase into readable words for display.
const modelLabel = (modelType: string) => {
  const short = modelType.split('\\').pop() || modelType;
  return short.replace(/([a-z])([A-Z])/g, '$1 $2');
};

const formatPayload = (action: string, rawPayload: Record<string, unknown> | string | null): string => {
  if (!rawPayload) return '—';

  let payload: Record<string, unknown>;
  if (typeof rawPayload === 'string') {
    try {
      payload = JSON.parse(rawPayload);
    } catch {
      return rawPayload;
    }
  } else {
    payload = rawPayload;
  }

  if (payload.description && typeof payload.description === 'string') {
    return payload.description;
  }

  switch (action) {
    case 'discount_applied':
      return `₱${Number(payload.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}${payload.reason ? ` — "${payload.reason}"` : ''}`;
    case 'payment_rejected':
      return `₱${Number(payload.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })} — "${payload.reason ?? '—'}"`;
    case 'appointment_rescheduled':
      return `"${payload.reason ?? 'No reason given'}"`;
    case 'appointment_completed':
      return `Type: ${payload.type ?? '—'}${payload.job_order_id ? ` · Job #${payload.job_order_id}` : ''}`;
    case 'job_order_deleted':
    case 'job_order_restored':
      return `${payload.order_number ?? '—'} (was: ${payload.status ?? '—'})`;
    case 'staff_removed':
      return `${payload.name ?? '—'} (${payload.role ?? '—'})`;
    case 'service_deleted':
    case 'service_restored':
    case 'branch_deleted':
    case 'catalog_item_deleted':
      return `${payload.name ?? '—'}`;
    case 'branch_set_main':
      return `Designated "${payload.name ?? payload.branch_name ?? 'Branch'}" as Primary Headquarters`;
    default: {
      if (typeof payload === 'object' && payload !== null) {
        if ('name' in payload && Object.keys(payload).length === 1) {
          return `"${payload.name}"`;
        }
        if ('reason' in payload && Object.keys(payload).length === 1) {
          return `"${payload.reason}"`;
        }
        const entries = Object.entries(payload)
          .filter(([_, v]) => v !== null && v !== undefined && v !== '')
          .map(([k, v]) => `${k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
        if (entries.length > 0) return entries.join(' · ');
      }
      return String(payload ?? '—');
    }
  }
};

export default function AuditLogPage() {
  const { shop } = useAuthStore();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    if (!shop) return;
    setLoading(true);
    api.get(`/shops/${shop.id}/audit-logs`, { params: { page } })
      .then(res => {
        const data = res.data.data;
        setLogs(data.data || []);
        setLastPage(data.last_page || 1);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [shop, page]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Accountability"
        title="Audit Log"
        description="A record of accountability-sensitive actions — discounts, payment rejections, and reschedules — with who did it, when, and why."
      />

      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={8} cols={5} />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-ink-faint text-sm">No audit log entries yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-canvas border-b border-line">
                <tr>
                  <th className="px-5 py-3 font-semibold text-ink-muted text-xs uppercase tracking-wide">When</th>
                  <th className="px-5 py-3 font-semibold text-ink-muted text-xs uppercase tracking-wide">Who</th>
                  <th className="px-5 py-3 font-semibold text-ink-muted text-xs uppercase tracking-wide">Action</th>
                  <th className="px-5 py-3 font-semibold text-ink-muted text-xs uppercase tracking-wide">On</th>
                  <th className="px-5 py-3 font-semibold text-ink-muted text-xs uppercase tracking-wide">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {logs.map(entry => {
                  const meta = ACTION_META[entry.action] ?? {
                    label: entry.action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                    icon: Tag,
                    color: 'bg-sunken text-ink-muted border-line',
                  };
                  const Icon = meta.icon;
                  return (
                    <tr key={entry.id} className="hover:bg-canvas transition-colors">
                      <td className="px-5 py-3 text-ink-body whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-5 py-3 text-ink-body font-medium whitespace-nowrap">{entry.user?.name ?? 'Unknown'}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.color}`}>
                          <Icon size={12} /> {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-ink-muted whitespace-nowrap">{modelLabel(entry.model_type)} #{entry.model_id}</td>
                      <td className="px-5 py-3 text-ink-body">{formatPayload(entry.action, entry.payload)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {lastPage > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-line text-sm text-ink-muted">
            <span>Page {page} of {lastPage}</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="w-11 h-11 flex items-center justify-center rounded-lg border border-line disabled:opacity-40 hover:bg-canvas transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                className="w-11 h-11 flex items-center justify-center rounded-lg border border-line disabled:opacity-40 hover:bg-canvas transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
