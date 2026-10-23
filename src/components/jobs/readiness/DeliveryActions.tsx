import React from 'react';
import HandOverSteps from './handover/HandOverSteps';
import type { OrderReadinessApi } from './useOrderReadiness';
import type { ReadinessData } from './readinessTypes';

interface DeliveryActionsProps {
  readonly data: ReadinessData;
  readonly api: OrderReadinessApi;
  readonly onGoToFinancials?: () => void;
}

/** What to do next at the order's current delivery stage. Ready (collection, fitting, handover) shows the four "Hand over" steps; earlier stages have their buttons in the Work section. */
export default function DeliveryActions({ data, api, onGoToFinancials }: DeliveryActionsProps) {
  switch (data.delivery?.current) {
    case 'collection':
    case 'fitting':
    case 'handover':
      return <HandOverSteps data={data} api={api} onGoToFinancials={onGoToFinancials} />;
    case 'completed':
      return <p className="px-5 py-4 text-sm text-ink-body sm:px-6">This order is complete: the garments were handed over and nothing is left to correct.</p>;
    default:
      return null;
  }
}
