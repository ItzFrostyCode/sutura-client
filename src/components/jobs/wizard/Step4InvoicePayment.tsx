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
  paymentTerm: 'full' | 'downpayment';
  setPaymentTerm: (term: 'full' | 'downpayment') => void;
  submitting: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function Step4InvoicePayment({
  formData,
  setFormData,
  itemRate,
  setItemRate,
  paymentTerm,
  setPaymentTerm,
  submitting,
  onBack,
  onSubmit,
}: Step4InvoicePaymentProps) {
  const qty = Math.max(1, parseInt(formData.quantity, 10) || 1);
  const rate = parseFloat(itemRate) || 0;
  const rushFee = formData.is_rush ? parseFloat(formData.rush_fee) || 0 : 0;

  // Total calculation
  const computedNetTotal = rate > 0 ? (rate * qty + rushFee).toFixed(2) : formData.total_amount;
  const currentTotal = parseFloat(formData.total_amount || computedNetTotal || '0') || 0;

  const currentDeposit = paymentTerm === 'full'
    ? currentTotal
    : parseFloat(formData.downpayment || '0') || 0;

  const remainingBalance = Math.max(0, currentTotal - currentDeposit);

  const handleRateChange = (newRate: string) => {
    setItemRate(newRate);
    const parsedRate = parseFloat(newRate) || 0;
    const newTotal = parsedRate > 0 ? (parsedRate * qty + rushFee).toFixed(2) : formData.total_amount;
    setFormData((prev) => ({
      ...prev,
      total_amount: newTotal,
      downpayment: paymentTerm === 'full' ? newTotal : prev.downpayment,
    }));
  };

  const handleQtyChange = (newQty: string) => {
    setFormData((prev) => {
      const q = Math.max(1, parseInt(newQty, 10) || 1);
      const newTotal = rate > 0 ? (rate * q + rushFee).toFixed(2) : prev.total_amount;
      return {
        ...prev,
        quantity: newQty,
        total_amount: newTotal,
        downpayment: paymentTerm === 'full' ? newTotal : prev.downpayment,
      };
    });
  };

  const handleRushToggle = (checked: boolean) => {
    setFormData((prev) => {
      const nextRush = checked;
      const fee = nextRush ? (parseFloat(prev.rush_fee) || 200) : 0;
      const newTotal = rate > 0 ? (rate * qty + fee).toFixed(2) : prev.total_amount;
      return {
        ...prev,
        is_rush: nextRush,
        rush_fee: nextRush ? (prev.rush_fee || '200') : '',
        total_amount: newTotal,
      };
    });
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
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))}
                className="w-full h-11 pl-10 pr-4 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs cursor-pointer"
              />
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Order Quantity (Pieces)
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => handleQtyChange(e.target.value)}
              placeholder="1"
              className="w-full h-11 px-3.5 bg-surface border border-line rounded-xl text-xs sm:text-sm font-bold text-ink focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs"
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
                  setFormData((prev) => {
                    const parsedFee = parseFloat(fee) || 0;
                    const newTot = rate > 0 ? (rate * qty + parsedFee).toFixed(2) : prev.total_amount;
                    return { ...prev, rush_fee: fee, total_amount: newTot };
                  });
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

        <div className="space-y-2 text-xs sm:text-sm">
          {/* Net Total */}
          <div className="flex justify-between items-center text-ink-muted">
            <span>Net Total Order Amount:</span>
            <span className="text-sm sm:text-base font-bold text-ink">
              ₱{currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Amount Paid / Due Now */}
          <div className="flex justify-between items-center text-emerald-800 font-semibold">
            <span>Amount Paid / Due Now:</span>
            <span className="text-sm sm:text-base font-bold text-emerald-700">
              ₱{currentDeposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Remaining Balance */}
          <div className="flex justify-between items-center pt-2 border-t border-line font-bold">
            <span className="text-ink">Remaining Balance Due:</span>
            <span
              className={`text-base sm:text-lg font-black ${
                remainingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              {remainingBalance > 0
                ? `₱${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : 'Fully Settled (₱0.00)'}
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
