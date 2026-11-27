'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Upload } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { getMediaUrl } from '@/lib/media';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import Modal from '@/components/Modal';
import ClaimForm from '@/components/claims/ClaimForm';
import ClaimSummary from '@/components/claims/ClaimSummary';
import { claimDate, peso, type ClaimsPayload, type NewClaim, type OrderClaim } from '@/components/claims/claimTypes';
import type { Staff } from '@/components/staff/staffHelpers';
import { staffForBranch, staffOptionLabel } from '@/components/staff/staffHelpers';
import { getLocalDateString } from '@/components/appointments/appointmentHelpers';

type Action = { kind: 'accept' | 'offer' | 'decline' | 'refund'; claim: OrderClaim } | { kind: 'file' } | null;

interface Props {
  readonly jobId: number;
  readonly jobStatus: string;
  readonly branchId?: number | null;
  readonly isOwnerOrManager: boolean;
}

const field = 'w-full min-h-11 bg-canvas border border-line rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-taupe';

/**
 * After-sale claims on this order. Anyone at the counter can file one for a walk-in;
 * the owner/branch manager accepts (repair → ₱0 repair order; refund → wait for the
 * garment, then record the refund) or declines with a reason.
 */
export default function JobClaimsCard({ jobId, jobStatus, branchId, isOwnerOrManager }: Props) {
  const store = useAuthStore((s) => s.store);
  const toast = useToast();
  const [data, setData] = useState<ClaimsPayload | null>(null);
  const [action, setAction] = useState<Action>(null);

  const load = useCallback(() => {
    if (!store?.id) return;
    api.get(`/stores/${store.id}/jobs/${jobId}/claims`).then((r) => setData(r.data.data)).catch(() => setData(null));
  }, [store?.id, jobId]);

  useEffect(() => { load(); }, [load, jobStatus]);

  if (!store || !data) return null;
  if (jobStatus !== 'completed' && data.claims.length === 0) return null;

  const close = () => setAction(null);
  const done = () => { setAction(null); load(); };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post(`/stores/${store.id}/claims/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data?.data?.url ?? null;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not upload the photo.'));
      return null;
    }
  };

  const fileClaim = async (claim: NewClaim) => {
    try {
      await api.post(`/stores/${store.id}/jobs/${jobId}/claims`, claim);
      toast.success('Claim filed.');
      done();
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not file the claim.'));
      return false;
    }
  };

  const open = data.claims.filter((c) => ['submitted', 'repair_offered', 'repairing', 'awaiting_return'].includes(c.status)).length;
  // Claims waiting on the owner/manager: a decision, or a refund to record.
  const needsAction = isOwnerOrManager ? data.claims.filter((c) => c.status === 'submitted' || c.status === 'awaiting_return').length : 0;
  const urgent = needsAction > 0;

  return (
    <div className={`bg-surface rounded-2xl shadow-2xs overflow-hidden ${urgent ? 'border-2 border-rose-600 ring-4 ring-rose-600/10' : 'border border-line'}`}>
      {urgent && (
        <div className="flex items-center gap-3 bg-rose-600 text-white px-5 py-3" role="alert">
          {/* A pulsing warning mark so an unanswered claim can't be missed; still when reduced motion is on. */}
          <span className="relative flex shrink-0 w-8 h-8 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-white/40 motion-safe:animate-ping" aria-hidden />
            <span className="relative flex w-8 h-8 items-center justify-center rounded-full bg-white text-rose-600">
              <AlertTriangle size={17} strokeWidth={2.5} />
            </span>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight">
              {needsAction === 1 ? 'A customer reported a problem' : `${needsAction} claims need you`}
            </p>
            <p className="text-xs text-white/85 leading-tight mt-0.5">Review it below and accept or decline.</p>
          </div>
        </div>
      )}
      <div className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
        <h3 className="font-bold text-sm text-ink flex items-center gap-2">
          <AlertTriangle size={15} className={urgent ? 'text-rose-600' : 'text-taupe'} /> Repair &amp; Refund Claims
          {open > 0 && <span className={`text-[11px] font-bold px-1.5 rounded ${urgent ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{open} open</span>}
        </h3>
      </div>

      {data.can_file && data.window_ends_at && (
        <div className="text-xs text-ink-muted space-y-2">
          <p>The customer can report a problem until <span className="font-semibold text-ink">{claimDate(data.window_ends_at)}</span>.</p>
          <button type="button" onClick={() => setAction({ kind: 'file' })} className="min-h-11 w-full border border-line-strong rounded-lg text-sm font-semibold text-ink hover:bg-sunken">
            File a claim for the customer
          </button>
        </div>
      )}

      {data.claims.length === 0 && !data.can_file && <p className="text-xs text-ink-muted">{data.reason ?? 'No claims on this order.'}</p>}

      <ul className="space-y-4">
        {data.claims.map((c) => (
          <li key={c.id} className={`space-y-3 rounded-xl p-3 ${isOwnerOrManager && (c.status === 'submitted' || c.status === 'awaiting_return') ? 'border-2 border-rose-300 bg-rose-50/40' : 'border border-line'}`}>
            <ClaimSummary claim={c} forShop repairHref={(id) => `/dashboard/jobs/${id}`} />
            {isOwnerOrManager && c.status === 'submitted' && (
              <div className="space-y-2">
                <button type="button" onClick={() => setAction({ kind: 'accept', claim: c })} className="min-h-11 w-full rounded-lg bg-ink text-white text-sm font-semibold hover:bg-ink/90">
                  Accept {c.type === 'refund' ? 'refund' : 'repair'}
                </button>
                <div className={`grid gap-2 ${c.type === 'refund' && !c.repair_offer ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {/* On a refund claim the shop can offer a free repair once; the customer decides. */}
                  {c.type === 'refund' && !c.repair_offer && (
                    <button type="button" onClick={() => setAction({ kind: 'offer', claim: c })} className="min-h-11 rounded-lg border border-ink text-sm font-semibold text-ink hover:bg-sunken">Offer repair instead</button>
                  )}
                  <button type="button" onClick={() => setAction({ kind: 'decline', claim: c })} className="min-h-11 rounded-lg border border-line-strong text-sm font-semibold text-ink hover:bg-sunken">Decline</button>
                </div>
              </div>
            )}
            {c.status === 'repair_offered' && (
              <div className="space-y-2">
                <p className="text-xs text-ink-muted">Waiting for the customer to choose: the free repair, or keep the refund request.</p>
                {isOwnerOrManager && <CounterAnswer storeId={store.id} claim={c} onDone={load} />}
              </div>
            )}
            {c.status === 'awaiting_return' && (
              isOwnerOrManager ? (
                <button type="button" onClick={() => setAction({ kind: 'refund', claim: c })} className="min-h-11 w-full rounded-lg bg-ink text-white text-sm font-semibold hover:bg-ink/90">
                  Garment returned — record refund
                </button>
              ) : (
                <p className="text-xs text-ink-muted">Waiting for the customer to return the garment.</p>
              )
            )}
            {c.status === 'submitted' && !isOwnerOrManager && <p className="text-xs text-ink-muted">Waiting for the owner or branch manager to decide.</p>}
          </li>
        ))}
      </ul>

      <Modal isOpen={action?.kind === 'file'} onClose={close} title="File a claim for the customer">
        {action?.kind === 'file' && <ClaimForm forShop uploadPhoto={uploadPhoto} onSubmit={fileClaim} onCancel={close} />}
      </Modal>
      <Modal isOpen={action?.kind === 'accept'} onClose={close} title={action?.kind === 'accept' && action.claim.type === 'refund' ? 'Accept refund' : 'Accept repair'}>
        {action?.kind === 'accept' && <AcceptForm storeId={store.id} claim={action.claim} branchId={branchId} onCancel={close} onDone={done} />}
      </Modal>
      <Modal isOpen={action?.kind === 'offer'} onClose={close} title="Offer a free repair instead">
        {action?.kind === 'offer' && <AcceptForm offer storeId={store.id} claim={action.claim} branchId={branchId} onCancel={close} onDone={done} />}
      </Modal>
      <Modal isOpen={action?.kind === 'decline'} onClose={close} title="Decline claim">
        {action?.kind === 'decline' && <DeclineForm storeId={store.id} claim={action.claim} onCancel={close} onDone={done} />}
      </Modal>
      <Modal isOpen={action?.kind === 'refund'} onClose={close} title="Record refund">
        {action?.kind === 'refund' && <RefundForm storeId={store.id} claim={action.claim} paid={data.paid_amount} uploadPhoto={uploadPhoto} onCancel={close} onDone={done} />}
      </Modal>
      </div>
    </div>
  );
}

type FormProps = { storeId: number; claim: OrderClaim; onCancel: () => void; onDone: () => void };

function Actions({ busy, label, onCancel, danger = false, disabled = false }: Readonly<{ busy: boolean; label: string; onCancel: () => void; danger?: boolean; disabled?: boolean }>) {
  return (
    <div className="flex justify-end gap-3 pt-1">
      <button type="button" onClick={onCancel} className="min-h-11 px-4 rounded-lg text-sm font-medium text-ink-body hover:bg-sunken">Cancel</button>
      <button type="submit" disabled={busy || disabled} className={`min-h-11 px-4 rounded-lg text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50 ${danger ? 'bg-danger hover:bg-danger/90' : 'bg-ink hover:bg-ink/90'}`}>
        {busy && <Loader2 size={14} className="animate-spin" />}
        {label}
      </button>
    </div>
  );
}

function usePost(onDone: () => void) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const post = async (url: string, body: Record<string, unknown>, fallback: string) => {
    setBusy(true);
    try {
      const res = await api.post(url, body);
      toast.success(res.data?.message ?? 'Saved.');
      onDone();
    } catch (err) {
      toast.error(getErrorMessage(err, fallback));
    } finally {
      setBusy(false);
    }
  };
  return { busy, post };
}

// Repair: same as approving an order — due date required, staff optional. Refund: just confirm.
// `offer`: the same repair details, offered on a refund claim for the customer to accept.
function AcceptForm({ storeId, claim, branchId, onCancel, onDone, offer = false }: Readonly<FormProps & { branchId?: number | null; offer?: boolean }>) {
  const { busy, post } = usePost(onDone);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [dueDate, setDueDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 3); return getLocalDateString(d); });
  const [staffId, setStaffId] = useState('');
  const [note, setNote] = useState('');
  const isRepair = offer || claim.type === 'repair';
  const today = getLocalDateString(new Date());

  useEffect(() => {
    if (!isRepair) return;
    api.get(`/stores/${storeId}/staff`).then((r) => {
      const list: Staff[] = Array.isArray(r.data?.data) ? r.data.data : [];
      setStaff(list.filter((s) => s.is_active !== false));
    }).catch(() => {});
  }, [storeId, isRepair]);

  const submit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const details = { due_date: dueDate, assigned_staff_id: staffId ? Number(staffId) : null };
    if (offer) {
      void post(`/stores/${storeId}/claims/${claim.id}/offer-repair`, { ...details, note: note.trim() || null }, 'Could not offer the repair.');
      return;
    }
    void post(`/stores/${storeId}/claims/${claim.id}/accept`, isRepair ? details : {}, 'Could not accept the claim.');
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {isRepair ? (
        <>
          <p className="text-sm text-ink-body">
            {offer
              ? 'The customer chooses: take this free repair, or keep asking for the refund. Nothing starts until they accept.'
              : 'A free (₱0) repair order is added to production for this customer.'}
          </p>
          <div>
            <label htmlFor="claim-due" className="block text-sm font-medium text-ink-body mb-1.5">Repair due date <span className="text-danger">*</span></label>
            <input id="claim-due" type="date" required min={today} value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={field} />
          </div>
          <div>
            <label htmlFor="claim-staff" className="block text-sm font-medium text-ink-body mb-1.5">Assign staff <span className="text-ink-faint font-normal">(optional)</span></label>
            <select id="claim-staff" value={staffId} onChange={(e) => setStaffId(e.target.value)} className={field}>
              <option value="">Unassigned</option>
              {staffForBranch(staff, branchId).map((s) => {
                const uid = s.user_id ?? s.user?.id;
                return uid ? <option key={uid} value={uid}>{staffOptionLabel(s)}</option> : null;
              })}
            </select>
          </div>
          {offer && (
            <div>
              <label htmlFor="claim-offer-note" className="block text-sm font-medium text-ink-body mb-1.5">Message to the customer <span className="text-ink-faint font-normal">(optional)</span></label>
              <textarea id="claim-offer-note" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. We'll re-sew the sleeve properly — it'll be ready in 3 days."
                className={`${field} resize-none`} />
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-ink-body">The customer will be asked to return the garment. Record the refund once it&apos;s back in the shop.</p>
      )}
      <Actions busy={busy} label={offer ? 'Send repair offer' : isRepair ? 'Accept & create repair order' : 'Accept refund'} onCancel={onCancel} />
    </form>
  );
}

// For a walk-in without an account: record what the customer chose at the counter.
function CounterAnswer({ storeId, claim, onDone }: Readonly<{ storeId: number; claim: OrderClaim; onDone: () => void }>) {
  const { busy, post } = usePost(onDone);
  const answer = (choice: 'repair' | 'refund') => void post(`/stores/${storeId}/claims/${claim.id}/respond`, { choice }, 'Could not save the answer.');

  return (
    <div className="border-t border-line pt-2">
      <p className="text-[11px] font-semibold text-ink-muted mb-1.5">Customer answered at the counter?</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={busy} onClick={() => answer('repair')} className="min-h-11 rounded-lg border border-line-strong text-xs font-semibold text-ink hover:bg-sunken disabled:opacity-50">Took the repair</button>
        <button type="button" disabled={busy} onClick={() => answer('refund')} className="min-h-11 rounded-lg border border-line-strong text-xs font-semibold text-ink hover:bg-sunken disabled:opacity-50">Kept the refund</button>
      </div>
    </div>
  );
}

function DeclineForm({ storeId, claim, onCancel, onDone }: Readonly<FormProps>) {
  const { busy, post } = usePost(onDone);
  const [reason, setReason] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); void post(`/stores/${storeId}/claims/${claim.id}/decline`, { reason: reason.trim() }, 'Could not decline the claim.'); }} className="space-y-4">
      <p className="text-sm text-ink-body">The customer sees this reason and can ask SUTURA support to review it.</p>
      <div>
        <label htmlFor="claim-decline" className="block text-sm font-medium text-ink-body mb-1.5">Reason</label>
        <textarea id="claim-decline" rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. The tear was caused after pickup, not by the stitching."
          className={`${field} resize-none`} />
      </div>
      <Actions busy={busy} label="Decline claim" danger disabled={reason.trim().length < 5} onCancel={onCancel} />
    </form>
  );
}

// The garment must be back before refunding; the amount depends (up to what was paid).
function RefundForm({ storeId, claim, paid, uploadPhoto, onCancel, onDone }: Readonly<FormProps & { paid: number; uploadPhoto: (f: File) => Promise<string | null> }>) {
  const { busy, post } = usePost(onDone);
  const [returned, setReturned] = useState(false);
  const [amount, setAmount] = useState(String(paid));
  const [method, setMethod] = useState<'cash' | 'gcash'>('cash');
  const [reference, setReference] = useState('');
  const [proof, setProof] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const value = Number(amount);
  const amountOk = value >= 1 && value <= paid;

  const submit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    void post(`/stores/${storeId}/claims/${claim.id}/refund`, {
      garment_returned: returned, amount: value, method, reference: reference.trim() || null, proof_path: proof,
    }, 'Could not record the refund.');
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="flex items-start gap-3 p-3 border border-line rounded-lg cursor-pointer">
        <input type="checkbox" checked={returned} onChange={(e) => setReturned(e.target.checked)} className="mt-0.5 w-4 h-4 accent-ink" />
        <span className="text-sm text-ink">The customer returned the garment to the shop.</span>
      </label>
      <div>
        <label htmlFor="refund-amount" className="block text-sm font-medium text-ink-body mb-1.5">Refund amount</label>
        <input id="refund-amount" type="number" inputMode="decimal" min={1} max={paid} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={field} />
        <p className={`text-xs mt-1 ${amount && !amountOk ? 'text-danger' : 'text-ink-muted'}`}>Up to {peso(paid)} (what the customer paid). Full or partial — it&apos;s your call.</p>
      </div>
      <fieldset>
        <legend className="block text-sm font-medium text-ink-body mb-1.5">Paid back via</legend>
        <div className="grid grid-cols-2 gap-2">
          {(['cash', 'gcash'] as const).map((m) => (
            <label key={m} className={`min-h-11 flex items-center justify-center rounded-lg border text-sm font-semibold cursor-pointer ${method === m ? 'border-ink bg-sunken text-ink' : 'border-line-strong text-ink-body hover:bg-sunken'}`}>
              <input type="radio" name="refund-method" value={m} checked={method === m} onChange={() => setMethod(m)} className="sr-only" />
              {m === 'cash' ? 'Cash' : 'GCash'}
            </label>
          ))}
        </div>
      </fieldset>
      {method === 'gcash' && (
        <div>
          <label htmlFor="refund-ref" className="block text-sm font-medium text-ink-body mb-1.5">GCash reference <span className="text-ink-faint font-normal">(optional)</span></label>
          <input id="refund-ref" type="text" maxLength={255} value={reference} onChange={(e) => setReference(e.target.value)} className={field} />
        </div>
      )}
      <div>
        <p className="block text-sm font-medium text-ink-body mb-1.5">Proof <span className="text-ink-faint font-normal">(optional)</span></p>
        {proof ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getMediaUrl(proof)} alt="Refund proof" className="w-16 h-16 object-cover border border-line rounded-md" />
            <button type="button" onClick={() => setProof(null)} className="text-sm text-ink-muted hover:text-ink min-h-11">Remove</button>
          </div>
        ) : (
          <label className={`min-h-11 inline-flex items-center gap-2 px-4 border border-dashed border-line-strong rounded-lg text-sm text-ink-muted cursor-pointer hover:bg-sunken ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} {uploading ? 'Uploading…' : 'Attach screenshot or photo'}
            <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
              const f = e.target.files?.[0]; e.target.value = '';
              if (!f) return;
              setUploading(true); setProof(await uploadPhoto(f)); setUploading(false);
            }} />
          </label>
        )}
      </div>
      <Actions busy={busy} label="Record refund" disabled={!returned || !amountOk || uploading} onCancel={onCancel} />
    </form>
  );
}
