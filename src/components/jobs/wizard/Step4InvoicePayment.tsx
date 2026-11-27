'use client';

import React from 'react';
import {
  Calendar,
  Zap,
  CreditCard,
  Receipt,
  ArrowLeft,
  Loader2,
  Check,
  Percent,
} from 'lucide-react';
import type { JobCreateFormData } from '../form/types';

interface Step4InvoicePaymentProps {
  formData: JobCreateFormData;
  setFormData: React.Dispatch<React.SetStateAction<JobCreateFormData>>;
  itemRate: string;
  setItemRate: (rate: string) => void;
  /** ₱ off the total because the customer brings their own fabric (0 = none). */
  fabricDeduction: number;
  /** The service's price list; picking a line (e.g. "Pants only") sets the price. Optional. */
  serviceName: string;
  wholeServicePrice: number | null;
  pricingOptions: { id: number; label: string; amount: string | number | null }[];
  pricingId: number | null;
  onSelectPricing: (pricingId: number | null) => void;
  paymentTerm: 'full' | 'downpayment';
  setPaymentTerm: (term: 'full' | 'downpayment') => void;
  /** Individual orders are always 1 piece; a bulk order's count comes from its size sheet. */
  isBulkOrder: boolean;
  submitting: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function Step4InvoicePayment({
  formData,
  setFormData,
  itemRate,
  setItemRate,
  fabricDeduction,
  serviceName,
  wholeServicePrice,
  pricingOptions,
  pricingId,
  onSelectPricing,
  paymentTerm,
  setPaymentTerm,
  isBulkOrder,
  submitting,
  onBack,
  onSubmit,
}: Step4InvoicePaymentProps) {
  const qty = isBulkOrder ? Math.max(1, parseInt(formData.quantity, 10) || 1) : 1;
  const rate = parseFloat(itemRate) || 0;
  const rushFee = formData.is_rush ? parseFloat(formData.rush_fee) || 0 : 0;

  // Total = price × pieces + rush fee − customer's own fabric (never below zero).
  // JobCreateForm keeps formData.total_amount in step with this; it's worked out
  // here too so the summary never shows a stale figure for a frame.
  const baseSubtotal = rate * qty;
  const subtotal = baseSubtotal + rushFee;
  const fabricTooHigh = fabricDeduction > 0 && rate > 0 && fabricDeduction > subtotal;
  const currentTotal = rate > 0
    ? Math.max(0, subtotal - fabricDeduction)
    : parseFloat(formData.total_amount || '0') || 0;

  const currentDeposit = Math.min(
    currentTotal,
    paymentTerm === 'full' ? currentTotal : parseFloat(formData.downpayment || '0') || 0,
  );

  const remainingBalance = Math.max(0, currentTotal - currentDeposit);

  const money = (n: number) => `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleRateChange = (newRate: string) => setItemRate(newRate);

  // Default is the whole service; a line from its price list replaces the price (still editable).
  const pickLine = (id: number | null, amount: string | number | null) => {
    onSelectPricing(id);
    if (amount !== null && amount !== '' && Number.isFinite(Number(amount))) handleRateChange(String(Number(amount)));
  };
  const peso = (a: string | number | null) =>
    a !== null && a !== '' && Number.isFinite(Number(a)) ? `₱${Number(a).toLocaleString('en-PH')}` : 'Quoted';

  // Only the rush flag and fee change here; the total follows the typed price.
  const handleRushToggle = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      is_rush: checked,
      rush_fee: checked ? (prev.rush_fee || '200') : '',
    }));
  };

  const handleDepositPreset = (fraction: number) => {
    const dep = Math.round(currentTotal * fraction);
    setFormData((prev) => ({ ...prev, downpayment: dep.toString() }));
  };

  return (
    <div className="bg-surface border border-line rounded-2xl p-6 sm:p-7 shadow-2xs space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-ink">Invoice, Schedule & Payment</h2>
        <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
          Set production due dates, pricing terms, downpayment requirements, and review financial balances.
        </p>
      </div>

      {/* Production Details */}
      <div className="p-5 bg-canvas/30 border border-line/70 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
          Production Schedule & Item Quantities
        </h3>

        {pricingOptions.length > 1 && (
          <fieldset>
            <legend className="block text-xs font-semibold text-ink mb-1.5">What are they ordering?</legend>
            <div role="radiogroup" aria-label="What are they ordering?" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[{ id: null as number | null, label: `Whole service — ${serviceName}`, amount: wholeServicePrice as string | number | null }, ...pricingOptions].map((p) => {
                const on = pricingId === p.id;
                return (
                  <button
                    key={p.id ?? 'whole'}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => pickLine(p.id, p.amount)}
                    className={`flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3.5 text-left text-xs sm:text-sm transition-colors cursor-pointer ${
                      on ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink hover:border-ink'
                    }`}
                  >
                    <span className="min-w-0 break-words font-semibold">{p.label}</span>
                    <span className={`shrink-0 tabular-nums ${on ? 'text-white/80' : 'text-ink-muted'}`}>{peso(p.amount)}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-ink-muted">If they only want part of it, pick that line. You can still change the price below.</p>
          </fieldset>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Production Due Date <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Calendar
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
              />
              <input
                id="job-due-date"
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))}
                className="w-full h-11 pl-10 pr-4 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs cursor-pointer"
              />
            </div>
          </div>

          {/* Quantity — fixed: an individual order is 1 piece; a bulk order totals its size sheet (Step 2). */}
          <div>
            <label htmlFor="order-quantity" className="block text-xs font-semibold text-ink mb-1.5">
              Order Quantity (Pieces)
            </label>
            <input
              id="order-quantity"
              type="text"
              readOnly
              value={qty}
              className="w-full h-11 px-3.5 bg-sunken border border-line rounded-xl text-xs sm:text-sm font-bold text-ink cursor-default focus:outline-none shadow-2xs tabular-nums"
            />
          </div>

          {/* Item Rate */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Item Rate / Unit Price (₱)
            </label>
            <input
              type="number"
              min="0"
              step="50"
              value={itemRate}
              onChange={(e) => handleRateChange(e.target.value)}
              placeholder="e.g. 2500"
              className="w-full h-11 px-3.5 bg-surface border border-line rounded-xl text-xs sm:text-sm font-bold text-ink focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs"
            />
          </div>
        </div>

        {/* Rush Order Checkbox */}
        <div className="pt-2 border-t border-line/60 flex items-center justify-between flex-wrap gap-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_rush}
              onChange={(e) => handleRushToggle(e.target.checked)}
              className="w-4 h-4 rounded text-taupe focus:ring-taupe border-line cursor-pointer"
            />
            <div className="flex items-center gap-1.5">
              <Zap size={14} className={formData.is_rush ? 'text-amber-500 fill-amber-500' : 'text-ink-muted'} />
              <span className="text-xs font-bold text-ink">Mark as Rush Order</span>
            </div>
          </label>

          {formData.is_rush && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted">Rush Fee: ₱</span>
              <input
                type="number"
                min="0"
                value={formData.rush_fee}
                onChange={(e) => {
                  const fee = e.target.value;
                  setFormData((prev) => ({ ...prev, rush_fee: fee }));
                }}
                className="w-24 h-8 px-2 bg-surface border border-line rounded-lg text-xs font-bold text-ink"
              />
            </div>
          )}
        </div>
      </div>

      {/* Payment Terms Section */}
      <div className="space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
          Payment Terms
        </label>

        {/* Radio Selector: Full vs. Downpayment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
          <button
            type="button"
            onClick={() => {
              setPaymentTerm('full');
              setFormData((prev) => ({ ...prev, downpayment: currentTotal.toString() }));
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer shadow-2xs flex items-center gap-3 ${
              paymentTerm === 'full'
                ? 'bg-taupe/10 border-taupe ring-2 ring-taupe'
                : 'bg-surface border-line hover:bg-canvas'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                paymentTerm === 'full' ? 'border-taupe bg-taupe' : 'border-ink-muted'
              }`}
            >
              {paymentTerm === 'full' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-ink">Full Payment</p>
              <p className="text-[11px] text-ink-muted">100% settled upon order creation</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setPaymentTerm('downpayment');
              if (!formData.downpayment || formData.downpayment === currentTotal.toString()) {
                handleDepositPreset(0.5);
              }
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer shadow-2xs flex items-center gap-3 ${
              paymentTerm === 'downpayment'
                ? 'bg-taupe/10 border-taupe ring-2 ring-taupe'
                : 'bg-surface border-line hover:bg-canvas'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                paymentTerm === 'downpayment' ? 'border-taupe bg-taupe' : 'border-ink-muted'
              }`}
            >
              {paymentTerm === 'downpayment' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-ink">Downpayment / Deposit</p>
              <p className="text-[11px] text-ink-muted">Balance paid on fitting or pickup</p>
            </div>
          </button>
        </div>

        {/* Deposit input and quick presets (if downpayment selected) */}
        {paymentTerm === 'downpayment' && (
          <div className="p-4 bg-canvas/40 border border-line rounded-xl space-y-3 max-w-lg">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
                Deposit Amount (₱)
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDepositPreset(0.5)}
                  className="px-2 py-0.5 rounded bg-surface border border-line text-[11px] font-bold text-ink hover:bg-canvas shadow-2xs cursor-pointer"
                >
                  50% (₱{(currentTotal * 0.5).toLocaleString()})
                </button>
                <button
                  type="button"
                  onClick={() => handleDepositPreset(0.75)}
                  className="px-2 py-0.5 rounded bg-surface border border-line text-[11px] font-bold text-ink hover:bg-canvas shadow-2xs cursor-pointer"
                >
                  75% (₱{(currentTotal * 0.75).toLocaleString()})
                </button>
              </div>
            </div>

            <input
              type="number"
              min="0"
              max={currentTotal}
              value={formData.downpayment}
              onChange={(e) => setFormData((prev) => ({ ...prev, downpayment: e.target.value }))}
              placeholder="0.00"
              className="w-full h-11 px-3.5 bg-surface border border-line rounded-xl text-xs sm:text-sm font-bold text-ink focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs"
            />
          </div>
        )}

      </div>

      {/* SUMMARY CARD */}
      <div className="bg-[#faf8f5] border border-line/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3.5">
        <div className="flex items-center gap-2 pb-2.5 border-b border-line">
          <Receipt size={17} className="text-taupe" />
          <h3 className="font-bold text-ink text-sm sm:text-base">Order Financial Summary</h3>
        </div>

        {/* Line by line, top to bottom, so staff can read the math back to the customer. */}
        <dl className="space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between items-baseline gap-4">
            <dt className="text-ink-muted">
              Base subtotal
              {rate > 0 && (
                <span className="block sm:inline sm:ml-1.5 text-[11px] sm:text-xs tabular-nums text-ink-muted/80">
                  ({money(rate)} × {qty} {qty === 1 ? 'pc' : 'pcs'})
                </span>
              )}
            </dt>
            <dd className="tabular-nums font-semibold text-ink">{rate > 0 ? money(baseSubtotal) : '—'}</dd>
          </div>

          {rushFee > 0 && (
            <div className="flex justify-between items-baseline gap-4">
              <dt className="text-ink-muted flex items-center gap-1">
                <Zap size={12} className="text-amber-500 fill-amber-500" aria-hidden="true" /> Rush fee
              </dt>
              <dd className="tabular-nums font-semibold text-ink">+ {money(rushFee)}</dd>
            </div>
          )}

          {fabricDeduction > 0 && (
            <div className="flex justify-between items-baseline gap-4">
              <dt className="text-ink-muted">Fabric / other materials deduction</dt>
              <dd className="tabular-nums font-semibold text-ink">− {money(fabricDeduction)}</dd>
            </div>
          )}
          {fabricTooHigh && (
            <p role="alert" className="text-xs text-danger">The fabric / materials deduction is more than the price. Go back and lower it.</p>
          )}

          {/* Net Total */}
          <div className="flex justify-between items-baseline gap-4 pt-2 border-t border-line">
            <dt className="font-semibold text-ink">Net Total Order Amount</dt>
            <dd className="text-sm sm:text-base font-bold text-ink tabular-nums">{money(currentTotal)}</dd>
          </div>

          {/* Amount Paid / Due Now */}
          <div className="flex justify-between items-baseline gap-4">
            <dt className="text-emerald-800 font-semibold">
              Paid now
              <span className="block sm:inline sm:ml-1.5 text-[11px] sm:text-xs font-normal text-emerald-800/80">
                {paymentTerm === 'full'
                  ? '(Full payment)'
                  : `(Downpayment / Deposit${currentTotal > 0 && currentDeposit > 0 ? `, ${Math.round((currentDeposit / currentTotal) * 100)}%` : ''})`}
              </span>
            </dt>
            <dd className="text-sm sm:text-base font-bold text-emerald-700 tabular-nums">− {money(currentDeposit)}</dd>
          </div>
        </dl>

        <div className="space-y-2 text-xs sm:text-sm">
          {/* Remaining Balance */}
          <div className="flex justify-between items-center pt-2 border-t border-line font-bold">
            <span className="text-ink">Remaining Balance Due</span>
            <span
              className={`text-base sm:text-lg font-black ${
                remainingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              {remainingBalance > 0 ? money(remainingBalance) : 'Fully Settled (₱0.00)'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="pt-4 border-t border-line flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="h-11 px-5 rounded-xl border border-line bg-surface hover:bg-canvas text-ink text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="h-12 px-8 rounded-xl bg-taupe hover:bg-taupe-hover text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Creating Job Order...</span>
            </>
          ) : (
            <>
              <Check size={18} className="stroke-[2.5]" />
              <span>Create Job Order</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
