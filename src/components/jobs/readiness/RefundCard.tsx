import React from 'react';
import { Undo2 } from 'lucide-react';
import SectionHeader from '../ui/SectionHeader';
import { peso } from './readinessFormat';
import RefundForm from './RefundForm';
import type { ReadinessData } from './readinessTypes';

interface RefundCardProps {
  readonly storeId: number;
  readonly jobId: number;
  readonly data: ReadinessData;
  readonly onRecorded: () => void;
}

/** Cancelled order: record a refund only if you give money back. SUTURA never moves the money itself. */
export default function RefundCard({ storeId, jobId, data, onRecorded }: RefundCardProps) {
  const recorded = data.refunds ?? [];

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-2xs sm:p-6">
      <SectionHeader icon={Undo2} title="Refund" subtitle="Optional — record a refund only if you give money back. SUTURA does not move money." as="h3" />
      {data.policy && <p className="text-[13px] text-ink-muted">{data.policy}</p>}
      {recorded.length > 0 ? (
        <ul className="space-y-1 text-sm text-ink">
          {recorded.map((r) => (
            <li key={r.id}>
              {Number(r.approved_amount) > 0 ? `Refund recorded ${peso(r.approved_amount)}` : 'No refund recorded'}
              {Number(r.approved_amount) > 0 && (r.refunded_at ? ' · handed back' : ' · not yet handed back')}
              {r.adjustment_reason ? ` — ${r.adjustment_reason}` : ''}
            </li>
          ))}
        </ul>
      ) : (
        <RefundForm storeId={storeId} jobId={jobId} data={data} onRecorded={onRecorded} />
      )}
    </section>
  );
}
