import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useBranch } from '@/context/BranchContext';
import {
  Appointment, ServiceData, CustomerData, BranchData, StaffData,
  AppointmentStatus, AppointmentType, getErrorMessage
} from './appointmentHelpers';

export function useAppointments() {
  const { shop, user } = useAuthStore();
  const router = useRouter();
  const toast = useToast();
  const { selectedBranchId } = useBranch();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [viewMode, setViewMode]         = useState<'list' | 'calendar'>('list');
  const [calSubMode, setCalSubMode]     = useState<'month' | 'day'>('month');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter]     = useState<AppointmentType | 'all'>('all');
  const [search, setSearch]             = useState('');
  const [currentDate, setCurrentDate]   = useState(new Date());
  const [selectedDay, setSelectedDay]   = useState<Date | null>(null);
  const [hoveredAptId, setHoveredAptId] = useState<number | null>(null);

  // Modal visibility
  const [showCreateModal,    setShowCreateModal]    = useState(false);
  const [showReviewModal,    setShowReviewModal]    = useState(false);
  const [showRescheduleModal,setShowRescheduleModal]= useState(false);
  const [showCompleteModal,  setShowCompleteModal]  = useState(false);
  const [showCancelModal,    setShowCancelModal]    = useState(false);
  const [showViewModal,      setShowViewModal]      = useState(false);

  // Active appointment contexts
  const [editingApt,    setEditingApt]    = useState<Appointment | null>(null);
  const [reviewApt,     setReviewApt]     = useState<Appointment | null>(null);
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [completeApt,   setCompleteApt]   = useState<Appointment | null>(null);
  const [cancelApt,     setCancelApt]     = useState<Appointment | null>(null);
  const [viewApt,       setViewApt]       = useState<Appointment | null>(null);

  // Loading/error states
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError]                     = useState('');

  // Reference data
  const [services,  setServices]  = useState<ServiceData[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [branches,  setBranches]  = useState<BranchData[]>([]);
  const [staff,     setStaff]     = useState<StaffData[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];

  const minTimeFor = (dateStr: string): string => {
    if (dateStr !== todayStr) return '00:00';
    const now   = new Date();
    const mins  = now.getHours() * 60 + now.getMinutes();
    const round = Math.ceil(mins / 15) * 15;
    return `${String(Math.floor(round / 60) % 24).padStart(2, '0')}:${String(round % 60).padStart(2, '0')}`;
  };

  const fetchAppointments = useCallback(() => {
    if (!shop?.id) return;
    setTimeout(() => setLoading(true), 0);
    const params: Record<string, string | number> = {};
    if (selectedBranchId !== null) {
      params.branch_id = selectedBranchId;
    }
    api.get(`/shops/${shop.id}/appointments`, { params })
      .then(res => { setAppointments(res.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [shop, selectedBranchId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (shop?.id) {
      api.get(`/shops/${shop.id}/services`).then(r => setServices(r.data.data)).catch(() => {});
      api.get(`/shops/${shop.id}/customers`).then(r => setCustomers(r.data.data)).catch(() => {});
      api.get(`/shops/${shop.id}/branches`).then(r => setBranches(r.data.data)).catch(() => {});
      api.get(`/shops/${shop.id}/staff`).then(r => setStaff(r.data.data)).catch(() => {});
    } else if (user?.id && !shop?.id) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }
  }, [shop?.id, user?.id]);

  const userRoles: string[] = user?.roles?.map(r => r.name) ?? [];
  const isOwnerOrManager = userRoles.some(r => ['shop_owner', 'branch_manager'].includes(r));

  // Confirm / Reject Review — both return whether the action actually
  // succeeded so the caller can decide whether to close the review modal.
  // Closing unconditionally would hide a rejection reason (e.g. a double-
  // booking conflict) the owner needs to see and react to right there,
  // instead of silently vanishing as if nothing happened.
  const handleConfirmReview = async (id: number): Promise<boolean> => {
    if (!shop) return false;
    setActionLoadingId(id);
    try {
      await api.put(`/shops/${shop.id}/appointments/${id}`, { status: 'confirmed' });
      toast.success('Appointment confirmed!');
      fetchAppointments();
      return true;
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to confirm appointment.'));
      return false;
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectReview = async (id: number): Promise<boolean> => {
    if (!shop) return false;
    setActionLoadingId(id);
    try {
      await api.put(`/shops/${shop.id}/appointments/${id}`, { status: 'cancelled' });
      toast.success('Appointment rejected.');
      fetchAppointments();
      return true;
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to reject appointment.'));
      return false;
    } finally {
      setActionLoadingId(null);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    if (!shop) return;
    setActionLoadingId(id);
    try {
      await api.put(`/shops/${shop.id}/appointments/${id}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchAppointments();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update status.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick "Add New Customer" from inside the Schedule Appointment modal —
  // keeps the owner from having to abandon the appointment they're mid-way
  // through creating just to go register a first-time walk-in customer.
  const handleCreateCustomer = async (payload: Record<string, string | null>): Promise<CustomerData> => {
    if (!shop) throw new Error('No shop selected.');
    const res = await api.post(`/shops/${shop.id}/customers`, payload);
    const newCustomer = res.data.data as CustomerData;
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  };

  // Submit appointment creation or edit
  const handleCreateSubmit = async (payload: Record<string, unknown>) => {
    if (!shop) return;
    setIsSubmitting(true);
    setError('');
    try {
      if (editingApt) {
        const res = await api.put(`/shops/${shop.id}/appointments/${editingApt.id}`, payload);
        setAppointments(prev => prev.map(a => a.id === editingApt.id ? { ...a, ...res.data.data } : a));
      } else {
        const res = await api.post(`/shops/${shop.id}/appointments`, payload);
        setAppointments(prev => [...prev, res.data.data]);
      }
      setShowCreateModal(false);
      setEditingApt(null);
      setError('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to save appointment.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRescheduleSubmit = async (aptId: number, date: string, time: string, notes: string) => {
    if (!shop) return;
    setIsSubmitting(true);
    try {
      const scheduled_at = `${date} ${time}:00`;
      await api.put(`/shops/${shop.id}/appointments/${aptId}`, {
        scheduled_at,
        notes: notes || undefined,
      });
      setAppointments(prev =>
        prev.map(a => a.id === aptId ? { ...a, scheduled_at, notes: notes || a.notes } : a)
      );
      setShowRescheduleModal(false);
      setRescheduleApt(null);
      toast.success('Appointment rescheduled!');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to reschedule.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteSubmit = async (aptId: number, notes: string, jobOrderId: string, measurementAction: 'none' | 'record', outcome: string) => {
    if (!shop) return;
    setIsSubmitting(true);
    try {
      await api.post(`/shops/${shop.id}/appointments/${aptId}/complete`, {
        notes:        notes || undefined,
        job_order_id: jobOrderId || undefined,
        outcome:      outcome,
      });
      setAppointments(prev =>
        prev.map(a => a.id === aptId ? { ...a, status: 'completed', outcome: outcome as any } : a)
      );
      setShowCompleteModal(false);

      if (measurementAction === 'record') {
        const targetApt = appointments.find(a => a.id === aptId);
        const custId = targetApt?.customer?.id;
        if (custId) router.push(`/dashboard/measurements?customer_id=${custId}`);
      }
      setCompleteApt(null);
      toast.success('Appointment completed successfully!');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to complete appointment.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelConfirm = async (aptId: number) => {
    if (!shop) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/shops/${shop.id}/appointments/${aptId}`);
      setAppointments(prev => prev.map(a => a.id === aptId ? { ...a, status: 'cancelled' } : a));
      setShowCancelModal(false);
      setCancelApt(null);
      toast.success('Appointment cancelled.');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to cancel appointment.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateJob = async (apt: Appointment) => {
    const custId = apt.customer?.id;
    const servId = apt.service?.id;
    if (!custId) { toast.error('Customer not found.'); return; }
    const serviceParam = servId ? `&service_id=${servId}` : '';
    const notesParam = encodeURIComponent(`From appointment. Notes: ${apt.notes || ''}`);
    router.push(`/dashboard/jobs/new?customer_id=${custId}${serviceParam}&notes=${notesParam}&appointment_id=${apt.id}`);
  };

  // Filtering
  const filtered = appointments.filter(a => {
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchType   = typeFilter   === 'all' || a.appointment_type === typeFilter;
    const q           = search.toLowerCase();
    const matchSearch = !q
      || a.customer?.name?.toLowerCase().includes(q)
      || a.service?.name?.toLowerCase().includes(q)
      || a.appointment_type?.toLowerCase().includes(q);
    return matchStatus && matchType && matchSearch;
  });

  const pendingCount = appointments.filter(a => a.status === 'pending').length;

  return {
    appointments,
    loading,
    viewMode,
    setViewMode,
    calSubMode,
    setCalSubMode,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    search,
    setSearch,
    currentDate,
    setCurrentDate,
    selectedDay,
    setSelectedDay,
    hoveredAptId,
    setHoveredAptId,
    showCreateModal,
    setShowCreateModal,
    showReviewModal,
    setShowReviewModal,
    showRescheduleModal,
    setShowRescheduleModal,
    showCompleteModal,
    setShowCompleteModal,
    showCancelModal,
    setShowCancelModal,
    showViewModal,
    setShowViewModal,
    editingApt,
    setEditingApt,
    reviewApt,
    setReviewApt,
    rescheduleApt,
    setRescheduleApt,
    completeApt,
    setCompleteApt,
    cancelApt,
    setCancelApt,
    viewApt,
    setViewApt,
    isSubmitting,
    actionLoadingId,
    error,
    setError,
    services,
    customers,
    branches,
    staff,
    todayStr,
    minTimeFor,
    isOwnerOrManager,
    handleConfirmReview,
    handleRejectReview,
    handleCreateCustomer,
    updateStatus,
    handleCreateSubmit,
    handleRescheduleSubmit,
    handleCompleteSubmit,
    handleCancelConfirm,
    handleCreateJob,
    filtered,
    pendingCount,
  };
}
