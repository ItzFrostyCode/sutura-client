'use client';

import React from 'react';
import { MODES, type SmsMode, type SmsOutbox } from './smsHelpers';

interface Props { readonly data: SmsOutbox; readonly isOwner: boolean; readonly busy: boolean; readonly onMode: (m: SmsMode) => void; readonly onEvents: (keys: string[]) => void }

// How texts are handled, and which moments are worth a text at all. Owner only.
export default function SmsSettingsPanel({ data, isOwner, busy, onMode, onEvents }: Props) {
  const enabled = data.events.filter((e) => e.enabled).map((e) => e.key);
  const toggle = (key: string) => onEvents(enabled.includes(key) ? enabled.filter((k) => k !== key) : [...enabled, key]);
  return (
    <section className="border border-line bg-surface p-4 space-y-5" aria-label="Text message settings">
      <fieldset disabled={!isOwner || busy}>
        <legend className="text-xs font-bold uppercase tracking-wider text-ink mb-2">When a text is ready</legend>
        <div className="grid grid-cols-1 min-[700px]:grid-cols-3 gap-2">
          {MODES.map((m) => (
            <label key={m.id} className={`p-3 border cursor-pointer ${data.mode === m.id ? 'border-taupe bg-sunken' : 'border-line-strong bg-white hover:bg-sunken'}`}>
              <input type="radio" name="sms-mode" checked={data.mode === m.id} onChange={() => onMode(m.id)} className="sr-only" />
              <span className="block text-sm font-semibold text-ink">{m.label}</span>
              <span className="block text-xs text-ink-muted mt-1">{m.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset disabled={!isOwner || busy}>
        <legend className="text-xs font-bold uppercase tracking-wider text-ink mb-1">What is worth a text</legend>
        <p className="text-xs text-ink-muted mb-2">Customers already get an email and an app notice for everything. Text only what they can&apos;t afford to miss — fewer texts, lower load cost.</p>
        <div className="space-y-1">
          {data.events.map((e) => (
            <label key={e.key} className="flex items-center gap-3 min-h-11 cursor-pointer">
              <input type="checkbox" checked={e.enabled} onChange={() => toggle(e.key)} className="w-5 h-5 accent-[#6B5346]" />
              <span className="text-sm text-ink">{e.label}</span>
              {e.recommended && <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Recommended</span>}
            </label>
          ))}
        </div>
      </fieldset>
      {!isOwner && <p className="text-xs text-ink-muted">Only the shop owner can change these settings.</p>}
    </section>
  );
}
