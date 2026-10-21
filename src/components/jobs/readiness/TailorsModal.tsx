import React, { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import type { Assignee, Capacity } from './readinessTypes';

interface TailorsModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly storeId: number;
  readonly current: Assignee[];
  readonly capacity?: Capacity;
  readonly busy: boolean;
  readonly onSave: (assignees: { user_id: number; role: string }[], reason?: string) => Promise<boolean>;
  /** True once work has started: taking someone off then needs a reason. */
  readonly started?: boolean;
}

interface Person { id: number; name: string; active: number | null }

const ROLES = [{ v: 'lead', t: 'Lead' }, { v: 'tailor', t: 'Tailor' }, { v: 'assistant', t: 'Assistant' }];

/** Pick who is planned for this order and in what role. The owner can plan themselves ("owner only" shops). */
export default function TailorsModal({ isOpen, onClose, storeId, current, capacity, busy, onSave, started = false }: TailorsModalProps) {
  const me = useAuthStore((s) => s.user);
  const isOwner = Boolean(me?.roles?.some((r) => r.name === 'store_owner'));
  const [people, setPeople] = useState<Person[]>([]);
  const [reason, setReason] = useState('');
  const [picked, setPicked] = useState<Record<number, string>>(() => Object.fromEntries(current.map((a) => [a.user_id, a.role])));

  useEffect(() => {
    api.get(`/stores/${storeId}/staff`).then((res) => {
      const rows = Array.isArray(res.data?.data) ? res.data.data : [];
      const staff: Person[] = rows
        .filter((r: { is_active?: boolean }) => r.is_active !== false)
        .map((r: { user: { id: number; name: string }; active_jobs?: number }) => ({ id: r.user.id, name: r.user.name, active: r.active_jobs ?? null }));
      setPeople(isOwner && me ? [{ id: me.id, name: `${me.name} (owner)`, active: null }, ...staff.filter((p) => p.id !== me.id)] : staff);
    }).catch(() => setPeople([]));
  }, [storeId, isOwner, me]);

  const toggle = (id: number) => setPicked((p) => { const n = { ...p }; if (id in n) delete n[id]; else n[id] = 'tailor'; return n; });
  const removing = current.some((a) => !(a.user_id in picked));
  const needsReason = started && removing;
  const open = (id: number) => capacity?.tailors.find((t) => t.user_id === id)?.open_orders;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Plan tailors"
      maxWidth="max-w-lg"
      footer={(
        <div className="flex w-full justify-end gap-2">
          <button type="button" onClick={onClose} className="h-11 rounded-lg px-4 text-sm font-medium text-ink-body hover:text-ink">Cancel</button>
          <button type="button" disabled={busy || (needsReason && !reason.trim())} onClick={async () => { if (await onSave(Object.entries(picked).map(([id, role]) => ({ user_id: Number(id), role })), reason.trim() || undefined)) onClose(); }} className="h-11 rounded-lg bg-espresso px-4 text-sm font-semibold text-white hover:bg-espresso/90 disabled:opacity-50">Save</button>
        </div>
      )}
    >
      <p className="mb-3 text-xs text-ink-muted">Changes are kept in the order's history. The record of who actually worked each stage still follows whoever moves the order.</p>
      <ul className="space-y-1.5">
        {people.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
            <input id={`tailor-${p.id}`} type="checkbox" checked={p.id in picked} onChange={() => toggle(p.id)} className="h-4 w-4 accent-taupe" />
            <label htmlFor={`tailor-${p.id}`} className="min-w-0 flex-1 cursor-pointer">
              <span className="block truncate text-sm font-semibold text-ink">{p.name}</span>
              <span className="text-[11px] text-ink-muted">{p.active ?? '–'} active job{p.active === 1 ? '' : 's'}{open(p.id) !== undefined ? ` · ${open(p.id)} other open orders` : ''}</span>
            </label>
            {p.id in picked && (
              <select aria-label={`Role for ${p.name}`} value={picked[p.id]} onChange={(e) => setPicked((s) => ({ ...s, [p.id]: e.target.value }))} className="rounded-lg border border-line bg-canvas px-2 py-1.5 text-base sm:text-xs">
                {ROLES.map((r) => <option key={r.v} value={r.v}>{r.t}</option>)}
              </select>
            )}
          </li>
        ))}
        {people.length === 0 && <li className="py-4 text-center text-xs text-ink-muted">No staff found for this shop.</li>}
      </ul>
      {removing && (
        <label className="mt-3 block text-xs font-semibold text-ink">
          Why is the tailor being changed?{needsReason ? '' : ' (optional)'}
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} placeholder="Example: sick leave" className="mt-1 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-base font-normal text-ink focus:border-taupe focus:outline-none sm:text-sm" />
        </label>
      )}
    </Modal>
  );
}
