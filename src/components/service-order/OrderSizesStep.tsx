'use client';

import type { ServiceOrderState } from './useServiceOrder';
import { StepIntro, Tip } from './orderUi';
import OrderSizeChart from './OrderSizeChart';
import OrderIndividualSizing from './OrderIndividualSizing';
import OrderGroupRoster from './OrderGroupRoster';

/** Step 3 — the size chart first, then one person's size or the group's list of names and sizes. */
export default function OrderSizesStep({ o }: Readonly<{ o: ServiceOrderState }>) {
  const group = o.f.mode === 'group';
  if (!o.sizesNeeded && !group) {
    return (
      <div className="space-y-6">
        <StepIntro title="Sizes" text="Nothing to measure for this service." />
        <Tip>The shop works from your description and photos in the next step.</Tip>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StepIntro
        title={group ? 'Names and sizes' : 'Size'}
        text={group ? `One row per person. At least ${o.groupMin} people for a group order.` : 'Check the size chart, then choose how the shop gets the size.'}
      />
      {/* A group whose people may each get a top, a bottom or a set sees both tables. */}
      {o.sizesNeeded && <OrderSizeChart service={o.service} area={group && !o.areaLocked ? 'both' : o.area} group={group} />}
      {group ? <OrderGroupRoster o={o} /> : <OrderIndividualSizing o={o} />}
    </div>
  );
}
