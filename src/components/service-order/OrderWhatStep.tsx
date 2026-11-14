'use client';

import { Minus, Plus, User, Users } from 'lucide-react';
import type { ServiceOrderState } from './useServiceOrder';
import { ChoiceCard, SectionLabel, StepIntro, peso } from './orderUi';
import OrderPartPicker from './OrderPartPicker';

function WhoCard({ on, onClick, Icon, title, text }: Readonly<{ on: boolean; onClick: () => void; Icon: typeof User; title: string; text: string }>) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onClick}
      className={`flex min-w-0 items-start gap-3 rounded-xl border p-4 text-left transition-colors ${on ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-line-strong'} bg-surface`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${on ? 'bg-ink text-white' : 'bg-sunken text-ink-muted'}`}><Icon size={18} /></span>
      <span className="min-w-0">
        <span className="block text-base font-semibold text-ink">{title}</span>
        <span className="mobile-body-sm mt-0.5 block text-ink-muted">{text}</span>
      </span>
    </button>
  );
}

/** Step 2 — the option, what part of the outfit, and whether it is for one person or a group with a name per person. */
export default function OrderWhatStep({ o }: Readonly<{ o: ServiceOrderState }>) {
  const { f } = o;

  return (
    <div className="space-y-8">
      <StepIntro title="What you're ordering" text={o.service?.name ?? ''} />

      {o.pricing.length > 1 && (
        <fieldset>
          <SectionLabel as="legend">Option</SectionLabel>
          <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="Option">
            {o.pricing.map((p) => (
              <ChoiceCard key={p.id} selected={f.pricingId === p.id} onSelect={() => f.setPricingId(p.id)} label={p.label}
                trailing={o.quoted || p.amount === null || p.amount === '' ? 'Quoted' : `${peso(Number(p.amount))}${p.sold_as === 'set' ? ' / set' : ' / pc'}`} />
            ))}
          </div>
        </fieldset>
      )}

      {o.sizesNeeded && <OrderPartPicker o={o} />}

      {o.groupOnly ? (
        <div className="flex items-start gap-3 rounded-xl bg-sunken p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-white"><Users size={18} /></span>
          <div className="min-w-0">
            <p className="text-base font-semibold text-ink">Group order</p>
            <p className="mobile-body-sm text-ink-muted">This service is made for teams: {o.groupMin} people or more, a name and size each. You list them next.</p>
          </div>
        </div>
      ) : (
      <fieldset>
        <SectionLabel as="legend">Who is it for?</SectionLabel>
        <div className={`grid grid-cols-1 gap-2 ${o.groupMin ? 'sm:grid-cols-2' : ''}`} role="radiogroup" aria-label="Who is it for">
          <WhoCard on={f.mode === 'individual'} onClick={() => f.setMode('individual')} Icon={User} title="One person" text="Sized for you or one other person." />
          {o.groupMin > 0 && (
            <WhoCard on={f.mode === 'group'} onClick={() => f.startGroup(o.groupMin)} Icon={Users} title="Group order"
              text={`A team, class or office: ${o.groupMin} people or more, a name and size each.`} />
          )}
        </div>
      </fieldset>
      )}

      {f.mode === 'individual' && (
        <div>
          <SectionLabel htmlFor="order-qty" hint={o.option?.sold_as === 'set' ? 'Sets for this one person.' : 'Pieces for this one person.'}>How many?</SectionLabel>
          <div className="flex w-fit items-center rounded-xl border border-line bg-surface">
            <button type="button" aria-label="One fewer" disabled={f.quantity <= 1} onClick={() => f.setQuantity(Math.max(1, f.quantity - 1))}
              className="flex h-12 w-12 items-center justify-center text-ink disabled:text-ink-faint"><Minus size={18} /></button>
            <input id="order-qty" type="number" inputMode="numeric" min={1} max={500} value={f.quantity}
              onChange={(e) => f.setQuantity(Math.min(500, Math.max(1, Math.floor(Number(e.target.value)) || 1)))}
              className="h-12 w-16 border-x border-line bg-transparent text-center text-base font-semibold tabular-nums text-ink focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
            <button type="button" aria-label="One more" disabled={f.quantity >= 500} onClick={() => f.setQuantity(Math.min(500, f.quantity + 1))}
              className="flex h-12 w-12 items-center justify-center text-ink disabled:text-ink-faint"><Plus size={18} /></button>
          </div>
          {o.groupMin > 0 && f.quantity >= o.groupMin && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-sunken px-4 py-3">
              <p className="mobile-body-sm min-w-0 flex-1 text-ink-body">Ordering for {f.quantity} different people? A Group order takes a name and size for each.</p>
              <button type="button" onClick={() => f.startGroup(Math.max(o.groupMin, f.quantity))} className="h-11 shrink-0 rounded-xl bg-ink px-4 text-sm font-semibold text-white">
                Switch to Group order
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
