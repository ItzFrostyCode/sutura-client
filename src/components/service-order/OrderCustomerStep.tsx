'use client';

import Link from 'next/link';
import type { ServiceOrderState } from './useServiceOrder';
import { ChoiceCard, FIELD, SectionLabel, StepIntro } from './orderUi';
import { formatAddress } from '@/lib/formatAddress';

// Step 1 — Customer Information. The walk-in form searches or creates the
// customer; online, the customer is the signed-in account, so this confirms
// who the order is for and how the shop reaches them.
export default function OrderCustomerStep({ o }: Readonly<{ o: ServiceOrderState }>) {
  return (
    <div className="space-y-7">
      <StepIntro title="Customer Information" text="Who the order is for and how the shop can reach you." />

      <div className="bg-surface border border-line rounded-lg divide-y divide-line">
        <div className="px-4 py-3">
          <p className="mobile-caption text-ink-muted">Name</p>
          <p className="text-base font-medium text-ink">{o.user?.name}</p>
        </div>
        <div className="px-4 py-3">
          <p className="mobile-caption text-ink-muted">Email</p>
          <p className="text-base font-medium text-ink break-all">{o.user?.email}</p>
        </div>
        <p className="px-4 py-2.5 mobile-caption text-ink-muted">
          From your account.{' '}
          <Link href="/account/settings" className="text-taupe font-semibold underline-offset-4 hover:underline">
            Change in settings
          </Link>
        </p>
      </div>

      <div className="space-y-2.5">
        <SectionLabel htmlFor="order-phone">Contact number</SectionLabel>
        <p className="mobile-caption text-ink-muted -mt-1">For fitting schedules and pickup reminders.</p>
        <input
          id="order-phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={o.contactPhone}
          onChange={(e) => o.setContactPhone(e.target.value)}
          placeholder="09XXXXXXXXX"
          aria-invalid={o.contactPhone !== '' && !o.phoneValid}
          aria-describedby="order-phone-help"
          className={`${FIELD}${o.contactPhone !== '' && !o.phoneValid ? ' border-danger! focus:border-danger!' : ''}`}
        />
        <p id="order-phone-help" className={`mobile-caption ${o.contactPhone !== '' && !o.phoneValid ? 'text-danger font-semibold' : 'text-ink-muted'}`}>
          {o.contactPhone === ''
            ? '11 digits, starting with 09.'
            : o.phoneValid
              ? '11 / 11 digits'
              : !o.contactPhone.startsWith('09')
                ? 'The number should start with 09.'
                : `${o.contactPhone.length} / 11 digits. ${11 - o.contactPhone.length} more to go.`}
        </p>
      </div>

      {o.branches.length > 1 && (
        <fieldset className="space-y-2.5">
          <SectionLabel as="legend">Branch</SectionLabel>
          <p className="mobile-caption text-ink-muted -mt-1">Where you'll go for fittings and pickup.</p>
          <div className="grid grid-cols-1 gap-2.5" role="radiogroup" aria-label="Branch">
            {o.branches.map((b) => (
              <ChoiceCard
                key={b.id}
                selected={o.branchId === b.id}
                onSelect={() => o.setBranchId(b.id)}
                label={b.name}
                detail={formatAddress({ address: b.address, city: b.city })}
              />
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
