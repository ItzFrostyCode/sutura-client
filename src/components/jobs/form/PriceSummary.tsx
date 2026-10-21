import { peso } from './jobFormHelpers';
import type { JobCreateForm } from './useJobCreateForm';
import { extrasTotal } from './ExtraServices';

/** The order's money as a plain statement: price, charges, total, what was paid now, and the balance. */
export default function PriceSummary({ form, canCollectMoney }: Readonly<{ form: JobCreateForm; canCollectMoney: boolean }>) {
  const p = form.pricing;
  const base = p.total - p.rushFee + p.discount;
  const paid = canCollectMoney && p.downpayment > 0;
  const extras = form.extras.filter((x) => x.service_id);
  const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
    <div className={`flex items-baseline justify-between gap-4 ${strong ? 'text-base font-semibold text-espresso' : 'text-sm text-espresso/70'}`}>
      <dt>{label}</dt><dd className={strong ? '' : 'text-espresso'}>{value}</dd>
    </div>
  );
  return (
    <div className="space-y-3">
      <dl className="space-y-1.5 border-t border-espresso/25 pt-4">
        <Row label="Price" value={peso(base)} />
        {p.rushFee > 0 && <Row label="Rush fee" value={`+ ${peso(p.rushFee)}`} />}
        {p.discount > 0 && <Row label="Discount" value={`− ${peso(p.discount)}`} />}
        <div className="border-t border-espresso/15 pt-2"><Row label="Total" value={peso(p.total)} strong /></div>
        {paid && <Row label="Paid now" value={peso(p.downpayment)} />}
        {paid && <Row label="Balance" value={peso(p.balance)} strong />}
      </dl>
      {extras.length > 0 && <p className="text-sm text-espresso/60">Not included: {extras.length} more {extras.length === 1 ? 'service' : 'services'}, {peso(extrasTotal(form))}. Each is its own order.</p>}
    </div>
  );
}
