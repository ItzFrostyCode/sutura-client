import RadioRows from '@/components/shared/RadioRows';
import { optionLine } from '@/lib/orderUnits';
import { LABEL } from './FormStep';
import { peso } from './jobFormHelpers';
import type { JobCreateForm } from './useJobCreateForm';

/**
 * The option of the service this order is made from. It decides what is covered (so which sizes are asked) and what one ordered
 * unit is (a garment, or a set of a top and a bottom); the server reads both from the option. Required once the shop has
 * configured any option of the service; otherwise it only suggests the price.
 */
export default function OptionStep({ form }: Readonly<{ form: JobCreateForm }>) {
  const { options, option, pricingId, setPricingId, optionRequired } = form;
  if (options.length === 0) return null;
  const configured = options.some((o) => o.covers || o.sold_as);
  const rows = options.map((o) => ({
    value: String(o.id),
    title: o.label,
    hint: [
      optionLine(o),
      o.amount !== null && o.amount !== '' && Number(o.amount) > 0 ? `${peso(Number(o.amount))}${o.sold_as === 'set' ? ' per set' : o.sold_as === 'garment' ? ' each' : ''}` : 'Price to be quoted',
    ].filter(Boolean).join(' · '),
  }));
  return (
    <div className="space-y-3">
      <span className={LABEL}>Option {optionRequired && <span className="text-danger">*</span>}</span>
      <RadioRows
        label="Option" value={option ? String(option.id) : ''} onChange={setPricingId}
        options={configured ? rows : [{ value: '', title: 'No option', hint: 'The service’s starting price' }, ...rows]}
      />
    </div>
  );
}
