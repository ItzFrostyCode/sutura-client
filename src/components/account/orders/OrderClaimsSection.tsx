'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import Modal from '@/components/Modal';
import HomeSheet from '@/components/home/HomeSheet';
import ClaimForm from '@/components/claims/ClaimForm';
import ClaimSummary from '@/components/claims/ClaimSummary';
import { claimDate, shortDate, type ClaimsPayload, type NewClaim, type OrderClaim } from '@/components/claims/claimTypes';

interface Props {
  readonly orderId: number;
  readonly storeSlug?: string;
  readonly status: string;
}

/**
 * "Report a problem" on a completed order: within 3 days the customer can ask for
 * a free repair or a refund. Shows every claim on the order and where it stands.
 */
export default function OrderClaimsSection({ orderId, storeSlug, status }: Props) {
  const toast = useToast();
  const [data, setData] = useState<ClaimsPayload | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [escalating, setEscalating] = useState<OrderClaim | null>(null);

  const load = useCallback(() => {
    api.get(`/my-orders/${orderId}/claims`).then((r) => setData(r.data.data)).catch(() => setData(null));
  }, [orderId]);

  useEffect(() => { if (status === 'completed') load(); }, [status, load]);

  if (status !== 'completed' || !data) return null;
  if (!data.can_file && data.claims.length === 0) return null;

  const uploadPhoto = async (file: File): Promise<string | null> => {
    if (!storeSlug) return null;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post(`/public/stores/${storeSlug}/upload-reference-image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data?.data?.url ?? null;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not upload the photo.'));
      return null;
    }
  };

  const submit = async (claim: NewClaim): Promise<boolean> => {
    try {
      const res = await api.post(`/my-orders/${orderId}/claims`, claim);
      toast.success(res.data?.message ?? 'Problem reported.');
      setFormOpen(false);
      load();
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not send your report.'));
      return false;
    }
  };

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5 space-y-3" aria-label="Problems with this order">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sunken text-ink-muted"><AlertTriangle size={16} aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-ink">Problem with your order?</h2>
          {data.can_file && data.window_ends_at && (
            <p className="mt-0.5 text-[13px] leading-snug text-ink-muted">
              Report poor stitching or other issues until <span className="font-semibold text-ink">{claimDate(data.window_ends_at)}</span>, for a free repair or a refund.
            </p>
          )}
        </div>
      </div>
      {data.can_file && (
        <button type="button" onClick={() => setFormOpen(true)} className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-line-strong px-4 text-sm font-semibold text-ink hover:bg-sunken sm:w-auto">
          Report a problem
        </button>
      )}

      {data.claims.length > 0 && (
        <ul className="divide-y divide-line border-t border-line">
          {data.claims.map((c) => (
            <li key={c.id} className="pt-4 pb-1 first:pt-4 space-y-3">
              <ClaimSummary claim={c} repairHref={(id) => `/account/orders/${id}`} />
              {c.status === 'awaiting_return' && (
                <p className="text-sm text-ink bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  The shop accepted your refund. Bring the garment back to the shop — they&apos;ll refund you once it&apos;s returned.
                </p>
              )}
              {c.status === 'submitted' && (
                <p className="text-sm text-ink-muted">The shop will review your report and decide on a repair or refund.</p>
              )}
              {c.status === 'repair_offered' && <RepairOfferChoice orderId={orderId} claim={c} onDone={load} />}
              {c.status === 'declined' && (
                c.escalated_ticket_id ? (
                  <p className="text-sm text-ink-muted">Sent to SUTURA support for review. Follow it under <a href="/account/settings/support" className="text-taupe font-semibold hover:underline">Support Tickets</a>.</p>
                ) : (
                  <button type="button" onClick={() => setEscalating(c)} className="min-h-11 text-sm font-semibold text-taupe hover:underline">
                    Disagree? Ask SUTURA support to review
                  </button>
                )
              )}
            </li>
          ))}
        </ul>
      )}

      {!data.can_file && data.reason && data.claims.every((c) => !['submitted', 'repair_offered', 'repairing', 'awaiting_return'].includes(c.status)) && (
        <p className="text-xs text-ink-muted">{data.reason}</p>
      )}

      <HomeSheet isOpen={formOpen} onClose={() => setFormOpen(false)} title="Report a problem">
        {formOpen && <ClaimForm uploadPhoto={uploadPhoto} onSubmit={submit} onCancel={() => setFormOpen(false)} />}
      </HomeSheet>

      <EscalateModal orderId={orderId} claim={escalating} onClose={() => setEscalating(null)} onDone={load} />
    </section>
  );
}

// The shop offered a free repair on the customer's refund claim: the customer decides.
function RepairOfferChoice({ orderId, claim, onDone }: Readonly<{ orderId: number; claim: OrderClaim; onDone: () => void }>) {
  const toast = useToast();
  const [busy, setBusy] = useState<'repair' | 'refund' | null>(null);

  const choose = async (choice: 'repair' | 'refund') => {
    setBusy(choice);
    try {
      const res = await api.post(`/my-orders/${orderId}/claims/${claim.id}/respond`, { choice });
      toast.success(res.data?.message ?? 'Saved.');
      onDone();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not send your answer.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="border border-blue-200 bg-blue-50/60 rounded-lg p-3 space-y-3">
      <p className="text-sm text-ink">
        The shop offered to <span className="font-semibold">repair it for free</span> instead of a refund
        {claim.repair_offer?.due_date ? <>, ready by <span className="font-semibold">{shortDate(claim.repair_offer.due_date)}</span></> : ''}. It&apos;s your choice.
      </p>
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
        <button type="button" disabled={busy !== null} onClick={() => void choose('repair')} className="min-h-11 px-3 bg-ink text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
          {busy === 'repair' && <Loader2 size={14} className="animate-spin" />} Accept free repair
        </button>
        <button type="button" disabled={busy !== null} onClick={() => void choose('refund')} className="min-h-11 px-3 border border-ink text-ink text-sm font-semibold flex items-center justify-center gap-2 hover:bg-sunken disabled:opacity-50">
          {busy === 'refund' && <Loader2 size={14} className="animate-spin" />} Keep refund request
        </button>
      </div>
    </div>
  );
}

function EscalateModal({ orderId, claim, onClose, onDone }: Readonly<{ orderId: number; claim: OrderClaim | null; onClose: () => void; onDone: () => void }>) {
  const toast = useToast();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const send = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!claim) return;
    setSending(true);
    try {
      const res = await api.post(`/my-orders/${orderId}/claims/${claim.id}/escalate`, { message: message.trim() });
      toast.success(res.data?.message ?? 'Sent to SUTURA support.');
      setMessage('');
      onClose();
      onDone();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not send it to support.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={!!claim} onClose={onClose} title="Ask SUTURA support to review">
      <form onSubmit={send} className="space-y-4">
        <p className="text-sm text-ink-body">SUTURA support will see your report, your photos and the shop&apos;s reason, and reply under Support Tickets.</p>
        <div>
          <label htmlFor="escalate-message" className="block text-sm font-medium text-ink-body mb-1.5">Why do you disagree?</label>
          <textarea
            id="escalate-message"
            rows={4}
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-canvas border border-line rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-taupe resize-none"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="min-h-11 px-4 rounded-lg text-sm font-medium text-ink-body hover:bg-sunken">Cancel</button>
          <button type="submit" disabled={sending || message.trim().length < 10} className="min-h-11 px-4 rounded-lg bg-ink text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            {sending && <Loader2 size={14} className="animate-spin" />}
            Send to support
          </button>
        </div>
      </form>
    </Modal>
  );
}
