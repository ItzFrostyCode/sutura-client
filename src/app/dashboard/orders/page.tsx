'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { Search, ShoppingBag, Package, CheckCircle2, Clock, XCircle, Plus } from 'lucide-react';

import { CatalogOrder } from '@/components/orders/orderHelpers';
import OrderListItem from '@/components/orders/OrderListItem';
import NewWalkInOrderModal from '@/components/orders/NewWalkInOrderModal';
import CatalogModuleTabs from '@/components/catalog/CatalogModuleTabs';

type StatusFilter = 'all' | 'pending' | 'ready' | 'completed' | 'cancelled';

const STATUS_TABS: { id: StatusFilter; label: string; icon: React.ReactNode }[] = [
  { id: 'all',       label: 'All',       icon: <ShoppingBag size={14} /> },
  { id: 'pending',   label: 'Pending',   icon: <Clock size={14} /> },
  { id: 'ready',     label: 'Ready',     icon: <Package size={14} /> },
  { id: 'completed', label: 'Completed', icon: <CheckCircle2 size={14} /> },
  { id: 'cancelled', label: 'Cancelled', icon: <XCircle size={14} /> },
];

function OrdersPageContent() {
  const { shop, user } = useAuthStore();
  const toast = useToast();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('order');
  const [orders, setOrders] = useState<CatalogOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);
  const [jumpedToHighlight, setJumpedToHighlight] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

  const fetchOrders = useCallback(() => {
    if (!shop) return;
    const timer = setTimeout(() => setLoading(true), 0);
    api.get(`/shops/${shop.id}/catalog-orders`)
      .then(res => {
        setOrders(res.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    return () => clearTimeout(timer);
  }, [shop]);

  useEffect(() => {
    if (shop) {
      const cleanup = fetchOrders();
      return () => {
        if (cleanup) cleanup();
      };
    } else if (user) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }
  }, [shop, user, fetchOrders]);

  // Deep-link support: ?order=<id> from Collect Payments' Catalog Orders tab
  // jumps straight to that order — clearing any filter that would hide it,
  // then scrolling it into view.
  useEffect(() => {
    const jumpToHighlighted = () => {
      if (jumpedToHighlight || loading || !highlightId || orders.length === 0) return;
      const target = orders.find(o => String(o.id) === highlightId);
      if (!target) return;
      setStatusFilter('all');
      setSearch('');
      setJumpedToHighlight(true);
      setTimeout(() => {
        document.getElementById(`order-${target.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    };
    jumpToHighlighted();
  }, [jumpedToHighlight, loading, highlightId, orders]);

  const updateStatus = async (orderId: number, newStatus: string) => {
    if (!shop) return;
    setUpdating(orderId);
    try {
      await api.put(`/shops/${shop.id}/catalog-orders/${orderId}`, { status: newStatus });
      toast.success(`Order status updated to "${newStatus.replaceAll('_', ' ')}"`);
      fetchOrders();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update order status.');
    } finally {
      setUpdating(null);
    }
  };

  const applyDiscount = async (orderId: number, amount: number, reason: string) => {
    if (!shop) return;
    try {
      await api.post(`/shops/${shop.id}/catalog-orders/${orderId}/discount`, { amount, reason: reason || null });
      toast.success('Discount applied successfully.');
      fetchOrders();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to apply discount.');
    }
  };

  // Filter logic
  const byStatus = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);
  const filtered = search
    ? byStatus.filter(o =>
        (o.catalog_item?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.customer?.name || '').toLowerCase().includes(search.toLowerCase())
      )
    : byStatus;

  // Status counts for badges
  const countFor = (s: StatusFilter) =>
    s === 'all' ? orders.length : orders.filter(o => o.status === s).length;

  let noOrdersMessage = '';
  if (search) {
    noOrdersMessage = `No results for "${search}"`;
  } else {
    const statusLabel = statusFilter === 'all' ? '' : `with status "${statusFilter}" `;
    noOrdersMessage = `No walk-in orders ${statusLabel}yet.`;
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9A8073]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#2D2A26]">
      <CatalogModuleTabs />
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Walk-in Orders</h1>
          <p className="text-sm text-[#827A73] mt-1">
            Quick in-store sales off the Design Catalog — store pickup only.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-[#A8A19A]">
            <ShoppingBag size={16} />
            <span>{orders.length} total orders</span>
          </div>
          <button
            onClick={() => setIsNewOrderModalOpen(true)}
            className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            <Plus size={16} /> New Walk-in Order
          </button>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white border border-[#EBE6E0] rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center border-b border-[#EBE6E0] bg-[#FAF6F3] px-5 py-3">
          {/* Search */}
          <div className="ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={15} />
              <input
                type="text"
                placeholder="Search product or customer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-white border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe w-52"
              />
            </div>
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-[#EBE6E0] overflow-x-auto">
          {STATUS_TABS.map(t => {
            const count = countFor(t.id);
            return (
              <button
                key={t.id}
                onClick={() => setStatusFilter(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                  statusFilter === t.id
                    ? 'bg-taupe text-white'
                    : 'bg-[#FAF6F3] border border-[#EBE6E0] text-[#827A73] hover:border-taupe hover:text-[#2D2A26]'
                }`}
              >
                {t.icon}
                {t.label}
                {count > 0 && (
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full ${
                    statusFilter === t.id ? 'bg-white/20 text-white' : 'bg-[#EBE6E0] text-[#827A73]'
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Orders list */}
        <div className="p-5">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="mx-auto h-12 w-12 text-[#C5BDBA] mb-3" />
              <h3 className="font-semibold text-[#2D2A26]">No orders found</h3>
              <p className="text-sm text-[#827A73] mt-1">
                {noOrdersMessage}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(order => (
                <OrderListItem
                  key={order.id}
                  order={order}
                  updating={updating}
                  onUpdateStatus={updateStatus}
                  onApplyDiscount={applyDiscount}
                  highlighted={highlightId === String(order.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <NewWalkInOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onCreated={fetchOrders}
      />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9A8073]" /></div>}>
      <OrdersPageContent />
    </Suspense>
  );
}
