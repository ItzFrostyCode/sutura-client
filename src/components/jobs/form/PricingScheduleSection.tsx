'use client';

import React, { useState } from 'react';
import { Receipt, Tag, Sparkles, X, Check, ArrowDownRight, Percent } from 'lucide-react';
import CollapsibleSection from '@/components/jobs/CollapsibleSection';
import { JobCreateFormData, ServiceData } from './types';

interface PricingScheduleSectionProps {
  readonly formData: JobCreateFormData;
  readonly setFormData: React.Dispatch<React.SetStateAction<JobCreateFormData>>;
  readonly selectedService?: ServiceData;
  readonly isCustomTailoring: boolean;
  readonly isTotalAmountCustom: boolean;
  readonly setIsTotalAmountCustom: (custom: boolean) => void;
  readonly setIsDueDateCustom: (custom: boolean) => void;
}

const DISCOUNT_PRESETS = [
  { label: '🌟 Suki Customer', type: 'percent', value: 10, reason: 'Suki Customer' },
  { label: '🎓 Student (10%)', type: 'percent', value: 10, reason: 'Student' },
  { label: '🧓 Senior / PWD (20%)', type: 'percent', value: 20, reason: 'Senior / PWD' },
  { label: '🤝 Tawad / Negotiated', type: 'fixed', value: 200, reason: 'Negotiated / Tawad' },
  { label: '🏷️ Promo / Bundle (15%)', type: 'percent', value: 15, reason: 'Promo' },
];

