'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AccountHeader from '@/components/account/AccountHeader';
import api from '@/lib/axios';

// The customer/platform-side "file a ticket" — the counterpart to the shop's
// /dashboard/support new-ticket form (SupportNewTicket), which posts to a
// store. This one posts to /my-tickets (SupportTicketController::storeMine,
// no store context): a message to the SUTURA admin team that lands in the
// same /admin/tickets queue. product_report rows are filed separately via
// "Report This Product" on a catalog item's detail page.
const TYPES = [
  { value: 'problem', label: "Something isn't working" },
  { value: 'billing', label: 'Billing / payment' },
  { value: 'general', label: 'General question' },
] as const;

type TicketType = (typeof TYPES)[number]['value'];

export default function NewSupportTicketPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<TicketType>('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = subject.trim() !== '' && message.trim() !== '' && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post('/my-tickets', { subject: subject.trim(), type, message: message.trim() });
      // Back to the list — the fresh row shows up at the top with its Open chip.
      router.push('/account/settings/support');
    } catch {
      setError('Could not send your ticket. Please try again.');
      setSubmitting(false);
    }
  };

  // House style of the account settings module (Notification Settings page):
  // overline labels, borderless sunken inputs, 48px fields / 52px actions.
  const fieldClasses = 'h-12 w-full rounded-xl bg-sunken px-4 text-base text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-line-strong';

  return (
    <div>
      <AccountHeader title="New Ticket" backHref="/account/settings/support" />

      <div className="card-soft space-y-5 p-4">
        <div>
          <label htmlFor="ticket-subject" className="mobile-overline mb-2 block text-ink-faint">Subject</label>
          <input
            id="ticket-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Short summary of the issue"
            maxLength={255}
            className={fieldClasses}
          />
        </div>

        <div>
          <label htmlFor="ticket-type" className="mobile-overline mb-2 block text-ink-faint">What&apos;s it about?</label>
          <select
            id="ticket-type"
            value={type}
            onChange={(e) => setType(e.target.value as TicketType)}
            className={fieldClasses}
          >
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="ticket-message" className="mobile-overline mb-2 block text-ink-faint">Message</label>
          <textarea
            id="ticket-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the issue — more detail gets it resolved faster"
            rows={5}
            className="w-full resize-none rounded-xl bg-sunken px-4 py-3 text-base text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-line-strong"
          />
        </div>
      </div>

      {error && <p className="mt-3 px-1 text-xs text-danger">{error}</p>}

      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
          className="flex h-[52px] w-full items-center justify-center rounded-full bg-ink text-base font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-60"
        >
          {submitting ? 'Sending…' : 'Send Ticket'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/account/settings/support')}
          className="flex h-[52px] w-full items-center justify-center rounded-full border border-line-strong bg-surface text-base font-semibold text-ink transition-opacity active:opacity-80"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
