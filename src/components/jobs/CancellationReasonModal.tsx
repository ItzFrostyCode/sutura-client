import React, { useState } from 'react';
import { AlertTriangle, Ban } from 'lucide-react';
import Modal from '@/components/Modal';

interface CancellationReasonModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (reason: string) => void;
  readonly collectedAmount: number;
}

const REASONS: { value: string; title: string; description: string; flagged?: boolean }[] = [
  {
    value: 'customer_request',
    title: 'Customer requested cancellation',
    description: 'No production started, or customer changed their mind early — refund/waive at your discretion, outside the system.',
  },
  {
    value: 'shop_unable_to_fulfill',
    title: 'Shop unable to fulfill',
    description: 'Material shortage, scheduling conflict, or similar shop-side reason.',
  },
  {
    value: 'forfeited_deposit_abandoned',
    title: 'Forfeited deposit — customer went uncontactable',
    description: 'Fabric was already cut, customer never returned. Per shop policy, the deposit already collected is kept, not refunded. This shows up separately in cross-branch loss reporting.',
    flagged: true,
  },
  {
    value: 'other',
    title: 'Other',
    description: "Free-text reason for anything that doesn't fit above.",
  },
];

export default function CancellationReasonModal({ isOpen, onClose, onConfirm, collectedAmount }: CancellationReasonModalProps) {
  const [selected, setSelected] = useState('customer_request');
  const [otherText, setOtherText] = useState('');

  const handleConfirm = () => {
    onConfirm(selected);
    setSelected('customer_request');
    setOtherText('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={(
        <span className="inline-flex items-center gap-2">
          <Ban size={18} className="text-red-600" /> Cancel Job Order
        </span>
      )}
    >
      <div className="space-y-3">
        {collectedAmount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <p>
              This job has ₱{collectedAmount.toFixed(2)} already collected. Choosing a reason below does not
              refund or reverse this automatically — pick the one that matches what actually happened.
            </p>
          </div>
        )}

        {REASONS.map(reason => (
          <button
            key={reason.value}
            type="button"
            onClick={() => setSelected(reason.value)}
            className={`w-full text-left flex items-start gap-2.5 p-3 rounded-xl border transition-colors ${
              selected === reason.value
                ? (reason.flagged ? 'border-danger bg-danger/5' : 'border-taupe bg-canvas')
                : 'border-line hover:border-line-strong'
            }`}
          >
            <input type="radio" checked={selected === reason.value} readOnly className="mt-0.5 accent-taupe" />
            <div>
              <p className={`text-xs font-semibold ${reason.flagged ? 'text-danger' : 'text-ink'}`}>{reason.title}</p>
              <p className="text-[10.5px] text-ink-faint mt-0.5">{reason.description}</p>
              {reason.value === 'other' && selected === 'other' && (
                <input
                  type="text"
                  value={otherText}
                  onChange={e => setOtherText(e.target.value)}
                  placeholder="Explain what happened…"
                  className="w-full mt-1.5 px-2.5 py-1.5 border border-line-strong rounded-lg text-xs"
                  onClick={e => e.stopPropagation()}
                />
              )}
            </div>
          </button>
        ))}

        <div className="pt-2 border-t border-line flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-ink-body hover:text-ink">
            Never mind, keep it active
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white"
          >
            Confirm Cancellation
          </button>
        </div>
      </div>
    </Modal>
  );
}