export default function PricingScheduleSection({
  formData,
  setFormData,
  selectedService,
  isCustomTailoring,
  setIsTotalAmountCustom,
  setIsDueDateCustom,
}: PricingScheduleSectionProps) {
  const [showDiscount, setShowDiscount] = useState(() => Number(formData.discount_amount || '0') > 0);
  const [discountMode, setDiscountMode] = useState<'fixed' | 'percent'>('fixed');
  const [discountVal, setDiscountVal] = useState<string>(formData.discount_amount || '');
  const [discountReason, setDiscountReason] = useState<string>(formData.discount_reason || '');

  const rushFee = formData.is_rush ? (Number.parseFloat(formData.rush_fee) || 0) : 0;
  const currentTotal = Number.parseFloat(formData.total_amount) || 0;
  const currentDiscount = Number.parseFloat(formData.discount_amount || '0') || 0;

  // Base subtotal before discount and rush fee
  const getSubtotal = () => {
    const derived = (currentTotal + currentDiscount) - rushFee;
    if (derived > 0) return derived;
    if (selectedService?.base_price) return Number.parseFloat(selectedService.base_price.toString());
    return currentTotal;
  };

  const subtotal = getSubtotal();

  const handleApplyPreset = (pct: number) => {
    const total = Number.parseFloat(formData.total_amount) || 0;
    if (total > 0) {
      const amt = (total * pct).toFixed(2);
      setFormData((prev) => ({ ...prev, downpayment: amt }));
    }
  };

  const applyPresetDiscount = (preset: typeof DISCOUNT_PRESETS[0]) => {
    setShowDiscount(true);
    setDiscountMode(preset.type as 'fixed' | 'percent');
    setDiscountVal(preset.value.toString());
    setDiscountReason(preset.reason);

    const calculatedDiscount = preset.type === 'percent'
      ? (subtotal * preset.value) / 100
      : preset.value;

    const netTotal = Math.max(0, subtotal + rushFee - calculatedDiscount);
    setIsTotalAmountCustom(true);
    setFormData((prev) => ({
      ...prev,
      total_amount: netTotal.toFixed(2),
      discount_amount: calculatedDiscount > 0 ? calculatedDiscount.toFixed(2) : '0',
      discount_reason: preset.reason,
    }));
  };

  const handleDiscountValueChange = (valStr: string, mode: 'fixed' | 'percent') => {
    setDiscountVal(valStr);
    const val = Number.parseFloat(valStr) || 0;
    const calculatedDiscount = mode === 'percent' ? (subtotal * val) / 100 : val;
    const netTotal = Math.max(0, subtotal + rushFee - calculatedDiscount);
    setIsTotalAmountCustom(true);
    setFormData((prev) => ({
      ...prev,
      total_amount: netTotal.toFixed(2),
      discount_amount: calculatedDiscount > 0 ? calculatedDiscount.toFixed(2) : '0',
    }));
  };

  const handleRemoveDiscount = () => {
    setShowDiscount(false);
    setDiscountVal('');
    setDiscountReason('');
    const netTotal = subtotal + rushFee;
    setFormData((prev) => ({
      ...prev,
      total_amount: netTotal > 0 ? netTotal.toFixed(2) : prev.total_amount,
      discount_amount: '0',
      discount_reason: '',
    }));
  };

  const renderBalanceBadge = () => {
    const total = Number.parseFloat(formData.total_amount) || 0;
    const down = Number.parseFloat(formData.downpayment) || 0;

    if (total <= 0) {
      return (
        <span className="text-[9px] bg-zinc-100 text-zinc-600 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
          —
        </span>
      );
    }

    if (down >= total) {
      return (
        <span className="text-[9px] bg-green-100 text-green-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
          Paid
        </span>
      );
    }

    if (down > 0) {
      return (
        <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
          Partial
        </span>
      );
    }

    return (
      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
        Unpaid
      </span>
    );
  };

  return (
    <CollapsibleSection
      icon={<Receipt size={16} className="text-sage" />}
      iconBoxClassName="bg-sage/10 border border-sage/20"
      title="Timeline & Invoice Summary"
      defaultOpen
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="due_date"
            className="block text-xs font-semibold text-ink-muted mb-1 uppercase tracking-wider"
          >
            Due Date {isCustomTailoring && <span className="text-danger">*</span>}
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <input
                id="due_date"
                type="date"
                required={isCustomTailoring}
                value={formData.due_date}
                onChange={(e) => {
                  setIsDueDateCustom(true);
                  setFormData((prev) => ({ ...prev, due_date: e.target.value }));
                }}
                className="w-full bg-canvas border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                min={new Date().toISOString().split('T')[0]}
              />
              {(() => {
                if (formData.is_rush || !selectedService?.estimated_days || !formData.due_date) return null;
                const minDueDate = new Date();
                minDueDate.setDate(minDueDate.getDate() + selectedService.estimated_days);
                const picked = new Date(formData.due_date + 'T00:00:00');
                if (picked >= minDueDate) return null;
                return (
                  <p className="text-[11px] text-amber-700 mt-1">
                    {selectedService.name} usually takes {selectedService.estimated_days} days — this date is sooner than that. If it genuinely needs to be faster, check &quot;Rush Order&quot; below so staff know it&apos;s a priority.
                  </p>
                );
              })()}
            </div>
            <label
              className="flex items-center gap-2 cursor-pointer select-none shrink-0 sm:h-[38px] sm:mt-0 mt-1"
              title="Owner/Manager Only — Priority is set during Job Order approval, not Front-Desk intake"
            >
              <input
                type="checkbox"
                checked={formData.is_rush}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, is_rush: e.target.checked }))
                }
                className="rounded border-line text-taupe focus:ring-taupe"
              />
              <span className="text-sm font-semibold text-ink-body">Mark as Rush Order</span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Owner/Manager Only
              </span>
            </label>
          </div>
        </div>

        {/* Rush Order Details */}
        <div>
          {formData.is_rush && (
            <div>
              <label
                htmlFor="rush_fee"
                className="block text-xs font-semibold text-ink-muted mb-1 uppercase tracking-wider"
              >
                Rush Fee (₱) <span className="text-danger">*</span>
              </label>
              <input
                id="rush_fee"
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.rush_fee}
                onChange={(e) => {
                  const fee = e.target.value;
                  setFormData((prev) => ({ ...prev, rush_fee: fee }));
                }}
                placeholder="0.00"
                className="w-full bg-canvas border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
              />
              <p className="text-[10px] text-ink-muted mt-1">
                This fee is automatically added to the Total Amount.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Customer Discount / Tawad / Suki Privileges Panel ── */}
      <div className="mt-4 p-4 rounded-xl bg-canvas/40 border border-line space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-taupe/10 flex items-center justify-center text-taupe">
              <Tag size={13} />
            </div>
            <span className="text-xs font-bold text-ink uppercase tracking-wider">
              Customer Discount / Suki Privileges / Tawad
            </span>
          </div>
          {!showDiscount ? (
            <button
              type="button"
              onClick={() => setShowDiscount(true)}
              className="text-xs font-bold text-taupe hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles size={12} />
              <span>Apply Discount</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRemoveDiscount}
              className="text-xs font-bold text-danger hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X size={12} />
              <span>Remove Discount</span>
            </button>
          )}
        </div>

        {showDiscount && (
          <div className="space-y-3 pt-1">
            {/* Quick Presets */}
            <div>
              <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block mb-1.5">
                Quick Preset Chips (Click to apply):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DISCOUNT_PRESETS.map((preset) => {
                  const isSelected =
                    discountReason === preset.reason ||
                    (preset.type === 'percent' && discountMode === 'percent' && discountVal === preset.value.toString());
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPresetDiscount(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-taupe text-white border-taupe shadow-2xs'
                          : 'bg-surface border-line hover:border-taupe/50 text-ink'
                      }`}
                    >
                      {isSelected && <Check size={11} className="stroke-[3]" />}
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Discount Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-ink-muted uppercase">
                    Discount Mode
                  </label>
                </div>
                <div className="flex rounded-lg border border-line p-0.5 bg-canvas">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountMode('fixed');
                      handleDiscountValueChange(discountVal, 'fixed');
                    }}
                    className={`flex-1 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      discountMode === 'fixed'
                        ? 'bg-surface text-ink shadow-2xs'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    ₱ Fixed
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountMode('percent');
                      handleDiscountValueChange(discountVal, 'percent');
                    }}
                    className={`flex-1 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      discountMode === 'percent'
                        ? 'bg-surface text-ink shadow-2xs'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    % Percent
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-muted mb-1 uppercase">
                  {discountMode === 'percent' ? 'Discount Rate (%)' : 'Discount Amount (₱)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step={discountMode === 'percent' ? '1' : '0.01'}
                    value={discountVal}
                    onChange={(e) => handleDiscountValueChange(e.target.value, discountMode)}
                    placeholder={discountMode === 'percent' ? '10' : '200.00'}
                    className="w-full bg-canvas border border-line rounded-lg px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                  />
                  {discountMode === 'percent' && (
                    <span className="absolute right-2.5 top-2 text-xs font-bold text-ink-muted">
                      %
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-muted mb-1 uppercase">
                  Discount Reason / Customer Tag
                </label>
                <input
                  type="text"
                  value={discountReason}
                  onChange={(e) => {
                    const r = e.target.value;
                    setDiscountReason(r);
                    setFormData((prev) => ({ ...prev, discount_reason: r }));
                  }}
                  placeholder="e.g. Suki, Student, Tawad"
                  className="w-full bg-canvas border border-line rounded-lg px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                />
              </div>
            </div>

            {/* Calculated discount callout */}
            {currentDiscount > 0 && (
              <div className="flex items-center justify-between text-xs bg-sage/10 border border-sage/20 rounded-lg px-3 py-2 text-sage font-medium">
                <span className="flex items-center gap-1.5">
                  <ArrowDownRight size={14} className="shrink-0" />
                  <span>
                    Applied Discount: <strong>-₱{currentDiscount.toFixed(2)}</strong>
                    {discountReason ? ` (${discountReason})` : ''}
                  </span>
                </span>
                <span className="text-[11px] opacity-80">
                  Subtotal adjusted automatically below
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Financial Invoice Box */}
      <div className="space-y-4 mt-2">
        <span className="text-xs font-bold text-ink-muted uppercase tracking-wider block border-b border-line pb-2">
          Invoice & Balance Summary
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {/* Total Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="total_amount"
                className="block text-xs font-semibold text-ink-muted uppercase tracking-wider"
              >
                Net Total Amount (₱) <span className="text-danger">*</span>
              </label>
              {subtotal > 0 && (
                <span className="text-[10px] text-ink-muted font-mono">
                  Base: ₱{subtotal.toFixed(2)}
                </span>
              )}
            </div>
            <input
              id="total_amount"
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.total_amount}
              onChange={(e) => {
                setIsTotalAmountCustom(true);
                setFormData((prev) => ({ ...prev, total_amount: e.target.value }));
              }}
              className="w-full bg-canvas border border-line rounded-lg px-3 py-2 text-sm text-ink font-semibold focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
              placeholder="0.00"
            />
            {currentDiscount > 0 && (
              <p className="text-[10px] text-sage mt-1 font-semibold">
                ✓ Reflects ₱{currentDiscount.toFixed(2)} discount applied from original price.
              </p>
            )}
          </div>

          {/* Downpayment Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="downpayment"
                className="block text-xs font-semibold text-ink-muted uppercase tracking-wider"
              >
                Downpayment (₱)
              </label>
              {Number.parseFloat(formData.total_amount || '0') > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(0.5)}
                    className="text-[10px] font-bold text-ink-muted hover:text-taupe px-1 py-0.5 rounded bg-canvas border border-line cursor-pointer"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(0.75)}
                    className="text-[10px] font-bold text-ink-muted hover:text-taupe px-1 py-0.5 rounded bg-canvas border border-line cursor-pointer"
                  >
                    75%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(1)}
                    className="text-[10px] font-bold text-ink-muted hover:text-taupe px-1 py-0.5 rounded bg-canvas border border-line cursor-pointer"
                  >
                    Full
                  </button>
                </div>
              )}
            </div>
            <input
              id="downpayment"
              type="number"
              min="0"
              step="0.01"
              value={formData.downpayment}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, downpayment: e.target.value }))
              }
              className="w-full bg-canvas border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
              placeholder="0.00"
            />
            {(Number.parseFloat(formData.downpayment) || 0) > (Number.parseFloat(formData.total_amount) || 0) && (
              <p className="text-[10px] text-sage mt-1 font-semibold">
                Change Due: ₱
                {(
                  (Number.parseFloat(formData.downpayment) || 0) -
                  (Number.parseFloat(formData.total_amount) || 0)
                ).toFixed(2)}{' '}
                — only ₱{Number.parseFloat(formData.total_amount || '0').toFixed(2)} will be applied to the job.
              </p>
            )}
          </div>

          {/* Remaining Balance card */}
          <div>
            <span className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Remaining Balance
            </span>
            <div className="w-full bg-canvas border border-line rounded-lg px-3 flex items-center justify-between h-[38px] select-none">
              <span className="font-bold text-sm text-ink">
                ₱
                {Math.max(
                  0,
                  (Number.parseFloat(formData.total_amount) || 0) -
                    Math.min(
                      Number.parseFloat(formData.downpayment) || 0,
                      Number.parseFloat(formData.total_amount) || 0
                    )
                ).toFixed(2)}
              </span>
              {renderBalanceBadge()}
            </div>
          </div>
        </div>

        {/* Transparent Financial Ledger Summary */}
        <div className="p-3 bg-canvas/30 rounded-xl border border-line/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-4 text-ink-muted">
            <span>Base: <strong className="text-ink">₱{subtotal.toFixed(2)}</strong></span>
            {formData.is_rush && rushFee > 0 && (
              <span>Rush: <strong className="text-amber-700">+₱{rushFee.toFixed(2)}</strong></span>
            )}
            {currentDiscount > 0 && (
              <span>Discount: <strong className="text-sage">-₱{currentDiscount.toFixed(2)}</strong></span>
            )}
          </div>
          <div className="text-ink">
            Net Payable: <strong className="text-sm font-bold text-taupe">₱{(Number.parseFloat(formData.total_amount) || 0).toFixed(2)}</strong>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
