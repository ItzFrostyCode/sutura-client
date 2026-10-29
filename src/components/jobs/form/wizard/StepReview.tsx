import FormStep from '../FormStep';
import PriceStep from '../PriceStep';
import ReviewSummary from './ReviewSummary';
import type { JobCreateForm } from '../useJobCreateForm';

/** Step 4: price, due date and what was paid now, then the last look at everything that will be created. */
export default function StepReview({ form, canCollectMoney }: Readonly<{ form: JobCreateForm; canCollectMoney: boolean }>) {
  return (
    <div className="space-y-6">
      <FormStep title="Price and payment" hint="The price and date start as the service’s own. Type over them if you agreed something else.">
        <PriceStep form={form} canCollectMoney={canCollectMoney} />
      </FormStep>
      <ReviewSummary form={form} />
    </div>
  );
}
