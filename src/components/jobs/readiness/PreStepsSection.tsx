import React from 'react';
import { ListChecks } from 'lucide-react';
import ColumnFold from './ColumnFold';
import PreProductionList from '../steps/PreProductionList';
import type { PiecesEditorState } from '../steps/stepExtras';
import type { OrderReadinessApi } from './useOrderReadiness';
import type { ReadinessData } from './readinessTypes';

interface PreStepsSectionProps {
  readonly data: ReadinessData;
  readonly api: OrderReadinessApi;
  /** Folded away (the request is done and the order moved on) instead of open. */
  readonly folded: boolean;
  /** A completed order: the steps are only read, none of their buttons show. */
  readonly readOnly?: boolean;
  readonly onOpen: (what: 'quotation' | 'approval' | 'tailors') => void;
  readonly onGoToFinancials?: () => void;
  readonly pieces?: PiecesEditorState;
}

/** The Request column's six steps: open while the order is still a request, folded ("Request — 6 of 6 done") once it has moved on. */
export default function PreStepsSection({ data, api, folded, readOnly, onOpen, onGoToFinancials, pieces }: PreStepsSectionProps) {
  const steps = data.pre_production?.steps ?? [];
  return (
    <ColumnFold icon={ListChecks} title="Request" done={steps.filter((s) => s.done).length} total={steps.length} folded={folded}>
      <PreProductionList data={data} api={api} onOpen={onOpen} onGoToFinancials={onGoToFinancials} pieces={pieces} readOnly={readOnly} />
    </ColumnFold>
  );
}
