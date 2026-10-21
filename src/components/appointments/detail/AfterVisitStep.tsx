import Link from 'next/link';
import { PackageCheck } from 'lucide-react';
import type { Appointment } from '../appointmentHelpers';
import { StepCard, Sub } from './StepCard';

/** Step 3: after the visit: the job order it made, or the way to make one. From here the job order talks to the customer. */
export default function AfterVisitStep({ apt, n = 3 }: Readonly<{ apt: Appointment; n?: number }>) {
  return (
    <StepCard n={n} title="After the visit" hint="The job order made from this visit." done={Boolean(apt.job_order_id)}>
      <div>
        <Sub>Job order</Sub>
        {apt.job_order_id ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-canvas p-3">
            <p className="text-sm text-ink"><span className="font-semibold">#{apt.job_order?.order_number ?? apt.job_order_id}</span>{apt.job_order?.status ? ` · ${apt.job_order.status === 'cancelled' ? 'Cancelled' : 'Made from this visit'}` : ''}</p>
            <Link href={`/dashboard/jobs/${apt.job_order_id}`} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-espresso px-4 text-sm font-semibold text-white hover:bg-espresso/90"><PackageCheck size={15} />Open job order</Link>
          </div>
        ) : (
          <p className="text-sm text-ink-body">
            {apt.status === 'completed' ? 'No job order yet. Create one when the customer decides to go ahead.' : 'A job order is made when the visit is done. The measurements are taken there, and the customer is kept informed from it.'}
          </p>
        )}
      </div>
    </StepCard>
  );
}
