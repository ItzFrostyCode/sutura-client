'use client';

import React from 'react';
import { Store, HelpCircle } from 'lucide-react';
import CollapsibleSection from '@/components/jobs/CollapsibleSection';
import { JobCreateFormData } from './types';

interface ProductionFulfillmentSectionProps {
  readonly formData: JobCreateFormData;
  readonly setFormData: React.Dispatch<React.SetStateAction<JobCreateFormData>>;
  readonly showOutsourcingHelp: boolean;
  readonly setShowOutsourcingHelp: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ProductionFulfillmentSection({
  formData,
  setFormData,
  showOutsourcingHelp,
  setShowOutsourcingHelp,
}: ProductionFulfillmentSectionProps) {
  return (
    <CollapsibleSection
      icon={<Store size={16} className="text-blue-700" />}
      iconBoxClassName="bg-blue-50 border border-blue-200"
      title="Production & Fulfillment"
      defaultOpen={false}
    >
      <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-4">
        <span className="inline-block mb-2 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
          Owner/Manager Only
        </span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.is_outsourced}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, is_outsourced: e.target.checked }))
              }
              className="rounded border-line text-taupe focus:ring-taupe"
            />
            <span className="text-sm font-semibold text-ink-body">
              Outsource this production (Sent to external shop/tailor)
            </span>
          </label>
          <button
            type="button"
            onClick={() => setShowOutsourcingHelp((p) => !p)}
            className="text-ink-faint hover:text-taupe transition-colors cursor-pointer"
            title="What is this?"
          >
            <HelpCircle size={14} />
          </button>
        </div>

        {showOutsourcingHelp && (
          <div className="mt-2 max-w-md p-3 bg-canvas border border-line rounded-lg text-xs text-ink-body leading-relaxed">
            Turn this on when you&apos;re subcontracting this job — or part of it, like beadwork or embroidery — to another shop or freelance artisan, usually because you&apos;re overbooked or don&apos;t have that skill or machine in-house. The customer still pays your full Total Amount either way — enter what <strong>you</strong> pay the partner below so you can see your real profit on this job, not just what the customer paid.
          </div>
        )}

        {formData.is_outsourced && (
          <div className="mt-3 max-w-md space-y-3">
            <div>
              <label
                htmlFor="partner_shop_name"
                className="block text-xs font-semibold text-ink-muted mb-1"
              >
                Partner Shop / Sewer Name <span className="text-danger">*</span>
              </label>
              <input
                id="partner_shop_name"
                type="text"
                required
                value={formData.partner_shop_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, partner_shop_name: e.target.value }))
                }
                placeholder="e.g. Maria's Dressmaking Shop"
                className="w-full bg-canvas border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
              />
            </div>

            <div>
              <label
                htmlFor="outsourcing_cost"
                className="block text-xs font-semibold text-ink-muted mb-1"
              >
                What You&apos;re Paying Them <span className="font-normal normal-case text-ink-faint">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint font-medium text-sm">₱</span>
                <input
                  id="outsourcing_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.outsourcing_cost}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, outsourcing_cost: e.target.value }))
                  }
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 bg-canvas border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {Number.parseFloat(formData.outsourcing_cost || '0') > 0 && (() => {
              const total = Number.parseFloat(formData.total_amount) || 0;
              const cost = Number.parseFloat(formData.outsourcing_cost) || 0;
              const profit = total - cost;
              const isLoss = profit <= 0;
              return (
                <div
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm ${
                    isLoss
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'bg-sage/10 border-sage/20 text-sage'
                  }`}
                >
                  <span className="font-medium">
                    {isLoss ? "You're losing money on this job" : 'Your profit on this job'}
                  </span>
                  <span className="font-bold">₱{profit.toFixed(2)}</span>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <div className="bg-canvas/50 border border-line/60 rounded-xl p-4 mt-4">
        <span className="block text-xs font-semibold text-ink-muted mb-2 uppercase tracking-wider">
          Fulfillment Method
        </span>
        <div className="bg-canvas/60 border border-line/60 rounded-lg p-3 text-xs text-ink-muted flex items-center gap-2">
          <Store size={16} className="shrink-0" />
          <span>
            Customer will pick up the garments in-store. (Shop address will be used)
          </span>
        </div>
      </div>
    </CollapsibleSection>
  );
}
