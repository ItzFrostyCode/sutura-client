'use client';

import React, { useState, useEffect, useId } from 'react';
import { 
  Tag, 
  Percent, 
  Sparkles, 
  Calculator, 
  ArrowRight, 
  AlertCircle, 
  X,
  Loader2,
  Check
} from 'lucide-react';
import Modal from '@/components/Modal';
import { CatalogOrder } from './orderHelpers';
import { getMediaUrl } from '@/lib/media';

interface OrderDiscountModalProps {
  readonly order: CatalogOrder | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onApplyDiscount: (orderId: number, amount: number, reason: string) => Promise<void>;
  readonly isSubmitting?: boolean;
}

const peso = (v: string | number | null | undefined) =>
  `₱${Number(v ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface PresetReason {
  id: string;
  label: string;
  emoji: string;
  defaultPercent?: number;
  reasonText: string;
}

const QUICK_REASONS: PresetReason[] = [
  { id: 'senior', label: 'Senior Citizen', emoji: '👵', defaultPercent: 20, reasonText: 'Senior Citizen Discount (20%)' },
  { id: 'pwd', label: 'PWD', emoji: '♿', defaultPercent: 20, reasonText: 'PWD Statutory Discount (20%)' },
  { id: 'student', label: 'Student', emoji: '🎓', defaultPercent: 10, reasonText: 'Student Privilege Discount' },
  { id: 'suki', label: 'Suki / VIP', emoji: '⭐', defaultPercent: 10, reasonText: 'Suki Loyalty Courtesy Discount' },
  { id: 'promo', label: 'Store Promo', emoji: '🏷️', reasonText: 'Special In-Store Promotional Discount' },
  { id: 'family', label: 'Friend & Family', emoji: '🤝', defaultPercent: 15, reasonText: 'Friends & Family Courtesy' },
  { id: 'clearance', label: 'Minor Clearance', emoji: '✂️', reasonText: 'Display / Clearance Courtesy Discount' },
];

export default function OrderDiscountModal({
  order,
  isOpen,
  onClose,
  onApplyDiscount,
  isSubmitting = false,
}: OrderDiscountModalProps) {
  const currentTotal = Number(order?.total_amount ?? 0);

  const [mode, setMode] = useState<'amount' | 'percent'>('amount');
  const [amountInput, setAmountInput] = useState('');
  const [percentInput, setPercentInput] = useState('');
  const [reason, setReason] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  // Sync inputs on open
  useEffect(() => {
    if (isOpen) {
      setAmountInput('');
      setPercentInput('');
      setReason('');
      setSelectedTagId(null);
      setMode('amount');
    }
  }, [isOpen, order]);

  if (!order) return null;

  // Calculate discount and new total
  let computedDiscount = 0;
  if (mode === 'amount') {
    computedDiscount = Math.max(0, Number(amountInput) || 0);
  } else {
    const pct = Math.max(0, Number(percentInput) || 0);
    computedDiscount = Math.round((currentTotal * (pct / 100)) * 100) / 100;
  }

  const newTotal = Math.max(0, currentTotal - computedDiscount);
  const effectivePercent = currentTotal > 0 ? ((computedDiscount / currentTotal) * 100).toFixed(1) : '0';
  const isOverTotal = computedDiscount > currentTotal;
  const isValid = computedDiscount > 0 && !isOverTotal && !isSubmitting;

  const handleSelectPresetReason = (item: PresetReason) => {
    setSelectedTagId(item.id);
    setReason(item.reasonText);

    // If preset has standard statutory or suggested percent, auto-apply it!
    if (item.defaultPercent) {
      setMode('percent');
      setPercentInput(String(item.defaultPercent));
      const calcAmount = Math.round((currentTotal * (item.defaultPercent / 100)) * 100) / 100;
      setAmountInput(String(calcAmount));
    }
  };

  const handleSelectPercentQuick = (pct: number) => {
    setMode('percent');
    setPercentInput(String(pct));
    const calcAmount = Math.round((currentTotal * (pct / 100)) * 100) / 100;
    setAmountInput(String(calcAmount));
  };

  const handleSelectAmountQuick = (amt: number) => {
    setMode('amount');
    setAmountInput(String(amt));
    if (currentTotal > 0) {
      setPercentInput(((amt / currentTotal) * 100).toFixed(1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    await onApplyDiscount(order.id, computedDiscount, reason.trim());
  };

  const rawImage = order.catalog_item?.images?.[0]?.image_url;
  const imageUrl = rawImage ? getMediaUrl(rawImage) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-ink">
          <Tag className="text-rose-600 shrink-0" size={18} />
          <span className="font-bold">Apply Discount — Order #ORD-{order.id}</span>
        </div>
      }
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── 1. ORDER SUMMARY HEADER ───────────────────────────────── */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-canvas/60 border border-line flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-14 rounded-xl bg-surface border border-line overflow-hidden shrink-0 flex items-center justify-center">
              {imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={imageUrl} alt={order.catalog_item?.name || 'Garment'} className="w-full h-full object-cover" />
              ) : (
                <Tag className="text-ink-faint opacity-40" size={20} />
              )}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-ink text-xs sm:text-sm truncate">
                {order.catalog_item?.name || 'Showroom Garment'}
              </h4>
              <p className="text-[11px] text-ink-muted truncate">
                Customer: <span className="font-semibold text-ink">{order.customer?.name || 'Walk-in Guest'}</span>
                {order.selected_size && <span> • Size {order.selected_size}</span>}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-ink-faint block">
              Current Total
            </span>
            <span className="font-mono font-bold text-sm sm:text-base text-ink">
              {peso(currentTotal)}
            </span>
          </div>
        </div>

        {/* ── 2. QUICK REASON / CUSTOMER TAG PILLS ─────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
              Select Tag / Reason <span className="text-ink-faint font-normal">(Click or Type)</span>
            </label>
            {selectedTagId && (
              <button
                type="button"
                onClick={() => { setSelectedTagId(null); setReason(''); }}
                className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
              >
                Clear Tag
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {QUICK_REASONS.map((item) => {
              const isSelected = selectedTagId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectPresetReason(item)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-200/60 font-bold shadow-2xs'
                      : 'bg-surface hover:bg-canvas text-ink-body border-line hover:border-ink-muted/40'
                  }`}
                >
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                  {item.defaultPercent && (
                    <span className={`text-[10px] px-1 py-0.2 rounded-md ${
                      isSelected ? 'bg-rose-200/70 text-rose-900 font-bold' : 'bg-canvas text-ink-muted'
                    }`}>
                      {item.defaultPercent}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Editable Reason Input */}
          <input
            type="text"
            placeholder="Type specific reason or suki note..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setSelectedTagId(null);
            }}
            className="w-full bg-surface border border-line rounded-xl px-3.5 py-2 text-xs sm:text-sm text-ink focus:outline-none focus:border-taupe transition-colors"
          />
        </div>

        {/* ── 3. DISCOUNT INPUT WITH TOGGLE & QUICK PILLS ──────────── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
              Discount Amount
            </label>
            
            {/* Amount / Percent Toggle */}
            <div className="flex items-center p-0.5 bg-canvas border border-line rounded-xl">
              <button
                type="button"
                onClick={() => setMode('amount')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'amount'
                    ? 'bg-surface text-ink shadow-2xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Fixed (₱)
              </button>
              <button
                type="button"
                onClick={() => setMode('percent')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'percent'
                    ? 'bg-surface text-ink shadow-2xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Percentage (%)
              </button>
            </div>
          </div>

          {/* Input Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted font-bold text-sm">
              {mode === 'amount' ? '₱' : '%'}
            </div>
            {mode === 'amount' ? (
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={currentTotal}
                required
                placeholder="0.00"
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  if (currentTotal > 0 && e.target.value) {
                    setPercentInput(((Number(e.target.value) / currentTotal) * 100).toFixed(1));
                  }
                }}
                className="w-full pl-8 pr-4 py-2.5 bg-surface border border-line rounded-xl text-base font-bold font-mono text-ink focus:outline-none focus:border-taupe transition-colors shadow-2xs"
              />
            ) : (
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                required
                placeholder="e.g. 20"
                value={percentInput}
                onChange={(e) => {
                  setPercentInput(e.target.value);
                  if (currentTotal > 0 && e.target.value) {
                    const calcAmount = Math.round((currentTotal * (Number(e.target.value) / 100)) * 100) / 100;
                    setAmountInput(String(calcAmount));
                  }
                }}
                className="w-full pl-8 pr-4 py-2.5 bg-surface border border-line rounded-xl text-base font-bold font-mono text-ink focus:outline-none focus:border-taupe transition-colors shadow-2xs"
              />
            )}
          </div>

          {/* Quick Percentage / Amount Shortcuts */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-ink-faint font-medium mr-1">Quick:</span>
            {[5, 10, 15, 20, 25].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handleSelectPercentQuick(pct)}
                className={`px-2 py-0.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  mode === 'percent' && Number(percentInput) === pct
                    ? 'bg-taupe text-white border-taupe'
                    : 'bg-canvas hover:bg-surface text-ink-body border-line'
                }`}
              >
                {pct}%
              </button>
            ))}
            <span className="text-ink-faint text-xs mx-0.5">|</span>
            {[50, 100, 200, 500].filter(amt => amt < currentTotal).map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleSelectAmountQuick(amt)}
                className={`px-2 py-0.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  mode === 'amount' && Number(amountInput) === amt
                    ? 'bg-taupe text-white border-taupe'
                    : 'bg-canvas hover:bg-surface text-ink-body border-line'
                }`}
              >
                ₱{amt}
              </button>
            ))}
          </div>
        </div>

        {/* ── 4. AUTO-CALCULATION LIVE BREAKDOWN CARD ──────────────── */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isOverTotal 
            ? 'bg-rose-50/70 border-rose-300 text-rose-900' 
            : computedDiscount > 0
            ? 'bg-emerald-50/40 border-emerald-200'
            : 'bg-canvas/50 border-line text-ink-muted'
        }`}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-ink-muted">Original Total:</span>
            <span className="font-mono font-medium text-ink">{peso(currentTotal)}</span>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-rose-600 mb-2 pb-2 border-b border-line/60">
            <span className="flex items-center gap-1">
              <span>Less Discount:</span>
              {computedDiscount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                  {effectivePercent}% off
                </span>
              )}
            </span>
            <span className="font-mono">
              -{peso(computedDiscount)}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint block">
                New Amount to Pay
              </span>
              {computedDiscount > 0 && !isOverTotal && (
                <span className="text-[11px] font-semibold text-emerald-700">
                  Customer saves {peso(computedDiscount)}
                </span>
              )}
            </div>

            <div className="text-right">
              <span className={`text-lg sm:text-xl font-black font-mono tracking-tight ${
                isOverTotal ? 'text-rose-600' : 'text-emerald-700'
              }`}>
                {peso(newTotal)}
              </span>
            </div>
          </div>

          {isOverTotal && (
            <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-rose-200 text-xs text-rose-700 font-semibold">
              <AlertCircle size={14} className="shrink-0" />
              <span>Discount cannot exceed the total order amount ({peso(currentTotal)}).</span>
            </div>
          )}
        </div>

        {/* ── 5. MODAL FOOTER ──────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-line rounded-xl text-xs font-semibold text-ink-muted hover:text-ink hover:bg-canvas transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={!isValid}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Applying Discount...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Apply {computedDiscount > 0 ? `₱${computedDiscount.toLocaleString()} ` : ''}Discount</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
