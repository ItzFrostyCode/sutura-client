'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Check, CheckCircle2, Loader2, Maximize2, RefreshCw, Undo2, X } from 'lucide-react';
import Modal from '@/components/Modal';
import Badge from '@/components/shared/Badge';
import DocumentPreviewModal from '@/components/admin/applications/DocumentPreviewModal';
import { formatDate } from '@/components/admin/useAdminList';
import adminApi from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import {
  methodLabel, peso, QUICK_REJECT_REASONS, REFUND_REASONS, REFUND_STATUS_LABEL, STATUS_BADGE, STATUS_LABEL, TYPE_CLASS, TYPE_LABEL,
  type PaymentDetail, type RefundReasonCode,
} from './paymentTypes';

const CHECKS = [
  { key: 'checked_reference', label: 'Reference no. matches' },
  { key: 'checked_amount', label: 'Amount matches' },
  { key: 'checked_sender', label: 'Sender matches' },
] as const;
type CheckKey = (typeof CHECKS)[number]['key'];

const ACTION_LABEL: Record<string, string> = {
  submitted: 'Sent by the owner',
  resubmitted: 'Sent again by the owner',
  approved: 'Approved (Paid)',
  rejected: 'Rejected',
  receipt_replaced: 'Receipt replaced',
  scheduled_change_applied: 'Plan switched',
  days_carried_over: 'Days carried over',
  terms_accepted: 'Downgrade terms accepted',
  checkout_opened: 'GCash checkout opened',
  paid_online: 'Paid with GCash',
  needs_review: 'Needs an admin',
  cancelled: 'Cancelled',
  refund_requested: 'Refund sent to GCash',
  refunded: 'Refunded',
  refund_failed: 'Refund failed',
};

function Row({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-2 text-sm">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="min-w-0 break-words text-ink">{children ?? '—'}</dd>
    </div>
  );
}

/**
 * Review one GCash payment. A receipt upload: the receipt and what the owner
 * reported on the left, what's due on the right, warnings, the "checked in
 * GCash" checklist, and the timeline; Approve stays off until every check is
 * ticked. Paid with GCash in SUTURA: already confirmed, so the left side shows
 * the confirmation instead, and the admin can refund it (full or partial).
 */
