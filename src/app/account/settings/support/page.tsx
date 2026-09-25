'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LifeBuoy, ChevronRight, Store, Loader2 } from 'lucide-react';
import AccountHeader from '@/components/account/AccountHeader';
import { getMediaUrl } from '@/lib/media';
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

      {tickets === null && (
        <div className="min-h-[50vh] flex items-center justify-center bg-white">
          <Loader2 size={28} className="animate-spin text-ink-faint" />
        </div>
      )}

      {tickets !== null && tickets.length === 0 && (
        <div className="bg-surface border border-line p-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-sunken flex items-center justify-center mb-4">
            <LifeBuoy size={24} className="text-ink-faint" />
          </div>
          <p className="text-sm font-semibold text-ink mb-1">No support tickets yet</p>
          <p className="text-xs text-ink-muted leading-relaxed max-w-[260px]">
            Tickets you submit — like reporting a product — will show up here.
          </p>
        </div>
      )}

      {tickets !== null && tickets.length > 0 && (
        <div className="space-y-2.5">
          {tickets.map((t) => {
            const meta = STATUS_META[t.status] ?? STATUS_META.open;
            return (
              <Link
                key={t.id}
                href={`/account/settings/support/${t.id}`}
                className="flex items-start gap-3 bg-surface border border-line px-4 py-3.5 hover:border-line-strong transition-colors"
              >
                <div className="relative w-9 h-9 shrink-0 rounded-full overflow-hidden bg-sunken mt-0.5">
                  {t.store?.logo_path ? (
                    <Image src={getMediaUrl(t.store.logo_path)} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store size={15} className="text-ink-faint" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink truncate">{t.subject}</p>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.tone}`}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted leading-snug mt-1 line-clamp-2">{t.message}</p>
                  <p className="text-[11px] text-ink-faint mt-1.5">
                    {t.store?.name ?? 'SUTURA'} · {relativeTime(t.created_at)}
                    {t.replies.length > 0 && ` · ${t.replies.length} repl${t.replies.length === 1 ? 'y' : 'ies'}`}
                  </p>
                </div>
                <ChevronRight size={16} className="text-ink-faint shrink-0 mt-1" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
