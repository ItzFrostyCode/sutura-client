'use client';

import { useState } from 'react';
import Badge, { type BadgeVariant } from '@/components/shared/Badge';
import PageHeader from '@/components/shared/PageHeader';
import { FilterTabs, ListState } from '@/components/admin/ui/AdminPrimitives';
import TicketModal from '@/components/admin/tickets/TicketModal';
import { formatDate, useAdminList } from '@/components/admin/useAdminList';

interface TicketRow {
  id: number;
  subject: string;
  type: string;
  status: string;
  priority: string;
  created_at: string;
  store: { name: string } | null;
  submitted_by: { name: string } | null;
}

const FILTERS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: '', label: 'All' },
];
const PRIORITY: Record<string, BadgeVariant> = { high: 'danger', urgent: 'danger', medium: 'warning', low: 'neutral' };

export default function AdminTicketsPage() {
  const [status, setStatus] = useState('open');
  const [openId, setOpenId] = useState<number | null>(null);
  const { items, loading, error, reload } = useAdminList<TicketRow>('/admin/tickets', { status });

  return (
    <div className="space-y-6">
      <PageHeader title="Support" description="Tickets and product reports from shop owners.">
        <FilterTabs options={FILTERS} value={status} onChange={setStatus} />
      </PageHeader>

      <div className="border border-line bg-surface">
        <ListState loading={loading} error={error} empty={items.length === 0} emptyText="No tickets here." />
        {!loading && !error && items.length > 0 && (
          <ul className="divide-y divide-line">
            {items.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => setOpenId(t.id)} className="flex min-h-16 w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-left hover:bg-canvas">
                  <div className="min-w-0 flex-1 basis-60">
                    <p className="truncate font-semibold text-ink">{t.subject}</p>
                    <p className="truncate text-sm text-ink-muted">{t.store?.name ?? 'No store'} · {t.submitted_by?.name} · {formatDate(t.created_at)}</p>
                  </div>
                  <span className="flex shrink-0 flex-wrap gap-1.5">
                    {t.type === 'product_report' && <Badge variant="accent">Product report</Badge>}
                    <Badge variant={PRIORITY[t.priority] ?? 'neutral'} className="capitalize">{t.priority}</Badge>
                    <Badge className="capitalize">{t.status.replace('_', ' ')}</Badge>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <TicketModal ticketId={openId} onClose={() => setOpenId(null)} onChanged={reload} />
    </div>
  );
}