export default function PaymentReviewModal({ paymentId, onClose, onDecided }: {
  readonly paymentId: number | null;
  readonly onClose: () => void;
  readonly onDecided: () => void;
}) {
  const toast = useToast();
  const [detail, setDetail] = useState<PaymentDetail | null>(null);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<{ url: string; blob: Blob } | null>(null);
  const [receiptError, setReceiptError] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [checks, setChecks] = useState<Record<CheckKey, boolean>>({ checked_reference: false, checked_amount: false, checked_sender: false });
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundCode, setRefundCode] = useState<RefundReasonCode>('REQUESTED_BY_CUSTOMER');
  const [refundNote, setRefundNote] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (paymentId === null) return;
    let objectUrl: string | null = null;
    let alive = true;
    setDetail(null); setError(''); setReceipt(null); setReceiptError(false); setRejecting(false); setReason(''); setRefunding(false);
    setChecks({ checked_reference: false, checked_amount: false, checked_sender: false });
    adminApi.get(`/admin/payments/${paymentId}`)
      .then((res) => {
        if (!alive) return;
        const d: PaymentDetail = res.data.data;
        setDetail(d);
        setRefundAmount(String(d.amount_sent ?? d.amount_due));
        setRefundCode(d.type === 'new_shop' && d.status === 'rejected' ? 'CANCELLATION' : 'REQUESTED_BY_CUSTOMER');
        setRefundNote('');
        if (d.channel === 'online') return;
        if (!d.has_receipt) { setReceiptError(true); return; }
        adminApi.get(`/admin/payments/${paymentId}/receipt`, { responseType: 'blob' })
          .then((r) => { if (!alive) return; objectUrl = URL.createObjectURL(r.data); setReceipt({ url: objectUrl, blob: r.data }); })
          .catch(() => { if (alive) setReceiptError(true); });
      })
      .catch((err) => { if (alive) setError(getErrorMessage(err, 'Could not load this payment.')); });
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [paymentId, reloadKey]);

  const decide = async (kind: 'approve' | 'reject') => {
    if (!detail) return;
    setBusy(true);
    try {
      const res = await adminApi.post(`/admin/payments/${detail.id}/${kind}`, kind === 'approve' ? checks : { reason: reason.trim() });
      toast.success(res.data.message);
      onDecided();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save your decision.'));
    } finally {
      setBusy(false);
    }
  };

  const refund = async () => {
    if (!detail) return;
    setBusy(true);
    try {
      const label = REFUND_REASONS.find((r) => r.code === refundCode)?.label ?? 'Refund';
      const res = await adminApi.post(`/admin/payments/${detail.id}/refund`, {
        amount: Number(refundAmount), reason_code: refundCode, reason: refundNote.trim() ? `${label}: ${refundNote.trim()}` : label,
      });
      toast.success(res.data.message);
      onDecided();
      setRefunding(false);
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not send the refund.'));
    } finally {
      setBusy(false);
    }
  };

  // A payment or refund still processing: ask GCash again.
  const syncWithGcash = async () => {
    if (!detail) return;
    setBusy(true);
    try {
      await adminApi.post(`/admin/payments/${detail.id}/sync`);
      onDecided();
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(getErrorMessage(err, 'GCash could not be reached.'));
    } finally {
      setBusy(false);
    }
  };

  const online = detail?.channel === 'online';
  const allChecked = CHECKS.every((c) => checks[c.key]);
  const reviewable = detail?.status === 'pending' && detail.type !== 'new_shop';
  const amountOff = detail && !online && detail.amount_sent !== null && Math.abs(detail.amount_sent - detail.amount_due) > 0.009;
  // A downgrade's "I agree" to its terms, recorded on the payment's history.
  const termsLog = detail?.logs?.find((l) => l.action === 'terms_accepted') ?? null;
  // A pending upgrade from a running paid plan keeps that plan's days left (server: SubscriptionSwitcher::apply).
  const runningSub = detail?.store_subscription;
  const carryDays = detail && detail.status === 'pending' && detail.type === 'upgrade'
    && runningSub?.status === 'active' && runningSub.ends_at && runningSub.plan !== detail.plan?.name
    ? Math.max(0, Math.ceil((new Date(runningSub.ends_at).getTime() - Date.now()) / 86_400_000))
    : 0;
  const refundMax = detail ? (detail.amount_sent ?? detail.amount_due) : 0;
  const refundValue = Number(refundAmount);
  const refundOk = refundValue >= 1 && refundValue <= refundMax + 0.009;

  const onlineFooter = !detail || !online ? undefined : refunding ? (
    <>
      <button type="button" onClick={() => setRefunding(false)} disabled={busy} className="h-11 px-5 border border-line-strong bg-white text-sm font-medium cursor-pointer">Back</button>
      <button type="button" onClick={refund} disabled={busy || !refundOk}
        className="h-11 px-5 bg-ink text-white text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Undo2 size={16} />} Refund {refundOk ? peso(refundValue) : ''}
      </button>
    </>
  ) : (detail.refundable || reviewable) ? (
    <>
      {detail.refundable && (
        <button type="button" onClick={() => setRefunding(true)} disabled={busy}
          className="h-11 px-5 border border-line-strong bg-white text-sm font-medium text-ink flex items-center gap-2 cursor-pointer hover:bg-sunken"><Undo2 size={16} /> Refund</button>
      )}
      {reviewable && (
        <button type="button" onClick={() => decide('approve')} disabled={busy}
          className="h-11 px-5 bg-ink text-white text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Approve
        </button>
      )}
    </>
  ) : undefined;

  const footer = !detail ? undefined : online ? onlineFooter : reviewable ? (
    rejecting ? (
      <>
        <button type="button" onClick={() => setRejecting(false)} disabled={busy} className="h-11 px-5 border border-line-strong bg-white text-sm font-medium cursor-pointer">Back</button>
        <button type="button" onClick={() => decide('reject')} disabled={busy || reason.trim().length < 3}
          className="h-11 px-5 bg-danger text-white text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50">
          {busy && <Loader2 size={16} className="animate-spin" />} Reject payment
        </button>
      </>
    ) : (
      <>
        <button type="button" onClick={() => setRejecting(true)} disabled={busy}
          className="h-11 px-5 border border-danger/40 bg-white text-danger text-sm font-medium flex items-center gap-2 cursor-pointer"><X size={16} /> Reject</button>
        <button type="button" onClick={() => decide('approve')} disabled={busy || !allChecked}
          title={allChecked ? undefined : 'Tick the GCash checklist first'}
          className="h-11 px-5 bg-ink text-white text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Approve
        </button>
      </>
    )
  ) : undefined;

  return (
    <>
      <Modal isOpen={paymentId !== null} onClose={onClose} maxWidth="max-w-5xl" footer={footer}
        title={detail ? <span className="flex flex-wrap items-center gap-2">Payment #{detail.id} <Badge variant={STATUS_BADGE[detail.status]}>{STATUS_LABEL[detail.status]}</Badge></span> : 'Payment'}>
        {error && <p role="alert" className="py-8 text-center text-sm text-danger">{error}</p>}
        {!detail && !error && <div className="flex justify-center py-16"><Loader2 className="animate-spin text-ink-faint" /></div>}

        {detail && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: what the owner sent (or GCash's confirmation, when paid in SUTURA) */}
            {online ? (
            <section className="space-y-4">
              <h3 className="text-eyebrow">Paid with GCash</h3>
              <p className="flex gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                Confirmed by GCash. No receipt to check.
              </p>
              <dl className="divide-y divide-line border-y border-line">
                <Row label="Method">{methodLabel(detail)}</Row>
                <Row label="Reference"><span className="font-mono tabular-nums break-all">{detail.payment_reference}</span></Row>
                <Row label="Amount paid"><span className="tabular-nums">{detail.amount_sent !== null ? peso(detail.amount_sent) : null}</span></Row>
                <Row label="Paid at">{detail.gateway_paid_at ? formatDate(detail.gateway_paid_at, true) : null}</Row>
                <Row label="Started">{formatDate(detail.created_at, true)}</Row>
              </dl>

              {detail.refund_status && (
                <div className={`border px-3 py-2.5 text-sm ${detail.refund_status === 'failed' ? 'border-danger/30 bg-danger/5 text-danger' : 'border-line-strong bg-sunken text-ink'}`}>
                  <p className="font-semibold">{REFUND_STATUS_LABEL[detail.refund_status]}: {peso(detail.refund_amount)}</p>
                  {detail.refund_reason && <p className="mt-0.5 text-ink-body">{detail.refund_reason}</p>}
                  {detail.refunded_at && <p className="mt-0.5 text-xs text-ink-muted">{formatDate(detail.refunded_at, true)}</p>}
                  {detail.refund_status === 'pending' && (
                    <button type="button" onClick={syncWithGcash} disabled={busy}
                      className="mt-2 inline-flex h-9 items-center gap-1.5 border border-line-strong bg-white px-3 text-xs font-semibold text-ink hover:bg-canvas cursor-pointer disabled:opacity-50">
                      <RefreshCw size={13} className={busy ? 'animate-spin' : ''} /> Check with GCash
                    </button>
                  )}
                  {detail.refund_status === 'failed' && <p className="mt-1 text-xs">You can try the refund again.</p>}
                </div>
              )}

              {refunding && (
                <div className="space-y-3 admin-field p-4">
                  <p className="text-eyebrow">Refund to the payer&apos;s GCash</p>
                  <div>
                    <label htmlFor="refund-amount" className="block text-sm text-ink mb-1">Amount (max {peso(refundMax)})</label>
                    <input id="refund-amount" type="number" min="1" step="0.01" max={refundMax} value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)}
                      className="h-11 w-full border border-line-strong bg-surface px-3 text-base tabular-nums text-ink focus:border-ink focus:outline-none" />
                    {!refundOk && refundAmount !== '' && <p className="mt-1 text-xs text-danger">Enter an amount from {peso(1)} to {peso(refundMax)}.</p>}
                  </div>
                  <div>
                    <p className="text-sm text-ink mb-1.5">Reason</p>
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Refund reason">
                      {REFUND_REASONS.map((r) => (
                        <button key={r.code} type="button" role="radio" aria-checked={refundCode === r.code} onClick={() => setRefundCode(r.code)}
                          className={`min-h-9 border px-3 text-xs cursor-pointer ${refundCode === r.code ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-ink hover:border-ink'}`}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea rows={2} maxLength={300} value={refundNote} onChange={(e) => setRefundNote(e.target.value)} aria-label="Refund note"
                    placeholder="Note for the shop (optional)" className="w-full border border-line-strong bg-surface px-3 py-2 text-base text-ink focus:border-ink focus:outline-none" />
                  <p className="text-xs text-ink-muted">The money goes back to the GCash account that paid. A refund doesn&apos;t change the shop&apos;s plan. It can&apos;t be undone.</p>
                </div>
              )}
            </section>
            ) : (
            <section className="space-y-4">
              <h3 className="text-eyebrow">Receipt</h3>
              <button type="button" onClick={() => receipt && setZoom(true)} disabled={!receipt} aria-label="Zoom the GCash receipt"
                className="group relative flex h-80 w-full items-center justify-center overflow-hidden admin-field bg-sunken cursor-zoom-in disabled:cursor-default">
                {receipt ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={receipt.url} alt="GCash receipt" className="h-full w-full object-contain" />
                ) : receiptError ? (
                  <span className="px-4 text-center text-sm text-danger">No receipt image found for this payment.</span>
                ) : <Loader2 className="animate-spin text-ink-faint" />}
                {receipt && (
                  <span className="absolute right-2 top-2 flex items-center gap-1 bg-surface/95 px-2 py-1 text-xs font-semibold text-ink"><Maximize2 size={12} aria-hidden="true" /> Zoom</span>
                )}
              </button>
              <dl className="divide-y divide-line border-y border-line">
                <Row label="GCash ref no."><span className="font-mono tabular-nums">{detail.payment_reference}</span></Row>
                <Row label="Sender">{detail.sender_name}{detail.sender_number && <span className="text-ink-muted"> · {detail.sender_number}</span>}</Row>
                <Row label="Amount sent"><span className="tabular-nums">{detail.amount_sent !== null ? peso(detail.amount_sent) : null}</span></Row>
                <Row label="Paid at">{detail.paid_at_reported ? formatDate(detail.paid_at_reported, true) : null}</Row>
                <Row label="Submitted">{formatDate(detail.created_at, true)}</Row>
              </dl>
            </section>
            )}

            {/* Right: what's due, warnings, checklist, timeline */}
            <section className="space-y-5">
              <div>
                <h3 className="text-eyebrow mb-1">Payment for</h3>
                <dl className="divide-y divide-line border-y border-line">
                  <Row label="Shop">{detail.store?.name}</Row>
                  <Row label="Owner">{detail.owner?.name}{detail.owner?.email && <span className="block text-ink-muted">{detail.owner.email}</span>}</Row>
                  <Row label="Plan">{detail.plan?.name} · {detail.billing_cycle} · <span className={TYPE_CLASS[detail.type]}>{TYPE_LABEL[detail.type]}</span></Row>
                  <Row label="Amount due"><span className="font-semibold tabular-nums">{peso(detail.amount_due)}</span></Row>
                  <Row label="Amount sent">
                    <span className={`tabular-nums ${amountOff ? 'font-semibold text-danger' : ''}`}>{detail.amount_sent !== null ? peso(detail.amount_sent) : null}</span>
                  </Row>
                  <Row label="Billing period">
                    {detail.billing_period_start
                      ? `${formatDate(detail.billing_period_start)} → ${formatDate(detail.billing_period_end)}`
                      : detail.type === 'downgrade' ? 'Starts when the current plan ends' : detail.type === 'renewal' ? 'Added to the current end date' : 'Starts on approval'}
                    {carryDays > 0 && (
                      <span className="mt-1 block font-semibold text-emerald-700">
                        +{carryDays} {carryDays === 1 ? 'day' : 'days'} left on {detail.store_subscription?.plan} carry over to {detail.plan?.name}
                      </span>
                    )}
                  </Row>
                  {detail.store_subscription && (
                    <Row label="Current plan">
                      {detail.store_subscription.plan} ({detail.store_subscription.status}{detail.store_subscription.ends_at ? `, until ${formatDate(detail.store_subscription.ends_at)}` : ''})
                      {detail.store_subscription.scheduled_plan && <span className="block text-ink-muted">Switching to {detail.store_subscription.scheduled_plan} at the end</span>}
                    </Row>
                  )}
                  {detail.type === 'downgrade' && (
                    <Row label="Terms">
                      {termsLog
                        ? <span className="text-emerald-700">Owner accepted the downgrade terms on {formatDate(termsLog.created_at, true)}</span>
                        : <span className="text-ink-muted">No terms on record (sent before terms were required)</span>}
                    </Row>
                  )}
                  {detail.rejection_reason && <Row label="Reject reason"><span className="text-danger">{detail.rejection_reason}</span></Row>}
                  {detail.reviewer && <Row label="Reviewed by">{detail.reviewer} · {formatDate(detail.reviewed_at, true)}</Row>}
                </dl>
              </div>

              {detail.warnings.length > 0 && (
                <ul className="space-y-2" aria-label="Warnings">
                  {detail.warnings.map((w) => (
                    <li key={w.code} className="flex gap-2 border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" /> {w.message}
                    </li>
                  ))}
                </ul>
              )}

              {detail.type === 'new_shop' && detail.status === 'pending' && (
                <p className="border border-line bg-sunken px-3 py-2.5 text-sm text-ink-body">
                  This is a new shop&apos;s plan payment. It&apos;s decided together with the shop application.{' '}
                  {detail.store && <Link href={`/admin/applications/${detail.store.id}`} className="font-semibold text-ink underline underline-offset-2">Open the application</Link>}
                </p>
              )}

              {online && reviewable && (
                <p className="border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                  Paid with GCash, but the plan couldn&apos;t start on its own (see the timeline). Approve it once the shop fits the plan, or refund it.
                </p>
              )}

              {!online && reviewable && !rejecting && (
                <fieldset className="admin-field p-4">
                  <legend className="px-1 text-eyebrow">Checked in GCash</legend>
                  <p className="mb-3 text-xs text-ink-muted">Open your GCash app, find this transaction, then tick each one.</p>
                  <div className="space-y-2">
                    {CHECKS.map((c) => (
                      <label key={c.key} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink">
                        <input type="checkbox" checked={checks[c.key]} onChange={(e) => setChecks((s) => ({ ...s, [c.key]: e.target.checked }))} className="h-5 w-5 accent-ink" />
                        {c.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              {!online && reviewable && rejecting && (
                <div className="rounded-xl border-[1.5px] border-danger/30 p-4">
                  <label htmlFor="payment-reject-reason" className="block text-eyebrow mb-2">Why is it rejected?</label>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {QUICK_REJECT_REASONS.map((r) => (
                      <button key={r} type="button" onClick={() => setReason(r)} aria-pressed={reason === r}
                        className={`min-h-9 border px-3 text-xs cursor-pointer ${reason === r ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-ink hover:border-ink'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                  <textarea id="payment-reject-reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)}
                    placeholder="Or write your own reason" className="w-full border border-line-strong bg-surface px-3 py-2 text-base text-ink focus:border-ink focus:outline-none" />
                  <p className="mt-1 text-xs text-ink-muted">The owner sees this reason and can send the payment again.</p>
                </div>
              )}

              <div>
                <h3 className="text-eyebrow mb-2">Timeline</h3>
                <ol className="space-y-3 border-l-2 border-line pl-4">
                  {detail.logs.map((l) => (
                    <li key={l.id} className="text-sm">
                      <p className="font-medium text-ink">{ACTION_LABEL[l.action] ?? l.action}{l.by && <span className="font-normal text-ink-muted"> · {l.by}</span>}</p>
                      <p className="text-xs text-ink-muted tabular-nums">{formatDate(l.created_at, true)}</p>
                      {l.note && <p className="mt-0.5 text-ink-body">{l.note}</p>}
                    </li>
                  ))}
                  {detail.logs.length === 0 && <li className="text-sm text-ink-muted">No actions yet.</li>}
                </ol>
              </div>
            </section>
          </div>
        )}
      </Modal>

      {zoom && receipt && detail && (
        <DocumentPreviewModal title={`GCash receipt — ${detail.store?.name ?? 'payment'} #${detail.id}`} url={receipt.url} blob={receipt.blob} type="image"
          fileName={`payment-${detail.id}-receipt.${receipt.blob.type.split('/')[1] ?? 'png'}`} onClose={() => setZoom(false)} />
      )}
    </>
  );
}
