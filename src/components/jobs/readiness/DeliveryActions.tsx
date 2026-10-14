import React from 'react';
import type { OrderReadinessApi } from './useOrderReadiness';
import type { ReadinessData } from './readinessTypes';
import { peso } from './readinessFormat';

export type DeliveryModal = 'qcFail' | 'fittingIssue' | 'handover';

interface DeliveryActionsProps {
  readonly data: ReadinessData;
  readonly api: OrderReadinessApi;
  readonly onOpen: (m: DeliveryModal) => void;
  readonly onGoToFinancials?: () => void;
}

const primary = 'h-11 sm:h-10 rounded-lg bg-taupe px-4 text-sm font-bold text-white hover:bg-taupe-hover disabled:opacity-50';
const ghost = 'h-11 sm:h-10 rounded-lg border border-line px-4 text-sm font-bold text-ink-body hover:bg-sunken disabled:opacity-50';
const danger = 'h-11 sm:h-10 rounded-lg border border-rose-300 px-4 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50';

/** What to do next at the order's current delivery stage (Flow 3). */
export default function DeliveryActions({ data, api, onOpen, onGoToFinancials }: DeliveryActionsProps) {
  const d = data.delivery;
  if (!d) return null;
  const off = api.busy !== null;
  const a = api.actions;
  const fitting = d.fitting_requirement !== 'none';
  const row = (...kids: React.ReactNode[]) => <div className="flex flex-wrap gap-2">{kids}</div>;
  const note = (t: string) => <p className="text-sm text-ink-body">{t}</p>;

  switch (d.current) {
    case 'in_production':
      return <>{note('When the required production work is done, send it to Quality Check.')}{row(<button key="q" type="button" disabled={off} onClick={a.sendToQuality} className={primary}>Send to Quality Check</button>)}</>;
    case 'quality_check':
      return <>{note('Check the garments against the approved design, measurements and specifications.')}{row(
        <button key="p" type="button" disabled={off} onClick={a.passQuality} className={primary}>Quality check passed</button>,
        <button key="f" type="button" disabled={off} onClick={() => onOpen('qcFail')} className={danger}>Found a problem</button>,
      )}</>;
    case 'collection':
      return <>{note(fitting ? 'The customer is told the order passed quality check and to come for the final fitting.' : 'The customer is told the order passed quality check and to come and collect it.')}{row(
        fitting && <button key="a" type="button" disabled={off} onClick={() => a.moveTo('ready_for_fitting', 'Fitting started.')} className={primary}>Customer arrived for fitting</button>,
        d.fitting_requirement !== 'required' && <button key="s" type="button" disabled={off} onClick={() => a.moveTo('balance_handover', 'Moved to payment & handover.')} className={fitting ? ghost : primary}>{fitting ? 'No fitting — go to payment & handover' : 'Customer is here — payment & handover'}</button>,
      )}</>;
    case 'fitting':
      return <>{note('The customer tries or inspects the garments.')}{row(
        <button key="p" type="button" disabled={off} onClick={() => a.moveTo('balance_handover', 'Fitting passed.')} className={primary}>Fitting passed</button>,
        <button key="i" type="button" disabled={off} onClick={() => onOpen('fittingIssue')} className={danger}>Fitting issue</button>,
      )}</>;
    case 'correction':
      return d.open_corrections > 0
        ? note(`Finish the ${d.open_corrections} open correction${d.open_corrections === 1 ? '' : 's'} below first. Then the order goes back to Quality Check.`)
        : <>{note('All corrections are done. Send it back to Quality Check.')}{row(<button key="b" type="button" disabled={off} onClick={a.sendToQuality} className={primary}>Back to Quality Check</button>)}</>;
    case 'handover':
      return (
        <>
          {!d.balance_clear ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {d.balance !== null ? `The balance of ${peso(d.balance)} is not paid yet.` : 'The balance is not paid yet.'} The order stays here until it is settled — payments are recorded in Financials.
            </div>
          ) : note(`${d.handover.handed_over} of ${d.handover.quantity} garments handed over.`)}
          {row(
            !d.balance_clear && data.permissions.can_see_money && onGoToFinancials && <button key="c" type="button" onClick={onGoToFinancials} className={primary}>Collect balance</button>,
            d.balance_clear && d.handover.remaining > 0 && <button key="h" type="button" disabled={off} onClick={() => onOpen('handover')} className={primary}>Record handover</button>,
            <button key="r" type="button" disabled={off} onClick={() => onOpen('fittingIssue')} className={ghost}>Report an issue</button>,
          )}
        </>
      );
    case 'completed':
      return note('This order is complete: the garments were handed over and nothing is left to correct.');
    default:
      return null;
  }
}
