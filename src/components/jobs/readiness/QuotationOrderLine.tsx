import React from 'react';
import type { Job } from '../jobHelpers';

/** Which order this quotation is for, and (when the consultation made several orders) that each one has its own. */
export default function QuotationOrderLine({ job }: Readonly<{ job: Job }>) {
  const b = job.batch;
  const n = job.batch_no ?? 1;
  return (
    <div className="space-y-1">
      <p className="text-[14px] text-ink-body">
        <span className="font-medium text-ink">This order:</span> {job.service?.name ?? 'Service'}{job.catalog_item?.name ? ` · design ${job.catalog_item.name}` : ''}
      </p>
      {b && (
        <p className="text-[13px] text-ink-muted">
          {b.kind === 'set'
            ? `Order ${n} of ${b.count} from the same consultation — each has its own quotation.`
            : `Batch ${n} of ${b.count} of the same design, split by who pays — each has its own quotation.`}
        </p>
      )}
    </div>
  );
}
