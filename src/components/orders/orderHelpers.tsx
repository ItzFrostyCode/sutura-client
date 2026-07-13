import { ShoppingBag, CheckCircle, Clock, XCircle } from 'lucide-react';

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
}

export function StatusBadge({ status }: { readonly status: string }) {
  switch (status) {
    case 'pending':
      return (
        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium flex items-center gap-1">
          <Clock className="w-3 h-3"/> Pending Prep
        </span>
      );
    case 'ready':
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1">
          <ShoppingBag className="w-3 h-3"/> Ready for Pickup
        </span>
      );
    case 'completed':
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
          <CheckCircle className="w-3 h-3"/> Completed
        </span>
      );
    case 'cancelled':
      return (
        <span className="px-2 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-medium flex items-center gap-1">
          <XCircle className="w-3 h-3"/> Cancelled
        </span>
      );
    default:
      return null;
  }
}
