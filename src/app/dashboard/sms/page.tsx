'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FlaskConical, Loader2, Lock, Settings2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import SmsMessageCard from '@/components/sms/SmsMessageCard';
import SmsSettingsPanel from '@/components/sms/SmsSettingsPanel';
import { useSmsOutbox } from '@/components/sms/useSmsOutbox';
import type { SmsTab } from '@/components/sms/smsHelpers';

const TABS: { id: SmsTab; label: string }[] = [{ id: 'draft', label: 'To check' }, { id: 'sent', label: 'Sent' }, { id: 'problems', label: 'Needs fixing' }];

export default function SmsOutboxPage() {
  const s = useSmsOutbox();
  const { user } = useAuthStore();
  const isOwner = Boolean(user?.roles?.some((r) => r.name === 'store_owner'));
  const [showSettings, setShowSettings] = useState(false);
  const d = s.data;

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="mobile-h1 min-[600px]:tablet-h1 text-ink">Text messages</h1>
          <p className="text-sm text-ink-muted mt-1">Check the number and the words before a customer is texted.</p>
        </div>
        <button type="button" onClick={() => setShowSettings((v) => !v)} aria-expanded={showSettings} className="h-11 px-3 border border-line-strong bg-white hover:bg-sunken text-sm font-semibold flex items-center gap-2 cursor-pointer shrink-0"><Settings2 size={16} /> Settings</button>
      </div>

      {d?.test_mode && (
        <div className="flex items-start gap-3 border border-sky-200 bg-sky-50 p-3">
          <FlaskConical size={18} className="text-sky-700 shrink-0 mt-0.5" />
          <p className="text-sm text-sky-900"><strong>Test mode.</strong> Nothing is delivered to anyone&apos;s phone — approved texts are only recorded as &ldquo;sent (test)&rdquo;. The numbers in the demo data are made up.</p>
        </div>
      )}
      {d && !d.plan_allows && (
        <div className="flex items-start gap-3 border border-amber-200 bg-amber-50 p-4">
          <Lock size={18} className="text-amber-700 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">Text messages are part of the <strong>Pro</strong> plan. <Link href="/dashboard/billing" className="font-semibold underline">See plans</Link></p>
        </div>
      )}

      {d && showSettings && <SmsSettingsPanel data={d} isOwner={isOwner} busy={s.busyId === 'all'} onMode={s.setMode} onEvents={s.setEvents} />}

      <div className="flex items-center gap-2 border-b border-line overflow-x-auto hide-scrollbar">
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => s.setTab(t.id)} className={`min-h-11 px-3 text-sm font-semibold border-b-2 -mb-px shrink-0 cursor-pointer ${s.tab === t.id ? 'border-taupe text-ink' : 'border-transparent text-ink-muted hover:text-ink'}`}>
            {t.label}{d ? ` (${d.counts[t.id]})` : ''}
          </button>
        ))}
        {s.tab === 'draft' && d && d.counts.draft > 0 && (
          <button type="button" disabled={s.busyId !== null} onClick={s.approveAll} className="ml-auto h-11 px-3 text-sm font-semibold text-taupe hover:underline cursor-pointer shrink-0 disabled:opacity-50">Send all that look valid</button>
        )}
      </div>

      <div className="border border-line bg-surface">
        {s.loading ? (
          <p className="p-8 text-center text-sm text-ink-muted flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading…</p>
        ) : d && d.messages.length > 0 ? (
          <ul className="divide-y divide-line">
            {d.messages.map((m) => (
              <SmsMessageCard key={`${m.id}-${m.body}-${m.to_number}-${m.status}`} message={m} busy={s.busyId === m.id} onSave={(patch) => s.save(m, patch)} onApprove={() => s.approve(m)} onCancel={() => s.cancel(m)} />
            ))}
          </ul>
        ) : (
          <p className="p-8 text-center text-sm text-ink-muted">{s.tab === 'draft' ? 'Nothing waiting. Texts appear here when a customer needs a reminder or an update.' : s.tab === 'sent' ? 'No texts sent yet.' : 'No problems. 🎉'}</p>
        )}
      </div>
    </div>
  );
}
