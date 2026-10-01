'use client';

import { useCallback, useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import adminApi from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '../useAdminList';

const ROLE_LABEL: Record<string, string> = { store_owner: 'Owner', branch_manager: 'Branch manager', staff: 'Staff', customer: 'Customer' };

interface TicketDetail {
  id: number;
  subject: string;
  message: string;
  status: string;
  type: string;
  created_at: string;
  store: { name: string } | null;
  submitted_by: { name: string; email: string } | null;
  submitted_by_role?: string | null;
  catalog_item: { name: string; admin_hidden_at: string | null } | null;
  replies: { id: number; message: string; is_admin_reply: boolean; created_at: string; user: { name: string } | null }[];
}

export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

// Uses the admin ticket endpoints that already existed server-side
// (SupportTicketAdminController) — they just never had a UI.
export default function TicketModal({ ticketId, onClose, onChanged }: { readonly ticketId: number | null; readonly onClose: () => void; readonly onChanged: () => void }) {
  const toast = useToast();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (ticketId === null) return;
    adminApi.get(`/admin/tickets/${ticketId}`).then((res) => setTicket(res.data.data)).catch(() => toast.error('Could not load this ticket.'));
  }, [ticketId, toast]);

  useEffect(() => { setTicket(null); setReply(''); load(); }, [load]);

  const run = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(message);
      load();
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Something went wrong.'));
    } finally {
      setBusy(false);
    }
  };

  const sendReply = () => run(async () => {
    await adminApi.post(`/admin/tickets/${ticketId}/reply`, { message: reply.trim() });
    setReply('');
  }, 'Reply sent — the owner has been notified.');

  const setStatus = (status: string) => run(() => adminApi.put(`/admin/tickets/${ticketId}/status`, { status }), 'Ticket status updated.');

  return (
    <Modal isOpen={ticketId !== null} onClose={onClose} title={ticket?.subject ?? 'Ticket'} maxWidth="max-w-2xl"
      footer={ticket && (
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <textarea aria-label="Reply" rows={2} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply…"
            className="min-h-12 flex-1 border border-line-strong bg-surface p-3 text-base text-ink focus:border-ink focus:outline-none" />
          <button type="button" disabled={busy || !reply.trim()} onClick={sendReply} className="min-h-12 bg-ink px-5 text-sm font-semibold text-white disabled:opacity-40">Send</button>
        </div>
      )}>
      {!ticket ? <p className="text-sm text-ink-muted">Loading…</p> : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-ink-muted">
            <span>{ticket.store?.name ?? 'No store'} · {ticket.submitted_by?.name}{ticket.submitted_by_role ? ` (${ROLE_LABEL[ticket.submitted_by_role] ?? ticket.submitted_by_role})` : ''} · {formatDate(ticket.created_at, true)}</span>
            <select aria-label="Status" value={ticket.status} disabled={busy} onChange={(e) => setStatus(e.target.value)}
              className="min-h-11 border border-line-strong bg-surface px-3 text-base capitalize text-ink">
              {TICKET_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          {ticket.catalog_item && (
            <p className="border-l-2 border-alert bg-sunken px-4 py-2 text-sm text-ink">
              Reported design: <strong className="font-semibold">{ticket.catalog_item.name}</strong>
              {ticket.catalog_item.admin_hidden_at && ' (already hidden)'}
            </p>
          )}
          <p className="whitespace-pre-line text-base text-ink-body">{ticket.message}</p>
          <ul className="space-y-3 border-t border-line pt-4">
            {ticket.replies.map((r) => (
              <li key={r.id} className={`border-l-2 px-4 py-2 ${r.is_admin_reply ? 'border-taupe bg-taupe/5' : 'border-line-strong'}`}>
                <p className="text-xs text-ink-muted">{r.user?.name ?? 'Unknown'}{r.is_admin_reply && ' · SUTURA'} · {formatDate(r.created_at, true)}</p>
                <p className="mt-1 whitespace-pre-line text-sm text-ink">{r.message}</p>
              </li>
            ))}
            {ticket.replies.length === 0 && <li className="text-sm text-ink-muted">No replies yet.</li>}
          </ul>
        </div>
      )}
    </Modal>
  );
}
