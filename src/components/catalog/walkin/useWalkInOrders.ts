import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useBranch } from '@/context/BranchContext';
import { CatalogOrder } from '@/components/orders/orderHelpers';
import { StatusFilter, ViewMode } from './walkinTypes';

export function useWalkInOrders(onOrdersLoaded?: (count: number) => void) {
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
        const timer = setTimeout(() => setJumpedToHighlight(true), 0);
        return () => clearTimeout(timer);
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

  return {
    orders,
    loading,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    updating,
    highlightId,
    viewMode,
    setViewMode,
    previewImage,
    setPreviewImage,
    receiptOrder,
    setReceiptOrder,
    trackingOrder,
    setTrackingOrder,
    discountModalOrder,
    setDiscountModalOrder,
    applyingDiscount,
    fetchOrders,
    updateStatus,
    applyDiscount,
    filtered,
    countFor,
    readyCount,
    totalRevenue,
    noOrdersMessage,
  };
}
