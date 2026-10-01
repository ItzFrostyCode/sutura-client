'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';
import { REJECTION_REASONS } from './appointmentHelpers';

interface RejectAppointmentDialogProps {
  readonly isOpen: boolean;
  readonly busy: boolean;
  readonly onClose: () => void;
  /** Resolves true when the server accepted the rejection. */
  readonly onConfirm: (reasonCode: string, note: string) => Promise<boolean>;
}

// Declining a request always needs a reason — the customer is told, and it is kept in the audit log.
export default function RejectAppointmentDialog({ isOpen, busy, onClose, onConfirm }: Readonly<RejectAppointmentDialogProps>) {
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');

  const close = () => { setCode(''); setNote(''); onClose(); };
  const submit = async () => {
    if (!code) return;
    if (await onConfirm(code, note.trim())) close();
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Reject appointment request">
      <div className="space-y-4">
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-wider text-ink mb-2">Reason <span className="text-red-600">*</span></legend>
          <div className="space-y-2">
            {REJECTION_REASONS.map(r => (
              <label key={r.code} className={`flex items-center gap-3 min-h-11 px-3 border cursor-pointer ${code === r.code ? 'border-ink bg-white' : 'border-line hover:bg-sunken'}`}>
                <input type="radio" name="reject-reason" value={r.code} checked={code === r.code} onChange={() => setCode(r.code)} className="w-4 h-4 accent-[#6B5346]" />
                <span className="text-sm text-ink">{r.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="reject-note" className="text-xs font-bold uppercase tracking-wider text-ink mb-2 block">Note to the customer <span className="font-normal normal-case text-ink-faint">(optional)</span></label>
          <textarea id="reject-note" rows={3} value={note} onChange={e => setNote(e.target.value.slice(0, 1000))} placeholder="e.g. We're closed that day — please pick another date." className="w-full px-3.5 py-3 bg-surface border border-line text-ink text-base focus:outline-none focus:border-taupe" />
        </div>
        <p className="text-xs text-ink-muted">The customer is notified with this reason.</p>
        <div className="flex justify-end gap-3 pt-2 border-t border-line">
          <button type="button" onClick={close} disabled={busy} className="h-11 px-5 border border-line-strong bg-white text-sm font-medium text-ink hover:bg-sunken cursor-pointer disabled:opacity-50">Cancel</button>
          <button type="button" onClick={submit} disabled={!code || busy} className="h-11 px-5 bg-rose-700 hover:bg-rose-800 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50">
            {busy && <Loader2 size={16} className="animate-spin" />} Confirm rejection
          </button>
        </div>
      </div>
    </Modal>
  );
}
