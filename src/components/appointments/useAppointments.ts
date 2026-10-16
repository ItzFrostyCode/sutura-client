import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useBranch } from '@/context/BranchContext';
import type { WalkInClash } from './WalkInClashDialog';
import { newOrderHref } from '@/components/jobs/board/newOrderHref';
import {
  Appointment, ServiceData, CustomerData, BranchData, StaffData,
  AppointmentStatus, AppointmentType, getErrorMessage, getLocalDateString, minTimeForDate, appointmentNo,
} from './appointmentHelpers';

export function useAppointments() {
  const { store, user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { selectedBranchId } = useBranch();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [viewMode, setViewMode]         = useState<'table' | 'cards' | 'calendar'>('table');
  const [calSubMode, setCalSubMode]     = useState<'month' | 'day'>('month');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all' | 'closed'>('all');
  const [typeFilter, setTypeFilter]     = useState<AppointmentType | 'all'>('all');
  const [whenFilter, setWhenFilter]     = useState<'any' | 'today' | 'upcoming' | 'past'>('any');
  const [search, setSearch]             = useState('');
  // Plain staff start on "assigned to me" — their own work first; anyone can flip it.
  const [assignedToMe, setAssignedToMe]  = useState<boolean | null>(null);
  const [currentDate, setCurrentDate]   = useState(new Date());
  const [selectedDay, setSelectedDay]   = useState<Date | null>(null);
  const [hoveredAptId, setHoveredAptId] = useState<number | null>(null);

  // Modal visibility
  // Opened from a customer's profile (Book appointment): the new-appointment form is already open with that customer.
  const [presetCustomerId, setPresetCustomerId] = useState(() => searchParams.get('customer_id') ?? '');
  const [showCreateModal,    setShowCreateModal]    = useState(Boolean(searchParams.get('customer_id')));
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
  // A walk-in against an online request that is still waiting: the owner chooses (see WalkInClashDialog).
  const [clash, setClash] = useState<{ payload: Record<string, unknown>; conflicts: WalkInClash['conflicts'] } | null>(null);

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
  const isPlainStaff = !isOwnerOrManager && userRoles.includes('staff');

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

  const handleRejectReview = async (id: number, reasonCode: string, note: string): Promise<boolean> => {
    if (!store) return false;
    setActionLoadingId(id);
    try {
      await api.post(`/stores/${store.id}/appointments/${id}/reject`, { reason_code: reasonCode, note: note || null });
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

  // Who handles this appointment. null unassigns. The server notifies the staff member.
  const handleAssign = async (id: number, staffId: number | null): Promise<boolean> => {
    if (!store) return false;
    try {
      const res = await api.put(`/stores/${store.id}/appointments/${id}/assign`, { staff_id: staffId });
      toast.success(staffId ? 'Staff assigned — they were notified.' : 'Staff unassigned.');
      const updated = res.data?.data;
      setViewApt(prev => (prev && prev.id === id ? { ...prev, assigned_staff_id: staffId, assigned_staff: updated?.assigned_staff ?? null } : prev));
      setReviewApt(prev => (prev && prev.id === id ? { ...prev, assigned_staff_id: staffId, assigned_staff: updated?.assigned_staff ?? null } : prev));
      fetchAppointments();
      return true;
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Could not assign staff.'));
      return false;
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

  // "Customer arrived": one tap. The server records the arrival and starts the visit (an early customer waits
  // if another visit is still using the branch; tap again once it is free).
  const handleCheckIn = async (id: number) => {
    if (!store) return;
    setActionLoadingId(id);
    try {
      const res = await api.post(`/stores/${store.id}/appointments/${id}/arrive`);
      if (res.data?.started === false) toast.info(res.data?.message ?? 'Arrival recorded. The customer waits for their time.');
      else toast.success('Visit started.');
      fetchAppointments();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Could not record the arrival.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  // "Didn't come": the one way to record a no-show (same data as Done > Didn't come).
  const handleDidntCome = async (id: number) => {
    if (!store) return;
    setActionLoadingId(id);
    try {
      await api.post(`/stores/${store.id}/appointments/${id}/complete`, { outcome: 'no_show' });
      toast.success('Recorded: the customer didn\u2019t come.');
      fetchAppointments();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Could not record this.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  // Early-Arrival Accommodation — staff decides to start service now
  // (capacity-checked server-side, see AppointmentController::update()) or
  // ask the customer to keep waiting. Never touches scheduled_at.
  const handleAccommodateEarly = async (id: number) => {
    if (!store) return;
    setActionLoadingId(id);
    try {
      await api.put(`/stores/${store.id}/appointments/${id}`, { early_arrival_decision: 'accommodated' });
      toast.success('Early arrival accommodated — service started now.');
      fetchAppointments();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Could not accommodate this early arrival right now.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAskToWait = async (id: number) => {
    if (!store) return;
    setActionLoadingId(id);
    try {
      await api.put(`/stores/${store.id}/appointments/${id}`, { early_arrival_decision: 'waiting' });
      toast.success('Customer will wait for their scheduled time.');
      fetchAppointments();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update.'));
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
      const data = (err as { response?: { data?: { code?: string; conflicts?: WalkInClash['conflicts'] } } })?.response?.data;
      if (data?.code === 'pending_online_request') {
        setClash({ payload, conflicts: data.conflicts ?? [] });
      } else {
        setError(getErrorMessage(err, 'Failed to save appointment.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // The owner's choice for a clash: serve the walk-in (the online customer is asked to move), or pick another time.
  const resolveClash = async (choice: 'serve_walkin_reschedule_online' | 'other_time') => {
    const pending = clash;
    setClash(null);
    if (choice === 'serve_walkin_reschedule_online' && pending) {
      await handleCreateSubmit({ ...pending.payload, on_conflict: choice });
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

  // "Done": Consultation only (completed) or Didn't come (no_show). Proceed to Production Order goes through
  // handleCreateJob: creating the order closes the visit.
  const handleCompleteSubmit = async (aptId: number, result: 'completed' | 'no_show', notes: string, fittingNotes?: string) => {
    if (!store) return;
    setIsSubmitting(true);
    try {
      await api.post(`/stores/${store.id}/appointments/${aptId}/complete`, {
        notes:         notes || undefined,
        outcome:       result,
        fitting_notes: fittingNotes || undefined,
      });
      setShowCompleteModal(false);
      setCompleteApt(null);
      toast.success(result === 'no_show' ? 'Recorded: the customer didn\u2019t come.' : 'Visit done.');
      fetchAppointments();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Could not close this visit.'));
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
    if (!custId) { toast.error('Customer not found.'); return; }
    router.push(newOrderHref(apt));
  };

  // Multi-attribute searching and filtering
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const needsNewTime = (x: Appointment) => x.status === 'pending' && x.outcome === 'rescheduled';
    return appointments.filter(a => {
      const matchStatus = statusFilter === 'all'
        || (statusFilter === 'closed' ? ['cancelled', 'rejected', 'no_show'].includes(a.status) : a.status === statusFilter);
      const today = getLocalDateString(new Date());
      const day = a.scheduled_at ? a.scheduled_at.split('T')[0].split(' ')[0] : '';
      const matchWhen = whenFilter === 'any' || (whenFilter === 'today' ? day === today : whenFilter === 'upcoming' ? day >= today : day < today);
      const matchType   = typeFilter   === 'all' || a.appointment_type === typeFilter;
      const mineOnly = assignedToMe ?? isPlainStaff;
      if (mineOnly && a.assigned_staff_id !== user?.id) return false;
      if (!matchStatus || !matchType || !matchWhen) return false;
      if (!q) return true;

      return (
        a.customer?.name?.toLowerCase().includes(q) ||
        a.customer?.email?.toLowerCase().includes(q) ||
        a.customer?.phone?.toLowerCase().includes(q) ||
        appointmentNo(a.id).toLowerCase().includes(q) ||
        a.service?.name?.toLowerCase().includes(q) ||
        a.appointment_type?.toLowerCase().includes(q) ||
        a.garment_category?.toLowerCase().includes(q) ||
        a.notes?.toLowerCase().includes(q) ||
        a.assigned_staff?.name?.toLowerCase().includes(q)
      );
    })
      // Requests whose slot a walk-in took go to the top so they are not missed (stable: the rest keep their order).
      .sort((x, y) => Number(needsNewTime(y)) - Number(needsNewTime(x)));
  }, [appointments, statusFilter, typeFilter, whenFilter, search, assignedToMe, isPlainStaff, user?.id]);

  // Operational metrics
  const stats = useMemo(() => {
    const todayLocal = getLocalDateString(new Date());
    let todayCount = 0;
    let pendingCount = 0;
    let confirmedCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let rejectedCount = 0;
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
      else if (a.status === 'rejected') rejectedCount++;
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
      rejectedCount,
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
    whenFilter,
    setWhenFilter,
    search,
    setSearch,
    currentDate,
    setCurrentDate,
    selectedDay,
    setSelectedDay,
    hoveredAptId,
    setHoveredAptId,
    showCreateModal,
    presetCustomerId,
    setPresetCustomerId,
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
    isPlainStaff,
    assignedToMe,
    setAssignedToMe,
    handleConfirmReview,
    handleRejectReview,
    handleAssign,
    handleCreateCustomer,
    updateStatus,
    handleCheckIn,
    handleAccommodateEarly,
    handleAskToWait,
    handleCreateFollowUp,
    handleCreateSubmit,
    handleRescheduleSubmit,
    handleCompleteSubmit,
    handleCancelConfirm,
    handleCreateJob,
    handleDidntCome,
    clash,
    resolveClash,
    filtered,
    stats,
    pendingCount: stats.pendingCount,
    refreshAppointments: fetchAppointments,
  };
}
