import React from 'react';
import Link from 'next/link';
import { Users, ShoppingBag, Store, Truck, Zap } from 'lucide-react';
import { Job } from '../jobTypes';
import { jobPeople, jobPieces, orderSize } from '@/lib/orderSize';

const CHIP = 'inline-flex h-7 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px] text-ink-body';

/** The small facts next to the order number: where it came from, how it is handed over, batch, size and rush. */
export default function JobHeaderChips({ job }: Readonly<{ job: Job }>) {
  const online = job.intake_channel === 'online';
  const delivery = job.fulfillment_type === 'delivery';
  return (
    <>
      <span className={CHIP}>{online ? <ShoppingBag size={13} /> : <Store size={13} />} {online ? 'Online' : 'Walk-in'}</span>
      <span className={CHIP}>{delivery ? <Truck size={13} /> : <ShoppingBag size={13} />} {delivery ? 'Delivery' : 'Pickup'}</span>
      {job.follow_up_of && (
        <Link href={`/dashboard/jobs/${job.follow_up_of.id}`} className={`${CHIP} font-medium text-espresso hover:bg-sunken`}>Follow-up of {job.follow_up_of.order_number}</Link>
      )}
      {job.batch && (
        <span className={CHIP}>
          {job.batch.kind === 'set' ? `Order ${job.batch_no ?? 1} of ${job.batch.count}` : `Batch ${job.batch_no ?? 1} of ${job.batch.count}${job.paid_by_name ? ` · ${job.paid_by_name}` : ''}`}
        </span>
      )}
      {jobPeople(job) >= 2 && (
        <span className={CHIP}><Users size={13} /> {orderSize(jobPeople(job), job.service?.min_order_qty)} · {jobPieces(job)} pcs</span>
      )}
      {job.is_rush && (
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-transparent bg-amber-500/10 px-3 text-[13px] font-medium text-amber-700"><Zap size={13} /> Rush</span>
      )}
    </>
  );
}
