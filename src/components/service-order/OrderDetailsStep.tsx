'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import type { ServiceOrderState } from './useServiceOrder';
import { Card, ChoiceCard, INPUT, SectionLabel, StepIntro } from './orderUi';
import { PHONE_DIGITS, formatPhone, isPhoneValid } from './orderPoints';

/** What the number field says under it while typing: how many digits are left, or what is wrong. */
function phoneStatus(digits: string): { text: string; ok: boolean; bad: boolean } {
  if (!digits) return { text: '11 digits, starting with 09', ok: false, bad: false };
  if (!digits.startsWith('0')) return { text: 'Start with 0, like 0917…', ok: false, bad: true };
  if (digits.length >= 2 && !digits.startsWith('09')) return { text: 'Mobile numbers start with 09', ok: false, bad: true };
  if (isPhoneValid(digits)) return { text: 'Complete', ok: true, bad: false };
  return { text: `${digits.length} of ${PHONE_DIGITS} digits`, ok: false, bad: false };
}

/** Step 1 — who the order is for (the signed-in account) and how the shop reaches you. */
export default function OrderDetailsStep({ o }: Readonly<{ o: ServiceOrderState }>) {
  const { f } = o;
  const status = phoneStatus(f.phone);
  const branches = o.store?.branches ?? [];

  return (
    <div className="space-y-8">
      <StepIntro title="Your details" text="Who the order is for and how the shop reaches you." />

      <Card className="divide-y divide-line !p-0">
        <div className="px-4 py-3">
          <p className="mobile-caption text-ink-muted">Name</p>
          <p className="truncate text-base text-ink">{o.user?.name}</p>
        </div>
        <div className="px-4 py-3">
          <p className="mobile-caption text-ink-muted">Email</p>
          <p className="truncate text-base text-ink">{o.user?.email}</p>
        </div>
        <p className="mobile-caption px-4 py-3 text-ink-muted">
          From your account. <Link href="/account/settings" className="font-semibold text-ink underline-offset-4 hover:underline">Edit in Settings</Link>
        </p>
      </Card>

      <div>
        <SectionLabel htmlFor="order-phone" hint="For fitting schedules and pickup reminders by text.">Mobile number</SectionLabel>
        <div className="relative">
          <input
            id="order-phone" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={13}
            value={formatPhone(f.phone)} onChange={(e) => f.setPhone(e.target.value)} placeholder="0917 123 4567"
            aria-invalid={status.bad} aria-describedby="order-phone-status"
            className={`${INPUT} pr-12 tabular-nums ${status.bad ? 'border-rose-400' : ''}`}
          />
          {status.ok && <Check size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600" aria-hidden />}
        </div>
        <p id="order-phone-status" className={`mobile-caption mt-1.5 ${status.bad ? 'text-rose-700' : status.ok ? 'text-emerald-700' : 'text-ink-muted'}`}>
          {status.text}
        </p>
      </div>

      {branches.length > 1 && (
        <fieldset>
          <SectionLabel as="legend" hint="Where you go for fittings and pickup.">Branch</SectionLabel>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Branch">
            {branches.map((b) => (
              <ChoiceCard key={b.id} selected={f.branchId === b.id} onSelect={() => f.setBranchId(b.id)}
                label={b.name} detail={[b.address, b.city].filter(Boolean).join(', ')} />
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
