'use client';

import { use, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Store, Send, Loader2 } from 'lucide-react';
import AccountHeader from '@/components/account/AccountHeader';
import { getMediaUrl } from '@/lib/media';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';

interface TicketReply {
  id: number;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
  user: { id: number; name: string } | null;
}

interface TicketDetail {
  id: number;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  store: { id: number; name: string; slug: string; logo_path: string | null } | null;
  replies: TicketReply[];
}

const STATUS_META: Record<TicketDetail['status'], { label: string; tone: string }> = {
  open: { label: 'Open', tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  in_progress: { label: 'In Progress', tone: 'text-blue-600 bg-blue-50 border-blue-200' },
  resolved: { label: 'Resolved', tone: 'text-sage bg-sage/10 border-sage/20' },
  closed: { label: 'Closed', tone: 'text-ink-faint bg-sunken border-line' },
};

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function SupportTicketDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const { user } = useAuthStore();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get(`/my-tickets/${id}`)
      .then((res) => setTicket(res.data.data))
      .catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [ticket?.replies.length]);

  const handleSendReply = async () => {
    const trimmed = replyText.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const res = await api.post(`/my-tickets/${id}/reply`, { message: trimmed });
      setTicket((prev) => (prev ? { ...prev, replies: [...prev.replies, res.data.data], status: 'open' } : prev));
      setReplyText('');
    } catch {
      // Non-critical for this view — the text stays in the box so the user can retry.
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <AccountHeader title="Ticket Details" backHref="/account/settings/support" />

      {!ticket && !notFound && (
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 size={28} className="animate-spin text-ink-faint" />
        </div>
      )}
      {notFound && <div className="py-16 text-center text-sm text-ink-muted">Ticket not found.</div>}

      {ticket && (
        <>
          <div className="flex-1">
            <div className="card-soft mb-3 p-4">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-line-strong bg-sunken">
                  {ticket.store?.logo_path ? (
                    <Image src={getMediaUrl(ticket.store.logo_path)} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store size={13} className="text-ink-faint" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-semibold text-ink-muted truncate">{ticket.store?.name ?? 'SUTURA'}</span>
                <span className={`ml-auto shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_META[ticket.status].tone}`}>
                  {STATUS_META[ticket.status].label}
                </span>
              </div>
              <p className="text-sm font-bold text-ink mb-1.5">{ticket.subject}</p>
              <p className="text-sm text-ink-body leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
              <p className="text-[11px] text-ink-faint mt-2.5">{formatDateTime(ticket.created_at)}</p>
            </div>

            {ticket.replies.map((r) => {
              const isMine = !r.is_admin_reply && r.user?.id === user?.id;
              return (
                <div key={r.id} className={`flex mb-2.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${isMine ? 'rounded-br-md bg-ink text-white' : 'card-soft rounded-bl-md text-ink-body'}`}>
                    <p className={`text-[11px] font-semibold mb-1 ${isMine ? 'text-white/80' : 'text-ink-muted'}`}>
                      {r.is_admin_reply ? 'SUTURA Support' : isMine ? 'You' : r.user?.name ?? 'User'}
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.message}</p>
                    <p className={`text-[10px] mt-1.5 ${isMine ? 'text-white/60' : 'text-ink-faint'}`}>{formatDateTime(r.created_at)}</p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {ticket.status !== 'closed' && (
            <div className="sticky bottom-[var(--bottom-nav-space)] mt-2.5 flex items-end gap-2 bg-canvas py-2.5">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type a reply…"
                rows={1}
                className="max-h-24 flex-1 resize-none rounded-2xl bg-sunken px-4 py-2.5 text-base text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-line-strong"
              />
              <button
                type="button"
                onClick={() => void handleSendReply()}
                disabled={!replyText.trim() || sending}
                aria-label="Send reply"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-opacity active:opacity-80 disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
