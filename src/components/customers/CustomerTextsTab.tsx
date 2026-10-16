'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Lock, MessageSquare } from 'lucide-react';
import { useCustomerTexts, type CustomerText } from './hooks/useCustomerTexts';

interface Props {
  readonly storeId?: number;
  readonly customerId?: number;
  readonly customerName?: string;
}

const MAX = 320;
const BADGE: Record<CustomerText['status'], string> = {
  draft: 'text-amber-700', approved: 'text-amber-700', sent: 'text-sage', failed: 'text-danger', blocked: 'text-danger', cancelled: 'text-ink-faint',
};
const LABEL: Record<CustomerText['status'], string> = {
  draft: 'Waiting to be sent', approved: 'Sending', sent: 'Sent', failed: 'Failed', blocked: 'Not sent', cancelled: 'Cancelled',
};

/** Texts to this customer: write one, send or cancel the ones waiting, and see what went out. Everything goes through the shop's outbox. */
export default function CustomerTextsTab({ storeId, customerId, customerName }: Props) {
  const t = useCustomerTexts(storeId, customerId, true);
  const [body, setBody] = useState('');
  const d = t.data;

  if (t.loading) return <p className="flex items-center justify-center gap-2 p-8 text-sm text-ink-muted"><Loader2 size={16} className="animate-spin" /> Loading…</p>;
  if (!d) return <p className="p-8 text-center text-sm text-ink-muted">Texts could not be loaded.</p>;

  const blocker = !d.plan_allows ? 'Text messages are part of the Pro plan.'
    : d.sms_mode === 'off' ? 'Text messages are switched off. Turn them on in Text messages → Settings.'
    : d.opted_out ? `${customerName ?? 'This customer'} opted out of text messages.`
    : !d.has_number ? 'There is no valid mobile number on file. Edit the profile and add one.'
    : null;

  const submit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (await t.write(body.trim())) setBody('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {blocker ? (
        <p className="flex items-start gap-2 border-y border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900"><Lock size={16} className="mt-0.5 shrink-0" />{blocker}</p>
      ) : (
        <form onSubmit={submit} className="space-y-2">
          <label htmlFor="customer-text" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">New text to {customerName ?? 'the customer'}</label>
          <textarea
            id="customer-text" rows={3} maxLength={MAX} value={body} onChange={(e) => setBody(e.target.value)}
            placeholder="e.g. Hi! Your barong is ready for fitting. Please come by this week."
            className="w-full resize-y border border-line bg-canvas px-3 py-2 text-base text-ink focus:border-taupe focus:outline-none sm:text-sm"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-ink-muted">{body.length}/{MAX} · {d.sms_mode === 'auto' ? 'sent right away' : 'you check it before it is sent'}</span>
            <button type="submit" disabled={body.trim().length < 5 || t.busy === 'new'} className="flex h-11 items-center gap-2 bg-taupe px-5 text-sm font-bold text-white hover:bg-taupe-hover disabled:opacity-50">
              {t.busy === 'new' && <Loader2 size={14} className="animate-spin" />}
              {d.sms_mode === 'auto' ? 'Send text' : 'Prepare text'}
            </button>
          </div>
        </form>
      )}

      <section aria-label="Texts">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-bold text-ink">Texts for this customer</h2>
          <Link href="/dashboard/sms" className="text-xs font-semibold text-taupe hover:underline">Open all texts</Link>
        </div>
        {d.messages.length === 0 ? (
          <p className="flex items-center gap-2 py-4 text-sm text-ink-muted"><MessageSquare size={15} /> No texts yet. Appointment and order reminders appear here too.</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {d.messages.map((m) => (
              <li key={m.id} className="space-y-1 py-3">
                <div className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="font-semibold text-ink">{m.event_label}{m.is_test ? ' · test' : ''}</span>
                  <span className={`shrink-0 font-semibold ${BADGE[m.status]}`}>{LABEL[m.status]}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-ink-body">{m.body}</p>
                <p className="text-xs text-ink-muted">{new Date(m.sent_at ?? m.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}{m.to_number ? ` · ${m.to_number}` : ''}{m.blocked_reason ? ` · ${m.blocked_reason}` : ''}{m.error ? ` · ${m.error}` : ''}</p>
                {(m.status === 'draft' || m.status === 'failed') && (
                  <div className="flex gap-3 pt-1">
                    <button type="button" disabled={t.busy === m.id} onClick={() => t.send(m.id)} className="min-h-10 text-sm font-bold text-taupe hover:underline disabled:opacity-50">Send now</button>
                    <button type="button" disabled={t.busy === m.id} onClick={() => t.cancel(m.id)} className="min-h-10 text-sm font-medium text-ink-muted hover:text-danger disabled:opacity-50">Cancel</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
