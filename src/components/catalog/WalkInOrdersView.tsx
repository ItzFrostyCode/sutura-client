'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useBranch } from '@/context/BranchContext';
import {
  ShoppingBag, Package, CheckCircle2, Clock, XCircle, TrendingUp,
  LayoutGrid, Table as TableIcon, ZoomIn, Receipt, Tag, Check, Loader2, X,
  User, Store, Eye
} from 'lucide-react';
import SearchInput from '@/components/shared/SearchInput';
import { getMediaUrl } from '@/lib/media';

import { CatalogOrder, StatusBadge } from '@/components/orders/orderHelpers';
import NewWalkInOrderModal from '@/components/orders/NewWalkInOrderModal';
import OrderReceiptModal from '@/components/orders/OrderReceiptModal';
import OrderDetailsModal from '@/components/orders/OrderDetailsModal';
import OrderDiscountModal from '@/components/orders/OrderDiscountModal';

type StatusFilter = 'all' | 'pending' | 'ready' | 'completed' | 'cancelled';
type ViewMode = 'cards' | 'table';

const STATUS_TABS: { id: StatusFilter; label: string; icon: typeof ShoppingBag }[] = [
  { id: 'all',       label: 'All Orders',      icon: ShoppingBag },
  { id: 'pending',   label: 'Pending Prep',    icon: Clock },
  { id: 'ready',     label: 'Ready for Pickup', icon: Package },
  { id: 'completed', label: 'Completed',       icon: CheckCircle2 },
  { id: 'cancelled', label: 'Cancelled',       icon: XCircle },
];

interface WalkInOrdersViewProps {
  readonly isNewOrderModalOpen?: boolean;
  readonly onCloseNewOrderModal?: () => void;
  readonly onOrdersLoaded?: (count: number) => void;
}

