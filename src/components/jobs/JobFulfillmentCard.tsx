import React from 'react';
import { Store, Truck } from 'lucide-react';

interface JobFulfillmentCardProps {
  readonly isOutsourced?: boolean;
  readonly partnerShopName?: string | null;
  readonly outsourcingCost?: number | string | null;
}

/**
 * Store pickup only — the approved thesis excludes logistics/courier/
 * delivery management from the system's scope, so this card is a static
 * notice rather than an editable fulfillment-method selector.
 *
 * Outsourcing is a separate concern from delivery — is_outsourced/
 * partner_shop_name/outsourcing_cost are set at Job creation but, before
 * this, were never shown again anywhere afterward. A job actually sitting
 * at a partner shop (e.g. sent out for embroidery the shop can't do
 * in-house) needs that visible here, or staff checking on it later have no
 * way to know it isn't physically on the premises.
 */
export default function JobFulfillmentCard({ isOutsourced, partnerShopName, outsourcingCost }: JobFulfillmentCardProps) {
  return (
    <div className="bg-[#FAF6F3]/50 border border-[#EBE6E0]/60 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Store className="w-5 h-5 text-taupe" />
        <h2 className="text-lg font-medium text-[#2D2A26]">Fulfillment Details</h2>
      </div>
      <div className="bg-[#FAF6F3]/60 border border-[#EBE6E0]/60 rounded-lg p-3 text-xs text-[#827A73] flex items-center gap-2">
        <Store size={14} className="shrink-0" />
        <span>Customer will pick up garments in-store. (Shop address will be used)</span>
      </div>
      {isOutsourced && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
          <Truck size={14} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Outsourced to a partner shop</p>
            <p className="mt-0.5">
              {partnerShopName || 'Partner shop not specified'}
              {outsourcingCost != null && Number(outsourcingCost) > 0 && (
                <> — ₱{Number(outsourcingCost).toLocaleString('en-PH', { minimumFractionDigits: 2 })} cost</>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
