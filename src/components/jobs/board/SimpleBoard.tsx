'use client';

import React, { useState } from 'react';
import type { Job } from '../jobHelpers';
import { SHOP_STAGES, type ShopStageKey } from '../jobStage';
import BoardCard from './BoardCard';
import BoardLane from './BoardLane';
import ConsultationCard from './ConsultationCard';
import type { Appointment } from '@/components/appointments/appointmentHelpers';

interface SimpleBoardProps {
  readonly byStage: Record<ShopStageKey, Job[]>;
  readonly closed: Job[];
  /** Finished consultations with no job order yet: the first lane. */
  readonly consultations: Appointment[];
  /** Takes a consultation out of its lane once it is marked "No order". */
  readonly onConsultationRemove: (id: number) => void;
  readonly showClosed: boolean;
  readonly canSeeMoney: boolean;
  readonly canDecline: boolean;
  readonly busyId: number | null;
  readonly onAdvance: (job: Job) => void;
  readonly onMove: (job: Job, status: string, message: string) => void;
  readonly onDecline: (jobId: number) => void;
}

const DONE_LIMIT = 12;

/**
 * Kanban workflow board view: 5 stages left-to-right on wide screens,
 * tab-navigable stage lanes on mobile.
 */
export default function SimpleBoard({
  byStage,
  closed,
  consultations,
  onConsultationRemove,
  showClosed,
  canSeeMoney,
  canDecline,
  busyId,
  onAdvance,
  onMove,
  onDecline,
}: SimpleBoardProps) {
  // Consultation is always the first lane and tab, even at 0.
  const [active, setActive] = useState<ShopStageKey | 'consultation'>(consultations.length > 0 ? 'consultation' : (SHOP_STAGES.find((s) => byStage[s.key].length > 0)?.key ?? 'request'));
  const tabs: { key: ShopStageKey | 'consultation'; label: string; count: number }[] = [
    { key: 'consultation', label: 'Consultation', count: consultations.length },
    ...SHOP_STAGES.map((s) => ({ key: s.key, label: s.label, count: byStage[s.key].length })),
  ];
  const [allDone, setAllDone] = useState(false);

  const renderCard = (job: Job, rank: number | null) => (
    <BoardCard
      key={job.id}
      job={job}
      rank={rank}
      canSeeMoney={canSeeMoney}
      canDecline={canDecline}
      busy={busyId === job.id}
      onAdvance={onAdvance}
      onMove={onMove}
      onDecline={onDecline}
    />
  );

  return (
    <div className="flex min-h-0 flex-col gap-4 lg:h-full">
      {/* Mobile Stage Selector Tabs (< 1024px) */}
      <div
        role="tablist"
        aria-label="Order stages"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 hide-scrollbar lg:hidden"
      >
        {tabs.map((s) => {
          const isSelected = active === s.key;
          return (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActive(s.key)}
              className={`flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-[13px] font-medium transition-colors ${
                isSelected ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink-body'
              }`}
            >
              <span>{s.label}</span>
              <span className={isSelected ? 'text-white/70' : 'text-ink-faint'}>{s.count}</span>
            </button>
          );
        })}
      </div>

      {/* Lanes: Consultation (phones always; wide screens once it has cards) and the 5 stages */}
      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-flow-col lg:auto-cols-[minmax(13.5rem,1fr)] lg:overflow-x-auto">
        <BoardLane stage={{ key: 'consultation', label: 'Consultation' }} count={consultations.length} visible={active === 'consultation'} attention hideWhenEmptyOnWide>
          {consultations.map((a) => <ConsultationCard key={a.id} appointment={a} onRemove={onConsultationRemove} />)}
        </BoardLane>
        {SHOP_STAGES.map((s) => {
          const list = s.key === 'done' && !allDone ? byStage.done.slice(0, DONE_LIMIT) : byStage[s.key];
          return (
            <BoardLane
              key={s.key}
              stage={s}
              count={byStage[s.key].length}
              visible={active === s.key}
              canCreate={canSeeMoney}
              footer={
                s.key === 'done' && byStage.done.length > DONE_LIMIT ? (
                  <button
                    type="button"
                    onClick={() => setAllDone((v) => !v)}
                    className="h-10 w-full cursor-pointer rounded-lg text-sm font-medium text-taupe hover:bg-espresso/[0.04]"
                  >
                    {allDone ? 'Show fewer' : `Show all ${byStage.done.length}`}
                  </button>
                ) : undefined
              }
            >
              {list.map((job, i) => renderCard(job, s.key === 'done' ? null : i + 1))}
            </BoardLane>
          );
        })}
      </div>

      {/* Closed Orders Section */}
      {showClosed && (
        <section aria-label="Closed orders" className="rounded-2xl border border-line bg-surface p-4 shadow-2xs">
          <div className="mb-3 flex items-baseline justify-between border-b border-line pb-3">
            <div>
              <h2 className="text-[15px] font-semibold text-ink">Closed orders</h2>
              <p className="text-[13px] text-ink-muted">Cancelled or declined</p>
            </div>
            <span className="text-[13px] text-ink-muted">{closed.length}</span>
          </div>

          {closed.length === 0 ? (
            <p className="text-xs text-ink-muted py-4 text-center">No cancelled or declined orders found.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {closed.map((job) => renderCard(job, null))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
