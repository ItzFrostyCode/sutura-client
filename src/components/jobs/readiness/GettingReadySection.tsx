import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import SectionHeader from '../ui/SectionHeader';
import { startBy } from '../startBy';
import ReadyStepRow from './ReadyStepRow';
import MaterialsStep from './MaterialsStep';
import TailorStep from './TailorStep';
import StartProduction from './StartProduction';
import type { Job } from '../jobHelpers';
import type { OrderReadinessApi } from './useOrderReadiness';
import type { ReadinessData } from './readinessTypes';

interface GettingReadySectionProps {
  readonly data: ReadinessData;
  readonly api: OrderReadinessApi;
  readonly job: Job;
  readonly onOpen: (what: 'tailors') => void;
  readonly onGoToFinancials?: () => void;
}

/** The Confirmed column on the Steps tab: materials ready, a tailor assigned, then Start production. */
export default function GettingReadySection({ data, api, job, onOpen, onGoToFinancials }: GettingReadySectionProps) {
  const materialsDone = Boolean(data.materials?.ready);
  const tailorDone = (data.assignees ?? []).length > 0;
  const done = Number(materialsDone) + Number(tailorDone);
  const by = startBy(job);

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-2xs">
      <header className="border-b border-line px-5 py-4 sm:px-6">
        <SectionHeader
          icon={ClipboardCheck}
          title="Getting ready"
          subtitle={by && <span className={by.late ? 'font-medium text-danger' : undefined}>Start by {by.label}{by.late ? ' (that day has passed)' : ''}</span>}
          actions={<span className="shrink-0 text-[13px] text-ink-muted">{done} of 2 done</span>}
        />
      </header>
      <ol className="divide-y divide-line">
        <ReadyStepRow n={1} title="Materials ready" done={materialsDone}><MaterialsStep data={data} api={api} /></ReadyStepRow>
        <ReadyStepRow n={2} title="Tailor assigned" done={tailorDone}><TailorStep data={data} onOpen={onOpen} /></ReadyStepRow>
      </ol>
      <StartProduction data={data} api={api} job={job} onGoToFinancials={onGoToFinancials} />
    </section>
  );
}
