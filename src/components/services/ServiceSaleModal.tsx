import React, { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import { Loader2, Tag } from 'lucide-react';
import { Service } from './serviceHelpers';
import { getActiveSale } from '@/lib/salePricing';

interface ServiceSaleModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly service: Service | null;
  readonly onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  readonly isSubmitting: boolean;
  readonly error: string;
}

const defaultForm = { discountType: 'percent' as 'percent' | 'fixed', discountValue: '', startDate: '', endDate: '' };

export default function ServiceSaleModal({
  isOpen, onClose, service, onSubmit, isSubmitting, error,
}: ServiceSaleModalProps) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (!isOpen || !service) return;
    const activeSale = getActiveSale({ price: service.base_price ?? 0, sale_price: service.sale_price, sale_starts_at: service.sale_starts_at, sale_ends_at: service.sale_ends_at });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      discountType: activeSale ? 'fixed' : 'percent',
      discountValue: activeSale ? String(activeSale.sale) : '',
      startDate: service.sale_starts_at ? service.sale_starts_at.slice(0, 10) : '',
      endDate: service.sale_ends_at ? service.sale_ends_at.slice(0, 10) : '',
    });
  }, [isOpen, service]);

  if (!service) return null;

  const { discountType, discountValue, startDate, endDate } = form;
  const setDiscountType = (v: 'percent' | 'fixed') => setForm(prev => ({ ...prev, discountType: v }));
  const setDiscountValue = (v: string) => setForm(prev => ({ ...prev, discountValue: v }));
  const setStartDate = (v: string) => setForm(prev => ({ ...prev, startDate: v }));
  const setEndDate = (v: string) => setForm(prev => ({ ...prev, endDate: v }));

  const originalPrice = Number(service.base_price) || 0;
  const parsedValue = Number.parseFloat(discountValue);
  const hasValidValue = discountValue.trim() !== '' && !Number.isNaN(parsedValue) && parsedValue > 0;

  let previewSalePrice: number | null = null;
  if (hasValidValue) {
    previewSalePrice = discountType === 'percent'
      ? originalPrice * (1 - Math.min(parsedValue, 100) / 100)
      : parsedValue;
    previewSalePrice = Math.max(0, Math.round(previewSalePrice * 100) / 100);
  }
  const isValidSale = previewSalePrice !== null && previewSalePrice < originalPrice && originalPrice > 0;

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isValidSale) return;
    onSubmit({
      sale_price: previewSalePrice,
      sale_starts_at: startDate || null,
      sale_ends_at: endDate || null,
    });
  };

  const handleRemoveSale = () => {
    onSubmit({ sale_price: null, sale_starts_at: null, sale_ends_at: null });
  };

  const currentlyHasSale = service.sale_price != null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set Sale Price">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <p className="text-sm text-ink-body">
          <span className="font-semibold">{service.name}</span> — Base Price: {originalPrice > 0 ? `₱${originalPrice.toLocaleString()}` : 'Not set'}
        </p>

        {originalPrice <= 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            This service has no Starting Price set, so there&apos;s nothing to discount from. Set a Starting Price first.
          </p>
        ) : (
          <>
            <div>
              <span className="block text-sm font-medium text-ink-body mb-1">Discount Type</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountType('percent')}
                  className={`py-2 rounded-lg border text-sm font-semibold transition-all ${
                    discountType === 'percent' ? 'border-taupe bg-taupe/10 text-taupe' : 'border-line text-ink-body hover:border-taupe/40'
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed')}
                  className={`py-2 rounded-lg border text-sm font-semibold transition-all ${
                    discountType === 'fixed' ? 'border-taupe bg-taupe/10 text-taupe' : 'border-line text-ink-body hover:border-taupe/40'
                  }`}
                >
                  Exact Price (₱)
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="service_discount_value" className="block text-sm font-medium text-ink-body mb-1">
                {discountType === 'percent' ? 'Discount Percentage' : 'Sale Price'}
              </label>
              <input
                id="service_discount_value"
                type="number"
                min="0"
                max={discountType === 'percent' ? 100 : undefined}
                step={discountType === 'percent' ? 1 : 0.01}
                value={discountValue}
                onChange={e => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percent' ? 'e.g. 20' : `e.g. ${(originalPrice * 0.8).toFixed(0)}`}
                className="w-full bg-canvas border border-line rounded-lg px-4 py-2 text-ink focus:outline-none focus:border-taupe"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="service_sale_start" className="block text-sm font-medium text-ink-body mb-1">
                  Starts <span className="text-xs font-normal text-ink-faint">(optional)</span>
                </label>
                <input
                  id="service_sale_start"
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-canvas border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe"
                />
              </div>
              <div>
                <label htmlFor="service_sale_end" className="block text-sm font-medium text-ink-body mb-1">
                  Ends <span className="text-xs font-normal text-ink-faint">(optional — blank = no limit)</span>
                </label>
                <input
                  id="service_sale_end"
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  min={startDate || undefined}
                  className="w-full bg-canvas border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe"
                />
              </div>
            </div>

            {hasValidValue && (
              <div className={`rounded-xl p-4 flex items-center justify-between ${isValidSale ? 'bg-rose-50 border border-rose-200' : 'bg-zinc-100 border border-zinc-200'}`}>
                <div className="flex items-center gap-2">
                  <Tag size={16} className={isValidSale ? 'text-rose-600' : 'text-zinc-400'} />
                  <div>
                    <p className="text-xs text-ink-muted">Customer will see</p>
                    <p className="text-sm">
                      <span className="line-through text-ink-faint mr-2">₱{originalPrice.toLocaleString()}</span>
                      <span className={`font-bold ${isValidSale ? 'text-rose-700' : 'text-zinc-500'}`}>
                        ₱{(previewSalePrice ?? 0).toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>
                {isValidSale ? (
                  <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded-full">
                    {Math.round(((originalPrice - (previewSalePrice ?? 0)) / originalPrice) * 100)}% OFF
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-zinc-500">Must be lower than base price</span>
                )}
              </div>
            )}
          </>
        )}

        <div className="pt-2 flex justify-between gap-3">
          {currentlyHasSale ? (
            <button
              type="button"
              onClick={handleRemoveSale}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
            >
              Remove Sale
            </button>
          ) : <span />}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-ink-body hover:bg-sunken transition-colors">Cancel</button>
            <button
              type="submit"
              disabled={isSubmitting || !isValidSale}
              className="bg-taupe hover:bg-taupe/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              Save Sale
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
