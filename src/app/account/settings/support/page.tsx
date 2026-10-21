'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LifeBuoy, ChevronRight, Loader2 } from 'lucide-react';
import AccountHeader from '@/components/account/AccountHeader';
import EmptyState from '@/components/account/EmptyState';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import api from '@/lib/axios';

interface MyTicket {
  id: number;
  subject: string;
  message: string;
  type: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  store: { id: number; name: string; slug: string; logo_path: string | null } | null;
  replies: unknown[];
}

const STATUS_META: Record<MyTicket['status'], { label: string; tone: string }> = {
  open: { label: 'Open', tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  in_progress: { label: 'In Progress', tone: 'text-blue-600 bg-blue-50 border-blue-200' },
  resolved: { label: 'Resolved', tone: 'text-sage bg-sage/10 border-sage/20' },
  closed: { label: 'Closed', tone: 'text-ink-faint bg-sunken border-line' },
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Real listing now, not a "Coming soon" placeholder — but only a view(+reply)
// surface. The only way a ticket lands here today is via "Report This
// Product" on a catalog item's detail page (CatalogInteractionController::
// report()); there's no general "file a new ticket" form yet, so no
// "+ New Ticket" affordance is shown.
export default function SupportTicketListPage() {
  const [tickets, setTickets] = useState<MyTicket[] | null>(null);

  useEffect(() => {
    api.get('/my-tickets')
      .then((res) => setTickets(res.data.data ?? []))
      .catch(() => setTickets([]));
  }, []);

  return (
    <div>
      <AccountHeader title="Support Ticket" backHref="/account/settings" />

      {tickets === null && <div className="flex min-h-[50vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-ink-faint" /></div>}

      {tickets !== null && tickets.length === 0 && (
        <EmptyState Icon={LifeBuoy} title="No support tickets yet" message="Tickets you submit — like reporting a product — will show up here." />
      )}

      {tickets !== null && tickets.length > 0 && (
        <div className="space-y-3">
          {tickets.map((t) => {
            const meta = STATUS_META[t.status] ?? STATUS_META.open;
            return (
              <Link key={t.id} href={`/account/settings/support/${t.id}`} className="card-soft flex items-start gap-3 px-4 py-3.5 transition-opacity active:opacity-80">
                <StoreLogoAvatar
                  src={t.store?.logo_path}
                  name={t.store?.name ?? 'SUTURA'}
                  className="w-9 h-9 rounded-full border border-line-strong shadow-none"
                  textClassName="text-xs font-serif font-bold text-taupe-dark"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="mobile-body-md truncate font-medium text-ink">{t.subject}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.tone}`}>{meta.label}</span>
                  </div>
                  <p className="mobile-caption mt-1 line-clamp-2 text-ink-muted">{t.message}</p>
                  <p className="mobile-caption mt-1.5 text-ink-faint">
                    {t.store?.name ?? 'SUTURA'} · {relativeTime(t.created_at)}
                    {t.replies.length > 0 && ` · ${t.replies.length} repl${t.replies.length === 1 ? 'y' : 'ies'}`}
                  </p>
                </div>
                <ChevronRight size={18} className="mt-1 shrink-0 text-ink-faint" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
