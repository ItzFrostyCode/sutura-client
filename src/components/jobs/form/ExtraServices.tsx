import { BTN_SM } from '@/components/shared/plainForm';
import { FIELD, LABEL } from './FormStep';
import DesignStrip from './DesignStrip';
import { peso } from './jobFormHelpers';
import type { JobCreateForm } from './useJobCreateForm';
import type { ExtraService } from './types';

export const newExtraLine = (): ExtraService => ({ key: `x-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, service_id: '', catalog_item_id: '', quantity: '1', price: '' });

/** What the extra services add up to: the typed price, else the service's own price × quantity. */
export function extrasTotal(form: Pick<JobCreateForm, 'extras' | 'services'>): number {
  return form.extras.reduce((sum, x) => {
    if (!x.service_id) return sum;
    const svc = form.services.find((s) => String(s.id) === x.service_id);
    return sum + (x.price.trim() !== '' ? Number(x.price) || 0 : (Number(svc?.base_price) || 0) * Math.max(1, Number(x.quantity) || 1));
  }, 0);
}

/**
 * More services for the same customer, in the same picker as the first one. The service from the booking is already
 * chosen above; each service added here becomes its own order (own price, deposit, due date and tracking code).
 */
export default function ExtraServices({ form }: Readonly<{ form: JobCreateForm }>) {
  const { extras, setExtras, services, catalogItems } = form;
  const edit = (key: string, patch: Partial<ExtraService>) => setExtras((cur) => cur.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  if (extras.length === 0) return null;
  return (
    <div className="space-y-5 border-t border-espresso/15 pt-5">
      {extras.map((x, i) => {
        const svc = services.find((s) => String(s.id) === x.service_id);
        const designs = catalogItems.filter((c) => String(c.service_id) === x.service_id);
        const design = designs.find((d) => String(d.id) === x.catalog_item_id) ?? null;
        return (
          <div key={x.key} className="space-y-4 border-b border-espresso/15 pb-5">
            <div className="flex items-center justify-between gap-3">
              <span className={`${LABEL} mb-0`}>Extra order {i + 1} <span className="font-normal text-ink-faint">· its own price, deposit, due date and tracking code</span></span>
              <button type="button" onClick={() => setExtras((cur) => cur.filter((y) => y.key !== x.key))} className={BTN_SM}>Remove</button>
            </div>
            <div className="sm:max-w-md">
              <label htmlFor={`xs-${x.key}`} className={LABEL}>Service</label>
              <select id={`xs-${x.key}`} value={x.service_id} onChange={(e) => edit(x.key, { service_id: e.target.value, catalog_item_id: '' })} className={FIELD}>
                <option value="">Choose a service</option>
                {services.filter((s) => String(s.id) !== form.formData.service_id || String(s.id) === x.service_id).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {svc && (
              <>
                <DesignStrip designs={designs} selected={design} serviceName={svc.name} onPick={(id) => edit(x.key, { catalog_item_id: id })} onClear={() => edit(x.key, { catalog_item_id: '' })} />
                <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
                  <div>
                    <label htmlFor={`xq-${x.key}`} className={LABEL}>Quantity</label>
                    <input id={`xq-${x.key}`} type="number" inputMode="numeric" min={1} value={x.quantity} onChange={(e) => edit(x.key, { quantity: e.target.value })} className={FIELD} />
                  </div>
                  <div>
                    <label htmlFor={`xp-${x.key}`} className={LABEL}>Price (₱)</label>
                    <input id={`xp-${x.key}`} type="number" inputMode="decimal" min={0} value={x.price} onChange={(e) => edit(x.key, { price: e.target.value })} placeholder={Number(svc.base_price) > 0 ? peso(Number(svc.base_price) * Math.max(1, Number(x.quantity) || 1)) : '0.00'} className={FIELD} />
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
