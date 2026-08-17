import { ShoppingBag, CheckCircle, Clock, XCircle, Package } from 'lucide-react';

export interface CatalogOrder {
  id: number;
  catalog_item_id: number;
  selected_size: string | null;
  customer_id: number | null;
  type: string;
  status: string;
  total_amount: string;
  payment_status: string;
  created_at: string;
  discount_amount: string | null;
  catalog_item: {
    name: string;
    images: { id: number; image_url: string; view_angle: string; is_primary: boolean }[];
    price: string;
  };
  customer: {
    name: string;
  } | null;
  shop_branch_id?: number | null;
  branch?: { id: number; name: string } | null;
}

export function StatusBadge({ status }: { readonly status: string }) {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
          <Clock size={11} className="shrink-0" /> Pending Prep
        </span>
      );
    case 'ready':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
          <Package size={11} className="shrink-0" /> Ready for Pickup
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle size={11} className="shrink-0" /> Completed
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle size={11} className="shrink-0" /> Cancelled
        </span>
      );
    default:
      return null;
  }
}
