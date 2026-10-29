import { CalendarClock } from 'lucide-react';
import { formatTurnaround } from '@/lib/formatTurnaround';
import FormStep from '../FormStep';
import { peso, readyBy } from '../jobFormHelpers';
import { turnaroundOf } from '../measurementNeed';
import { openItems, sizingSummary } from './wizardSteps';
import type { JobCreateForm } from '../useJobCreateForm';
import { garmentsLabel, garmentsPerUnit, unitNoun } from '@/lib/orderUnits';

const day = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

/** The last look before saving: every job order that will be created, its pieces and total, what is still open, and when it should be ready. */
export default function ReviewSummary({ form }: Readonly<{ form: JobCreateForm }>) {
  const { service, design, formData, pricing: p } = form;
  const customer = form.customers.find((c) => String(c.id) === formData.customer_id)?.name ?? 'the customer';
  const wearers = form.isBulk ? form.roster.length : 1;
  const extras = form.extras.filter((x) => x.service_id).map((x) => {
    const svc = form.services.find((s) => String(s.id) === x.service_id);
    const qty = Math.max(1, Number(x.quantity) || 1);
    return { key: x.key, name: svc?.name ?? 'Service', qty, price: x.price.trim() !== '' ? Number(x.price) || 0 : (Number(svc?.base_price) || 0) * qty };
  });
  const orders = 1 + extras.length;
  const together = p.total + extras.reduce((sum, x) => sum + x.price, 0);
  const { min, max, from } = turnaroundOf(form);
  const ready = readyBy(min, max);
  const open = openItems(form);

  return (
    <FormStep title="Check the order" hint={`${orders} job ${orders === 1 ? 'order' : 'orders'} will be created for ${customer}.`}>
      <ul className="divide-y divide-espresso/10 rounded-xl border border-espresso/10">
        <li className="space-y-0.5 p-4">
          <p className="font-semibold text-espresso">{service?.name ?? 'Service'}{design ? ` · ${design.name}` : ''}</p>
          <p className="text-sm text-espresso/70">
            {wearers} {wearers === 1 ? 'person' : 'people'} · {p.quantity} {unitNoun(form.option?.sold_as, p.quantity)}
            {form.option?.sold_as === 'set' && ` · ${garmentsLabel(p.quantity * garmentsPerUnit('set'))}`}
            {form.option && ` · ${form.option.label}`}
          </p>
          <p className="text-sm text-espresso/70">{sizingSummary(form)}</p>
          <p className="pt-1 text-sm font-medium text-espresso">{p.total > 0 ? peso(p.total) : 'Price to be quoted'}</p>
        </li>
        {extras.map((x) => (
          <li key={x.key} className="space-y-0.5 p-4">
            <p className="font-semibold text-espresso">{x.name} <span className="font-normal text-espresso/60">· its own order</span></p>
            <p className="text-sm text-espresso/70">{x.qty} {x.qty === 1 ? 'piece' : 'pieces'}</p>
            <p className="pt-1 text-sm font-medium text-espresso">{x.price > 0 ? peso(x.price) : 'Price to be quoted'}</p>
          </li>
        ))}
      </ul>
      {orders > 1 && <p className="text-sm font-semibold text-espresso">All {orders} orders together: {peso(together)}</p>}

      <p className="flex items-start gap-2 text-sm text-espresso">
        <CalendarClock size={16} className="mt-0.5 shrink-0" />
        <span>
          {p.dueDate ? <>Due <strong>{day(p.dueDate)}</strong>. </> : 'No due date yet. '}
          {ready
            ? <span className="text-espresso/60">This {from} usually takes {formatTurnaround(min, max)} (counted in calendar days from today), so it is ready around {ready}.</span>
            : <span className="text-espresso/60">This service has no usual turnaround set, so the date is the one you choose.</span>}
        </span>
      </p>

      {open.length > 0 && (
        <div role="note" className="space-y-1 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-espresso">
          <p className="font-semibold">Still open. The order can be created anyway.</p>
          <ul className="list-disc space-y-0.5 pl-5">{open.map((line) => <li key={line}>{line}</li>)}</ul>
        </div>
      )}
    </FormStep>
  );
}
