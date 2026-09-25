import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useBranch } from '@/context/BranchContext';
import {
  Appointment, ServiceData, CustomerData, BranchData, StaffData,
  AppointmentStatus, AppointmentType, getErrorMessage, getLocalDateString, minTimeForDate
} from './appointmentHelpers';

export function useAppointments() {
  const { store, user } = useAuthStore();
  const router = useRouter();
  const toast = useToast();
  const { selectedBranchId } = useBranch();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [viewMode, setViewMode]         = useState<'table' | 'cards' | 'calendar'>('table');
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
  const [showFollowUpModal,  setShowFollowUpModal]  = useState(false);

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
  const [followUpError, setFollowUpError]     = useState('');

  // Reference data
  const [services,  setServices]  = useState<ServiceData[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [branches,  setBranches]  = useState<BranchData[]>([]);
  const [staff,     setStaff]     = useState<StaffData[]>([]);

  // Timezone-safe local date string
  const todayStr = getLocalDateString(new Date());

  const minTimeFor = (dateStr: string): string => minTimeForDate(dateStr, todayStr);

  const fetchAppointments = useCallback(() => {
    if (!store?.id) return;
    const timer = setTimeout(() => setLoading(true), 0);
    const params: Record<string, string | number> = {};
    if (selectedBranchId !== null) {
      params.branch_id = selectedBranchId;
    }
    api.get(`/stores/${store.id}/appointments`, { params })
      .then(res => {
        setAppointments(res.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        toast.error(getErrorMessage(err, 'Failed to load appointments.'));
      });
    return () => clearTimeout(timer);
  }, [store, selectedBranchId, toast]);

  useEffect(() => {
    const cleanup = fetchAppointments();
    return () => {
      if (cleanup) cleanup();
    };
  }, [fetchAppointments]);

  useEffect(() => {
    if (store?.id) {
      api.get(`/stores/${store.id}/services`).then(r => setServices(Array.isArray(r.data?.data) ? r.data.data : [])).catch(() => {});
      api.get(`/stores/${store.id}/customers`).then(r => setCustomers(Array.isArray(r.data?.data) ? r.data.data : [])).catch(() => {});
      api.get(`/stores/${store.id}/branches`).then(r => setBranches(Array.isArray(r.data?.data) ? r.data.data : [])).catch(() => {});
      api.get(`/stores/${store.id}/staff`).then(r => setStaff(Array.isArray(r.data?.data) ? r.data.data : [])).catch(() => {});
    } else if (user?.id && !store?.id) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }
  }, [store?.id, user?.id]);

  const userRoles: string[] = user?.roles?.map(r => r.name) ?? [];
  const isOwnerOrManager = userRoles.some(r => ['store_owner', 'branch_manager', 'super_admin'].includes(r));

  // Confirm / Reject Review
  const handleConfirmReview = async (id: number): Promise<boolean> => {
    if (!store) return false;
    setActionLoadingId(id);
    try {
      await api.put(`/stores/${store.id}/appointments/${id}`, { status: 'confirmed' });
      toast.success('Appointment confirmed successfully!');
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
    if (!store) return false;
    setActionLoadingId(id);
    try {
      await api.put(`/stores/${store.id}/appointments/${id}`, { status: 'cancelled' });
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
    if (!store) return;
    setActionLoadingId(id);
    try {
      await api.put(`/stores/${store.id}/appointments/${id}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus.replaceAll('_', ' ')}`);
      fetchAppointments();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update status.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  // Staff Check-In — records arrival time only. Does not touch `status`;
  // On Time/Late is derived on render from checked_in_at vs scheduled_at.
  const handleCheckIn = async (id: number) => {
    if (!store) return;
    setActionLoadingId(id);
    try {
      await api.put(`/stores/${store.id}/appointments/${id}`, { checked_in_at: new Date().toISOString() });
      toast.success('Client checked in.');
      fetchAppointments();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to check in client.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  // Staff's narrow follow-up booking — see FollowUpAppointmentModal and
  // AppointmentController::createFollowUp. Deliberately its own endpoint,
  // not handleCreateSubmit, so Staff can never reach the full owner/manager
  // store() form's fields.
  const handleCreateFollowUp = async (payload: Record<string, unknown>) => {
    if (!store) return;
    setIsSubmitting(true);
    setFollowUpError('');
    try {
      await api.post(`/stores/${store.id}/appointments/follow-up`, payload);
      toast.success('Follow-up visit scheduled — the customer has been notified.');
      setShowFollowUpModal(false);
      fetchAppointments();
    } catch (err: unknown) {
      setFollowUpError(getErrorMessage(err, 'Failed to schedule follow-up visit.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick "Add New Customer" from inside the Schedule Appointment modal
  const handleCreateCustomer = async (payload: Record<string, string | null>): Promise<CustomerData> => {
    if (!store) throw new Error('No store selected.');
    const res = await api.post(`/stores/${store.id}/customers`, payload);
    const newCustomer = res.data.data as CustomerData;
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  };

  // Submit appointment creation or edit
  const handleCreateSubmit = async (payload: Record<string, unknown>) => {
    if (!store) return;
    setIsSubmitting(true);
    setError('');
    try {
      if (editingApt) {
        await api.put(`/stores/${store.id}/appointments/${editingApt.id}`, payload);
        toast.success('Appointment updated successfully!');
      } else {
        await api.post(`/stores/${store.id}/appointments`, payload);
        toast.success('Appointment booked successfully!');
      }
      fetchAppointments();
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
    if (!store) return;
    setIsSubmitting(true);
    try {
      const scheduled_at = `${date} ${time}:00`;
      await api.put(`/stores/${store.id}/appointments/${aptId}`, {
        scheduled_at,
        notes: notes || undefined,
      });
      setShowRescheduleModal(false);
      setRescheduleApt(null);
      toast.success('Appointment rescheduled!');
      fetchAppointments();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to reschedule.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteSubmit = async (aptId: number, notes: string, jobOrderId: string, measurementAction: 'none' | 'record', outcome: string, fittingNotes?: string) => {
    if (!store) return;
    setIsSubmitting(true);
    try {
      await api.post(`/stores/${store.id}/appointments/${aptId}/complete`, {
        notes:          notes || undefined,
        job_order_id:   jobOrderId || undefined,
        outcome:        outcome,
        fitting_notes:  fittingNotes || undefined,
      });
      setShowCompleteModal(false);

      if (measurementAction === 'record') {
        const targetApt = appointments.find(a => a.id === aptId);
        const custId = targetApt?.customer?.id;
        if (custId) router.push(`/dashboard/measurements?customer_id=${custId}`);
      }
      setCompleteApt(null);
      toast.success('Appointment marked as completed!');
      fetchAppointments();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to complete appointment.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelConfirm = async (aptId: number, reason: string, blockRebooking: boolean) => {
    if (!store) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/stores/${store.id}/appointments/${aptId}`, {
        data: { reason, block_rebooking: blockRebooking },
      });
      setShowCancelModal(false);
      setCancelApt(null);
      toast.success('Appointment cancelled.');
      fetchAppointments();
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

  // Multi-attribute searching and filtering
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return appointments.filter(a => {
      const matchStatus = statusFilter === 'all' || a.status === statusFilter;
      const matchType   = typeFilter   === 'all' || a.appointment_type === typeFilter;
      if (!matchStatus || !matchType) return false;
      if (!q) return true;

      return (
        a.customer?.name?.toLowerCase().includes(q) ||
        a.customer?.email?.toLowerCase().includes(q) ||
        a.customer?.phone?.toLowerCase().includes(q) ||
        a.service?.name?.toLowerCase().includes(q) ||
        a.appointment_type?.toLowerCase().includes(q) ||
        a.garment_category?.toLowerCase().includes(q) ||
        a.notes?.toLowerCase().includes(q) ||
        a.branch?.name?.toLowerCase().includes(q) ||
        a.assigned_staff?.name?.toLowerCase().includes(q)
      );
    });
  }, [appointments, statusFilter, typeFilter, search]);

  // Operational metrics
  const stats = useMemo(() => {
    const todayLocal = getLocalDateString(new Date());
    let todayCount = 0;
    let pendingCount = 0;
    let confirmedCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let noShowCount = 0;

    for (const a of appointments) {
      const datePart = a.scheduled_at ? a.scheduled_at.split('T')[0].split(' ')[0] : '';
      if (datePart === todayLocal && a.status !== 'cancelled') {
        todayCount++;
      }
      if (a.status === 'pending') pendingCount++;
      else if (a.status === 'confirmed') confirmedCount++;
      else if (a.status === 'in_progress') inProgressCount++;
      else if (a.status === 'completed') completedCount++;
      else if (a.status === 'cancelled') cancelledCount++;
      else if (a.status === 'no_show') noShowCount++;
    }

    return {
      todayCount,
      pendingCount,
      confirmedCount,
      inProgressCount,
      activeCount: confirmedCount + inProgressCount,
      completedCount,
      cancelledCount,
      noShowCount,
      totalCount: appointments.length,
    };
  }, [appointments]);

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
    showFollowUpModal,
    setShowFollowUpModal,
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
    followUpError,
    setFollowUpError,
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
    handleCheckIn,
    handleCreateFollowUp,
    handleCreateSubmit,
    handleRescheduleSubmit,
    handleCompleteSubmit,
    handleCancelConfirm,
    handleCreateJob,
    filtered,
    stats,
    pendingCount: stats.pendingCount,
    refreshAppointments: fetchAppointments,
  };
}
