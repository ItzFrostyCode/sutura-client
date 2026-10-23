import React from 'react';
import { Banknote, BadgeCheck } from 'lucide-react';
import { Job } from '../jobTypes';
import { ComputedFinancials } from './financialsTypes';
import { CashierMethodSelector } from './CashierMethodSelector';
import { CashierPresetSection, CashierAmountField, CASHIER_LABEL } from './CashierAmountSection';
import { CashTenderedPanel } from './CashTenderedPanel';
import { CashierNonCashPanel } from './CashierNonCashPanel';
import { CashierRecorded } from './CashierRecorded';
import type { RecordedPayment } from './useJobFinancials';
import { CashierReview, CashierSettled, CASHIER_SHELL } from './CashierReview';
import SectionHeader from '../ui/SectionHeader';
import { PLAIN_FIELD } from '@/components/shared/plainForm';

interface JobCashierDeskProps {
  readonly job: Job;
  readonly financials: ComputedFinancials;
  readonly saving: boolean;
  readonly method: string;
  readonly setMethod: (m: string) => void;
  readonly amount: string;
  readonly setAmount: (a: string) => void;
  readonly reference: string;
  readonly setReference: (r: string) => void;
  readonly notes: string;
  readonly setNotes: (n: string) => void;
  readonly receiptUrl: string;
  readonly setReceiptUrl: (u: string) => void;
  readonly uploadingReceipt: boolean;
  readonly setUploadingReceipt: (v: boolean) => void;
  readonly charging: boolean;
  readonly onChargeSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  readonly uploadReceipt: (file: File | undefined, onDone: (url: string) => void, setUploading: (v: boolean) => void) => Promise<void>;
  readonly cashTendered: string;
  readonly setCashTendered: (v: string) => void;
  readonly reviewingCharge: boolean;
  readonly onConfirmCharge: () => Promise<void>;
  readonly onCancelChargeReview: () => void;
  readonly recorded: RecordedPayment | null;
  readonly onDismissRecorded: () => void;
}

export function JobCashierDesk({
  job,
  financials,
  saving,
  method,
  setMethod,
  amount,
  setAmount,
  reference,
  setReference,
  notes,
  setNotes,
  receiptUrl,
  setReceiptUrl,
  uploadingReceipt,
  setUploadingReceipt,
  charging,
  onChargeSubmit,
  uploadReceipt,
  cashTendered,
  setCashTendered,
  reviewingCharge,
  onConfirmCharge,
  onCancelChargeReview,
  recorded,
  onDismissRecorded,
}: JobCashierDeskProps) {
  const { remainingBalance } = financials;
  const parsedAmount = Number.parseFloat(amount) || 0;
  const parsedTendered = Number.parseFloat(cashTendered) || 0;
  const change = method === 'cash' ? Math.max(0, parsedTendered - parsedAmount) : 0;
  const cashShortfall = method === 'cash' && cashTendered !== '' && parsedTendered < parsedAmount;

  if (recorded && !reviewingCharge) return <CashierRecorded job={job} recorded={recorded} onDone={onDismissRecorded} />;

  if (reviewingCharge) {
    return (
      <CashierReview
        method={method} amount={parsedAmount} cashTendered={parsedTendered} change={change} reference={reference} receiptUrl={receiptUrl}
        charging={charging} onConfirm={onConfirmCharge} onBack={onCancelChargeReview}
      />
    );
  }

  return (
    <div className={CASHIER_SHELL}>
      <SectionHeader
        icon={Banknote}
        title="Cashier Desk"
        subtitle="Record deposit or settlement"
        as="h3"
        actions={remainingBalance > 0 ? (
          <span className="rounded-full bg-rose-500/10 px-3 py-1 text-[13px] font-semibold text-rose-700">Due: ₱{remainingBalance.toFixed(2)}</span>
        ) : undefined}
      />

      {remainingBalance > 0 ? (
        <form onSubmit={onChargeSubmit} className="space-y-5">
          <CashierPresetSection financials={financials} amount={amount} setAmount={setAmount} />
          <CashierMethodSelector method={method} setMethod={setMethod} />
          <CashierAmountField financials={financials} amount={amount} setAmount={setAmount} method={method} />

          {method === 'cash' ? (
            <CashTenderedPanel amount={amount} cashTendered={cashTendered} setCashTendered={setCashTendered} change={change} shortfall={cashShortfall} />
          ) : (
            <CashierNonCashPanel
              method={method} reference={reference} setReference={setReference} receiptUrl={receiptUrl} setReceiptUrl={setReceiptUrl}
              uploadingReceipt={uploadingReceipt} setUploadingReceipt={setUploadingReceipt} uploadReceipt={uploadReceipt}
            />
          )}

          <div>
            <label htmlFor="cashier-notes" className={CASHIER_LABEL}>Remarks / Notes (optional)</label>
            <input id="cashier-notes" type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Paid in cash at front counter" className={PLAIN_FIELD} />
          </div>

          {/* Opens the Review step; nothing is sent yet */}
          <button
            type="submit"
            disabled={saving || charging || !amount || parsedAmount <= 0 || (method === 'cash' ? (!cashTendered || cashShortfall) : !receiptUrl)}
            className="inline-flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-espresso text-[15px] font-semibold text-white transition-colors hover:bg-espresso/90 disabled:cursor-default disabled:opacity-40"
          >
            <BadgeCheck size={18} />
            <span>Review Payment</span>
          </button>
        </form>
      ) : (
        <CashierSettled job={job} />
      )}
    </div>
  );
}