export default function WalkInOrdersView({
  isNewOrderModalOpen = false,
  onCloseNewOrderModal,
  onOrdersLoaded,
}: WalkInOrdersViewProps) {
  const { store, user } = useAuthStore();
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
  const [internalNewOrderModal, setInternalNewOrderModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<CatalogOrder | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<CatalogOrder | null>(null);
  const [discountModalOrder, setDiscountModalOrder] = useState<CatalogOrder | null>(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  const fetchOrders = useCallback(() => {
    if (!store) return;
    const timer = setTimeout(() => setLoading(true), 0);
    const params = selectedBranchId !== null ? { branch_id: selectedBranchId } : {};
    api.get(`/stores/${store.id}/catalog-orders`, { params })
      .then(res => {
        const list = res.data.data || [];
        setOrders(list);
        if (onOrdersLoaded) {
          onOrdersLoaded(list.length);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    return () => clearTimeout(timer);
  }, [store, selectedBranchId, onOrdersLoaded]);

  useEffect(() => {
    if (store) {
      const cleanup = fetchOrders();
      return () => {
        if (cleanup) cleanup();
      };
    } else if (user) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }
  }, [store, user, fetchOrders]);

  // Jump to highlighted order from query param
  useEffect(() => {
    if (highlightId && orders.length > 0 && !jumpedToHighlight) {
      const el = document.getElementById(`order-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Defer to avoid synchronous setState inside an effect body
        setTimeout(() => setJumpedToHighlight(true), 0);
      }
    }
  }, [highlightId, orders, jumpedToHighlight]);

  // Close image preview on Escape key
  useEffect(() => {
    if (!previewImage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewImage(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewImage]);

  const updateStatus = async (orderId: number, nextStatus: string, nextPaymentStatus?: string) => {
    setUpdating(orderId);
    try {
      const payload: { status: string; payment_status?: string } = { status: nextStatus };
      if (nextPaymentStatus) payload.payment_status = nextPaymentStatus;
      await api.patch(`/stores/${store?.id}/catalog-orders/${orderId}/status`, payload);
      const statusLabel = nextStatus === 'ready' 
        ? 'Ready for Pickup' 
        : nextStatus === 'completed' 
        ? 'Fulfilled & Handed Over' 
        : nextStatus;
      toast.success(`Order #${orderId} marked as ${statusLabel}`);
      fetchOrders();
      setTrackingOrder(prev => (prev && prev.id === orderId ? { ...prev, status: nextStatus, ...(nextPaymentStatus ? { payment_status: nextPaymentStatus } : {}) } : prev));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const applyDiscount = async (orderId: number, amount: number, reason: string) => {
    if (!store) return;
    setApplyingDiscount(true);
    try {
      await api.post(`/stores/${store.id}/catalog-orders/${orderId}/apply-discount`, { amount, reason });
      toast.success('Discount applied successfully.');
      fetchOrders();
      setDiscountModalOrder(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to apply discount.');
    } finally {
      setApplyingDiscount(false);
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

  const modalOpen = isNewOrderModalOpen || internalNewOrderModal;
  const handleCloseModal = () => {
    if (onCloseNewOrderModal) {
      onCloseNewOrderModal();
    } else {
      setInternalNewOrderModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-taupe" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
        {/* Status filter tabs + search toolbar + View Mode Toggle */}
        <div className="p-4 sm:p-5 border-b border-line flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-canvas/30">
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1 lg:pb-0">
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

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="flex-1 lg:w-64">
              <SearchInput 
                value={search} 
                onChange={setSearch} 
                placeholder="Search product, customer, order #..." 
                className="w-full" 
              />
            </div>

            {/* Card vs Table UI Switcher */}
            <div className="flex items-center gap-1 p-1 bg-canvas border border-line rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-surface text-ink shadow-2xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <LayoutGrid size={14} />
                <span>Card Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-surface text-ink shadow-2xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <TableIcon size={14} />
                <span>Table View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Orders Content: Cards Grid or Table */}
        <div className="p-4 sm:p-5">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="mx-auto h-12 w-12 text-ink-faint opacity-40 mb-3" />
              <h3 className="font-bold text-ink text-sm">No orders found</h3>
              <p className="text-xs text-ink-muted mt-1">
                {noOrdersMessage}
              </p>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filtered.map(order => {
                const rawImage = order.catalog_item?.images?.[0]?.image_url;
                const imageUrl = rawImage ? getMediaUrl(rawImage) : null;
                const isUpdating = updating === order.id;
                const isHighlighted = highlightId === String(order.id);

                return (
                  <div
                    key={order.id}
                    id={`order-${order.id}`}
                    className={`bg-surface border rounded-2xl overflow-hidden flex flex-col transition-all shadow-2xs hover:shadow-md ${
                      isHighlighted
                        ? 'border-taupe ring-2 ring-taupe/30 bg-taupe/5'
                        : 'border-line hover:border-taupe/50'
                    }`}
                  >
                    {/* Top Image Frame */}
                    <div className="aspect-4/3 bg-canvas relative overflow-hidden group/cardImg">
                      {imageUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageUrl}
                            alt={order.catalog_item?.name || 'Garment'}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/cardImg:scale-105"
                          />
                          {/* Click to Zoom Overlay */}
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ url: imageUrl, title: order.catalog_item?.name || 'Garment Photo' })}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover/cardImg:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                            title="Click to zoom photo"
                          >
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold border border-white/30">
                              <ZoomIn size={14} />
                              <span>View Photo</span>
                            </div>
                          </button>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-ink-faint">
                          <ShoppingBag size={32} className="opacity-30 mb-1" />
                          <span className="text-[11px] font-medium text-ink-muted">No photo</span>
                        </div>
                      )}

                      {/* Top Badges: Order ID & Status */}
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span className="font-mono font-bold text-[10px] px-2 py-1 rounded-md bg-black/70 backdrop-blur-md text-white border border-white/10 shadow-xs">
                          #ORD-{order.id}
                        </span>
                      </div>

                      <div className="absolute top-2.5 right-2.5 z-10">
                        <StatusBadge status={order.status} />
                      </div>

                      {/* Bottom Info on Image: Size & Price */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                        {order.selected_size ? (
                          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/10">
                            Size {order.selected_size}
                          </span>
                        ) : <span />}

                        <span className="px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-md text-ink font-mono font-black text-xs border border-line shadow-xs">
                          ₱{Number(order.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-surface">
                      <div className="space-y-2">
                        <h4
                          className="font-bold text-ink text-sm leading-snug line-clamp-1"
                          title={order.catalog_item?.name}
                        >
                          {order.catalog_item?.name || 'Walk-in Garment'}
                        </h4>

                        <div className="space-y-1 text-xs text-ink-muted">
                          <div className="flex items-center gap-1.5 truncate">
                            <User size={13} className="text-ink-faint shrink-0" />
                            <span className="font-medium text-ink truncate">
                              {order.customer?.name || 'Guest Walk-in'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 truncate text-[11px]">
                            <Store size={13} className="text-ink-faint shrink-0" />
                            <span className="truncate">{order.branch?.name || 'Main Branch'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Status & Date */}
                      <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            order.payment_status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : order.payment_status === 'partial'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {order.payment_status}
                          </span>
                          {order.discount_amount && Number(order.discount_amount) > 0 && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                              -₱{Number(order.discount_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-ink-faint text-[10px]">
                          <Clock size={11} />
                          <span>{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setTrackingOrder(order)}
                          className="p-2 bg-canvas hover:bg-surface text-ink-muted hover:text-ink border border-line rounded-xl transition-colors cursor-pointer"
                          title="Step-by-Step Tracking & Handover Details"
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setReceiptOrder(order)}
                          className="p-2 bg-canvas hover:bg-surface text-ink-muted hover:text-ink border border-line rounded-xl transition-colors cursor-pointer"
                          title="View Official Receipt (Proof)"
                        >
                          <Receipt size={14} />
                        </button>

                        {order.status !== 'completed' && order.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => setDiscountModalOrder(order)}
                            className="p-2 bg-canvas hover:bg-rose-50 text-ink-muted hover:text-rose-700 border border-line hover:border-rose-200 rounded-xl transition-colors cursor-pointer"
                            title="Apply Discount"
                          >
                            <Tag size={14} />
                          </button>
                        )}

                        {order.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => updateStatus(order.id, 'ready')}
                            disabled={isUpdating}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <Package size={13} />}
                            <span>Mark Ready</span>
                          </button>
                        )}

                        {order.status === 'ready' && (
                          <button
                            type="button"
                            onClick={() => setTrackingOrder(order)}
                            className="flex-1 py-2 bg-taupe hover:bg-taupe-hover text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                          >
                            <Check size={13} />
                            <span>Pickup & Handover</span>
                          </button>
                        )}

                        {order.status === 'completed' && (
                          <button
                            type="button"
                            onClick={() => setTrackingOrder(order)}
                            className="flex-1 py-1.5 text-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/70 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                            title="Click to view full completion tracking & receipt"
                          >
                            Fulfilled ✓
                          </button>
                        )}

                        {order.status === 'cancelled' && (
                          <div className="flex-1 py-1.5 text-center text-[11px] font-semibold text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
                            Cancelled
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── Table View ────────────────────────────────────────── */
            <div className="overflow-x-auto border border-line rounded-xl bg-surface">
              <table className="w-full text-left text-xs text-ink-body">
                <thead className="bg-canvas/50 text-[10px] font-bold uppercase tracking-wider text-ink-faint border-b border-line">
                  <tr>
                    <th className="px-3.5 py-3 w-14 text-center">Photo</th>
                    <th className="px-3.5 py-3">Order #</th>
                    <th className="px-3.5 py-3">Garment Item</th>
                    <th className="px-3.5 py-3">Customer</th>
                    <th className="px-3.5 py-3">Branch</th>
                    <th className="px-3.5 py-3 text-right">Amount</th>
                    <th className="px-3.5 py-3 text-center">Payment</th>
                    <th className="px-3.5 py-3 text-center">Status</th>
                    <th className="px-3.5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map(order => {
                    const rawImage = order.catalog_item?.images?.[0]?.image_url;
                    const imageUrl = rawImage ? getMediaUrl(rawImage) : null;
                    const isUpdating = updating === order.id;

                    return (
                      <tr
                        key={order.id}
                        id={`order-${order.id}`}
                        className={`hover:bg-canvas/40 transition-colors ${
                          highlightId === String(order.id) ? 'bg-taupe/5' : ''
                        }`}
                      >
                        {/* Thumbnail */}
                        <td className="px-3.5 py-2.5 text-center">
                          {imageUrl ? (
                            <button
                              type="button"
                              onClick={() => setPreviewImage({ url: imageUrl, title: order.catalog_item?.name || 'Garment Photo' })}
                              className="w-10 h-10 rounded-lg overflow-hidden border border-line relative group/tblimg cursor-pointer inline-block"
                              title="Click to view full image"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/tblimg:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <ZoomIn size={12} />
                              </div>
                            </button>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-canvas border border-line flex items-center justify-center text-ink-faint mx-auto">
                              <ShoppingBag size={14} className="opacity-40" />
                            </div>
                          )}
                        </td>

                        {/* Order ID */}
                        <td className="px-3.5 py-2.5 font-mono font-bold text-ink whitespace-nowrap">
                          #ORD-{order.id}
                        </td>

                        {/* Garment Name */}
                        <td className="px-3.5 py-2.5">
                          <div className="font-semibold text-ink max-w-[220px] truncate" title={order.catalog_item?.name}>
                            {order.catalog_item?.name || 'Catalog Item'}
                          </div>
                          {order.selected_size && (
                            <span className="text-[10px] text-ink-muted">Size: {order.selected_size}</span>
                          )}
                        </td>

                        {/* Customer */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <div className="font-medium text-ink">{order.customer?.name || 'Guest Walk-in'}</div>
                          {order.customer?.email && (
                            <div className="text-[10px] text-ink-muted">{order.customer.email}</div>
                          )}
                        </td>

                        {/* Branch */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap text-ink-muted text-[11px]">
                          {order.branch?.name || 'Main Branch'}
                        </td>

                        {/* Total Amount */}
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-ink whitespace-nowrap">
                          ₱{Number(order.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Payment Status */}
                        <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            order.payment_status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : order.payment_status === 'partial'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {order.payment_status}
                          </span>
                        </td>

                        {/* Order Status */}
                        <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                          <StatusBadge status={order.status} />
                        </td>

                        {/* Actions */}
                        <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setTrackingOrder(order)}
                              className="p-1.5 bg-surface hover:bg-canvas text-ink-muted hover:text-ink border border-line rounded-lg transition-colors cursor-pointer shadow-2xs"
                              title="Step-by-Step Tracking & Handover Details"
                            >
                              <Eye size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setReceiptOrder(order)}
                              className="p-1.5 bg-surface hover:bg-canvas text-ink-muted hover:text-ink border border-line rounded-lg transition-colors cursor-pointer shadow-2xs"
                              title="View Official Receipt (Proof)"
                            >
                              <Receipt size={13} />
                            </button>

                            {order.status !== 'completed' && order.status !== 'cancelled' && (
                              <button
                                type="button"
                                onClick={() => setDiscountModalOrder(order)}
                                className="p-1.5 bg-surface hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                                title="Apply Discount"
                              >
                                <Tag size={13} />
                              </button>
                            )}

                            {order.status === 'pending' && (
                              <button
                                type="button"
                                onClick={() => updateStatus(order.id, 'ready')}
                                disabled={isUpdating}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                              >
                                {isUpdating ? '...' : 'Mark Ready'}
                              </button>
                            )}

                            {order.status === 'ready' && (
                              <button
                                type="button"
                                onClick={() => setTrackingOrder(order)}
                                className="px-2.5 py-1 bg-taupe hover:bg-taupe-hover text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                              >
                                <Check size={12} />
                                <span>Pickup</span>
                              </button>
                            )}

                            {order.status === 'completed' && (
                              <button
                                type="button"
                                onClick={() => setTrackingOrder(order)}
                                className="px-2 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                                title="View completed order details"
                              >
                                Fulfilled ✓
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Seamless Full-Screen Image Lightbox (No artificial boxes, padding, or letterboxing) */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          {/* Floating Top Bar: Title & Close Button */}
          <div 
            className="w-full max-w-3xl flex items-center justify-between gap-4 mb-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-lg truncate">
              <span className="truncate">{previewImage.title}</span>
            </div>

            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="p-2 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white transition-all cursor-pointer shadow-lg"
              title="Close Preview"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Full-view Image: Natural Aspect Ratio, Whole Photo Visible */}
          <div 
            className="relative flex items-center justify-center max-h-[85vh] max-w-[95vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-h-[85vh] max-w-[95vw] w-auto h-auto object-contain rounded-2xl shadow-2xl ring-1 ring-white/15 select-none"
            />
          </div>

          <p className="text-[11px] text-white/50 mt-3 font-medium select-none">
            Click anywhere or press Esc to close
          </p>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptOrder && (
        <OrderReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}

      {/* Step-by-Step Procedure & Tracking Modal */}
      {trackingOrder && (
        <OrderDetailsModal
          isOpen={Boolean(trackingOrder)}
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
          onUpdateStatus={updateStatus}
          onOpenReceipt={(ord) => setReceiptOrder(ord)}
          onOpenDiscount={(ord) => setDiscountModalOrder(ord)}
          isUpdating={updating === trackingOrder.id}
        />
      )}

      {/* Premium Order Discount Modal with Auto-Calculate & Quick Tags */}
      {discountModalOrder && (
        <OrderDiscountModal
          isOpen={Boolean(discountModalOrder)}
          order={discountModalOrder}
          onClose={() => setDiscountModalOrder(null)}
          onApplyDiscount={applyDiscount}
          isSubmitting={applyingDiscount}
        />
      )}

      {/* New Walk-in Order Modal */}
      <NewWalkInOrderModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onCreated={fetchOrders}
      />
    </div>
  );
}
