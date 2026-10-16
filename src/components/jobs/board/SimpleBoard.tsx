import React, { useState } from 'react';
import type { Job } from '../jobHelpers';
import { SHOP_STAGES, type ShopStageKey } from '../jobStage';
import BoardCard from './BoardCard';
import BoardLane from './BoardLane';
import WaitingAppointments from './WaitingAppointments';
import type { Appointment } from '@/components/appointments/appointmentHelpers';

interface SimpleBoardProps {
  readonly byStage: Record<ShopStageKey, Job[]>;
  readonly closed: Job[];
  readonly showClosed: boolean;
  readonly canSeeMoney: boolean;
  readonly canDecline: boolean;
  readonly busyId: number | null;
  readonly waiting: Appointment[];
  readonly onAdvance: (job: Job, status: string) => void;
  readonly onDecline: (jobId: number) => void;
}

const DONE_LIMIT = 12;

/** Five columns on a wide screen, one stage at a time on a phone. Oldest order on top. */
export default function SimpleBoard({ byStage, closed, showClosed, canSeeMoney, canDecline, busyId, waiting, onAdvance, onDecline }: SimpleBoardProps) {
  const first = SHOP_STAGES.find((s) => byStage[s.key].length > 0)?.key ?? 'request';
  const [active, setActive] = useState<ShopStageKey>(first);
  const [allDone, setAllDone] = useState(false);

  const card = (job: Job, rank: number | null) => (
    <BoardCard key={job.id} job={job} rank={rank} canSeeMoney={canSeeMoney} canDecline={canDecline} busy={busyId === job.id} onAdvance={onAdvance} onDecline={onDecline} />
  );

  return (
    <div>
      <div role="tablist" aria-label="Order stage" className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 hide-scrollbar lg:hidden">
        {SHOP_STAGES.map((s) => (
          <button key={s.key} type="button" role="tab" aria-selected={active === s.key} onClick={() => setActive(s.key)}
            className={`flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold ${active === s.key ? 'bg-ink text-white' : 'bg-sunken text-ink-body'}`}>
            {s.label}<span className={`text-xs ${active === s.key ? 'text-white/80' : 'text-ink-muted'}`}>{byStage[s.key].length}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        {SHOP_STAGES.map((s) => {
          const list = s.key === 'done' && !allDone ? byStage.done.slice(0, DONE_LIMIT) : byStage[s.key];
          return (
            <BoardLane
              key={s.key} stage={s} count={byStage[s.key].length} visible={active === s.key} canCreate={canDecline}
              leading={s.key === 'request' ? <WaitingAppointments appointments={waiting} /> : undefined}
              footer={s.key === 'done' && byStage.done.length > DONE_LIMIT ? (
                <button type="button" onClick={() => setAllDone((v) => !v)} className="mt-2 h-10 w-full text-xs font-semibold text-taupe">{allDone ? 'Show fewer' : `Show all ${byStage.done.length}`}</button>
              ) : undefined}
            >
              {list.map((job, i) => card(job, s.key === 'done' ? null : i + 1))}
            </BoardLane>
          );
        })}
      </div>

      {showClosed && (
        <section aria-label="Closed orders" className="mt-6">
          <h2 className="mb-2 text-sm font-bold text-ink">Closed ({closed.length})</h2>
          <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-5">{closed.map((job) => card(job, null))}</ul>
          {closed.length === 0 && <p className="text-xs text-ink-muted">No cancelled or declined orders.</p>}
        </section>
      )}
    </div>
  );
}
