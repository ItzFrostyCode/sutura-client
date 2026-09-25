import { ShoppingBag, Package, CheckCircle2, Clock, XCircle } from 'lucide-react';

export type StatusFilter = 'all' | 'pending' | 'ready' | 'completed' | 'cancelled';
export type ViewMode = 'cards' | 'table';

export const STATUS_TABS: { id: StatusFilter; label: string; icon: typeof ShoppingBag }[] = [
  { id: 'all', label: 'All Orders', icon: ShoppingBag },
  { id: 'pending', label: 'Pending Prep', icon: Clock },
  { id: 'ready', label: 'Ready for Pickup', icon: Package },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
  { id: 'cancelled', label: 'Cancelled', icon: XCircle },
];

export interface WalkInOrdersViewProps {
  readonly isNewOrderModalOpen?: boolean;
  readonly onCloseNewOrderModal?: () => void;
  readonly onOrdersLoaded?: (count: number) => void;
}
