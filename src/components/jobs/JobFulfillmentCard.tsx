import React from 'react';
import { Store } from 'lucide-react';

/**
 * Store pickup only — the approved thesis excludes logistics/courier/
 * delivery management from the system's scope, so this card is a static
 * notice rather than an editable fulfillment-method selector.
 */
export default function JobFulfillmentCard() {
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
    </div>
  );
}
