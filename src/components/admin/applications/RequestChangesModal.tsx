'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import type { ChangeItem } from './useApplicationDetail';

interface RequestChangesModalProps {
  readonly isOpen: boolean;
  readonly storeName: string;
  readonly items: ChangeItem[];
  readonly onClose: () => void;
  /** Resolve to close; throw to keep the dialog open. */
  readonly onConfirm: (items: string[], note: string) => Promise<void>;
}

const NOTE_MAX = 1000;

// "Request Changes": tick what the owner must redo and say why. The owner
// gets an email with a private link that opens only these items.
export default function RequestChangesModal({ isOpen, storeName, items, onClose, onConfirm }: RequestChangesModalProps) {
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => { setPicked([]); setNote(''); };
  const close = () => { reset(); onClose(); };
  const toggle = (key: string) => setPicked((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const send = async () => {
    setBusy(true);
    try {
      await onConfirm(picked, note.trim());
      reset();
    } catch {
      /* caller already showed the error; keep the dialog open */
    } finally {
      setBusy(false);
    }
  };

  const ready = picked.length > 0 && note.trim().length >= 5;

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      maxWidth="md:max-w-2xl"
      title={`Request Changes for ${storeName}`}
      footer={(
        <div className="flex justify-end gap-3">
          <button type="button" onClick={close} className="min-h-11 border border-line-strong px-4 text-sm text-ink">Cancel</button>
          <button type="button" disabled={!ready || busy} onClick={send} className="min-h-11 bg-ink px-4 text-sm font-semibold text-white disabled:opacity-40">
            {busy ? 'Sending…' : 'Send Request'}
          </button>
        </div>
      )}
    >
      <p className="text-sm text-ink-muted">
        The owner gets an email with a private link that opens only the items you tick. The shop stays hidden until you approve it.
      </p>

      <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,15rem)_1fr]">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink">Items to correct or update</legend>
          <div className="space-y-0.5">
            {items.map((item) => (
              <label key={item.key} className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-ink">
                <input type="checkbox" checked={picked.includes(item.key)} onChange={() => toggle(item.key)} className="h-4 w-4 shrink-0 accent-ink" />
                {item.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col">
          <label htmlFor="change-note" className="mb-2 text-sm font-semibold text-ink">
            Feedback / required corrections<span className="text-danger">*</span>
          </label>
          <textarea
            id="change-note"
            rows={9}
            maxLength={NOTE_MAX}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Your DTI certificate is blurry and can't be read. Please upload a clearer copy, and a shop front photo that shows your signage."
            className="w-full flex-1 border border-line-strong bg-surface p-3 text-base text-ink focus:border-ink focus:outline-none"
          />
          <p className="mt-1 text-right text-xs text-ink-faint">{note.length}/{NOTE_MAX}</p>
        </div>
      </div>
    </Modal>
  );
}
