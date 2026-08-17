'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useBranch } from '@/context/BranchContext';
import { ShoppingBag, Package, CheckCircle2, Clock, XCircle, Plus, DollarSign, TrendingUp, Sparkles } from 'lucide-react';
import SearchInput from '@/components/shared/SearchInput';

import { CatalogOrder } from '@/components/orders/orderHelpers';
import OrderListItem from '@/components/orders/OrderListItem';
import NewWalkInOrderModal from '@/components/orders/NewWalkInOrderModal';
import CatalogModuleTabs from '@/components/catalog/CatalogModuleTabs';

type StatusFilter = 'all' | 'pending' | 'ready' | 'completed' | 'cancelled';

const STATUS_TABS: { id: StatusFilter; label: string; icon: typeof ShoppingBag }[] = [
  { id: 'all',       label: 'All Orders',      icon: ShoppingBag },
  { id: 'pending',   label: 'Pending Prep',    icon: Clock },
  { id: 'ready',     label: 'Ready for Pickup', icon: Package },
  { id: 'completed', label: 'Completed',       icon: CheckCircle2 },
  { id: 'cancelled', label: 'Cancelled',       icon: XCircle },
];

function OrdersPageContent() {
  const { shop, user } = useAuthStore();
  const { selectedBranchId } = useBranch();
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
    const params = selectedBranchId !== null ? { branch_id: selectedBranchId } : {};
    api.get(`/shops/${shop.id}/catalog-orders`, { params })
      .then(res => {
        setOrders(res.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    return () => clearTimeout(timer);
  }, [shop, selectedBranchId]);

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
        (o.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        String(o.id).includes(search)
      )
    : byStatus;

  // Status counts for badges
  const countFor = (s: StatusFilter) =>
    s === 'all' ? orders.length : orders.filter(o => o.status === s).length;

  const readyCount = orders.filter(o => o.status === 'ready').length;
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (Number.parseFloat(o.total_amount) || 0), 0);

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-taupe" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-ink animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-taupe uppercase tracking-wider block">Boutique & Retail Sales</span>
          <h1 className="text-2xl font-black text-ink tracking-tight">Catalog Showcase</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Your made-to-order Design Catalog, Walk-in Orders, and performance analytics in one place.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsNewOrderModalOpen(true)}
            className="flex items-center gap-2 bg-taupe hover:bg-taupe-hover text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            <span>New Walk-in Order</span>
          </button>
        </div>
      </div>

      <CatalogModuleTabs />

      {/* Top 3 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Total Retail Orders</span>
            <div className="text-2xl font-black font-mono text-ink">{orders.length}</div>
            <div className="text-xs text-ink-muted">
              {orders.filter(o => o.status === 'completed').length} completed • {orders.filter(o => o.status === 'pending' || o.status === 'ready').length} active
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-canvas border border-line flex items-center justify-center text-taupe shrink-0 shadow-2xs">
            <ShoppingBag size={20} />
          </div>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Ready for Pickup</span>
            <div className="text-2xl font-black font-mono text-blue-700">{readyCount}</div>
            <div className="text-xs text-ink-muted">Awaiting customer collection</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
            <Package size={20} />
          </div>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Fulfilled Retail Sales</span>
            <div className="text-2xl font-black font-mono text-ink">₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="text-xs text-ink-muted">Completed catalog walk-in purchases</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xs">
        {/* Status filter tabs + search toolbar */}
        <div className="p-4 sm:p-5 border-b border-line flex flex-col md:flex-row md:items-center justify-between gap-4 bg-canvas/30">
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1 md:pb-0">
            {STATUS_TABS.map(t => {
              const count = countFor(t.id);
              const Icon = t.icon;
              const isActive = statusFilter === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setStatusFilter(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-taupe text-white shadow-2xs'
                      : 'bg-surface border border-line text-ink-muted hover:text-ink hover:bg-canvas'
                  }`}
                >
                  <Icon size={13} className={isActive ? 'text-white' : 'text-ink-faint'} />
                  <span>{t.label}</span>
                  <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-canvas text-ink-muted border border-line'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="w-full md:w-64 shrink-0">
            <SearchInput 
              value={search} 
              onChange={setSearch} 
              placeholder="Search product, customer, order #..." 
              className="w-full" 
            />
          </div>
        </div>

        {/* Orders list */}
        <div className="p-4 sm:p-5">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="mx-auto h-12 w-12 text-ink-faint opacity-40 mb-3" />
              <h3 className="font-bold text-ink text-sm">No orders found</h3>
              <p className="text-xs text-ink-muted mt-1">
                {noOrdersMessage}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
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
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-taupe" /></div>}>
      <OrdersPageContent />
    </Suspense>
  );
}
