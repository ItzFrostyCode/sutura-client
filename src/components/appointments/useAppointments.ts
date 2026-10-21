import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

// The last list per shop and branch, kept for this tab: the page shows it at once and refreshes quietly behind it, so
// coming back to Appointments (or reloading) never waits on a skeleton. The lookups (services, customers, branches,
// staff) are kept the same way, in memory only.
const CACHE_PREFIX = 'sutura_appts:';
const memory = new Map<string, Appointment[]>();
const lookups = new Map<string, unknown[]>();
function cached(key: string): Appointment[] | null {
  if (!key) return null;
  const hit = memory.get(key);
  if (hit) return hit;
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    return raw ? (JSON.parse(raw) as Appointment[]) : null;
  } catch {
    return null;
  }
}
function remember(key: string, list: Appointment[]) {
  memory.set(key, list);
  try { sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(list)); } catch { /* full or blocked: memory still has it */ }
}

/** Open visits first (soonest first, so today's work is on page one), then the finished ones (newest first). */
const OPEN = new Set(['pending', 'confirmed', 'in_progress']);
function workOrder(list: Appointment[]): Appointment[] {
  const t = (a: Appointment) => new Date(a.scheduled_at.includes('T') ? a.scheduled_at : a.scheduled_at.replace(' ', 'T')).getTime();
  return [...list].sort((a, b) => {
    const ao = OPEN.has(a.status), bo = OPEN.has(b.status);
    if (ao !== bo) return ao ? -1 : 1;
    return ao ? t(a) - t(b) : t(b) - t(a);
  });
}

export function useAppointments() {
  const { store, user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { selectedBranchId } = useBranch();
  // Per account too: staff of the same shop see only their branch, so one account's kept list is never shown to another.
  const cacheKey = store?.id && user?.id ? `${user.id}:${store.id}:${selectedBranchId ?? 'all'}` : '';
  const [appointments, setAppointments] = useState<Appointment[]>(() => cached(cacheKey) ?? []);
  // The skeleton is only for a first visit with nothing kept yet; refreshes after an action never blank the page.
  const [loading, setLoading]           = useState(() => cached(cacheKey) === null);
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; });

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
  // The list loads the last 30 days and everything still open; older history only when it is asked for.
  // The whole history is loaded and paged in the list, so there is no "show older" step.
  const [showOlder, setShowOlder] = useState(true);
  const historyShown = showOlder || whenFilter === 'past' || (statusFilter !== 'all' && !['pending', 'confirmed', 'in_progress'].includes(statusFilter));

  // Modal visibility
  // Opened from a customer's profile (Book appointment): the new-appointment form is already open with that customer.
  const [presetCustomerId, setPresetCustomerId] = useState(() => searchParams.get('customer_id') ?? '');
  const [showCreateModal,    setShowCreateModal]    = useState(Boolean(searchParams.get('customer_id')));
  const [showConsultModal,   setShowConsultModal]   = useState(false);
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
  const [services,  setServices]  = useState<ServiceData[]>(() => (lookups.get(`${store?.id}:services`) as ServiceData[]) ?? []);
  const [customers, setCustomers] = useState<CustomerData[]>(() => (lookups.get(`${store?.id}:customers`) as CustomerData[]) ?? []);
  const [branches,  setBranches]  = useState<BranchData[]>(() => (lookups.get(`${store?.id}:branches`) as BranchData[]) ?? []);
  const [staff,     setStaff]     = useState<StaffData[]>(() => (lookups.get(`${store?.id}:staff`) as StaffData[]) ?? []);

  // Timezone-safe local date string
  const todayStr = getLocalDateString(new Date());

  const minTimeFor = (dateStr: string): string => minTimeForDate(dateStr, todayStr);

  // Another shop or branch: show what was kept for it at once (or the skeleton when nothing was).
  useEffect(() => {
    if (!cacheKey) return;
    const hit = cached(cacheKey);
    setAppointments(hit ?? []); // eslint-disable-line react-hooks/set-state-in-effect
    setLoading(hit === null);
  }, [cacheKey]);

  // Always the whole history (the list pages through it); a refresh keeps the current list on screen until it lands.
  const fetchAppointments = useCallback(() => {
    if (!store?.id || !cacheKey) return;
    const key = cacheKey;
    const params: Record<string, string | number> = { include_past: 1 };
    if (selectedBranchId !== null) params.branch_id = selectedBranchId;
    return api.get(`/stores/${store.id}/appointments`, { params })
      .then(res => {
        const list = workOrder(res.data.data || []);
        remember(key, list);
        setAppointments(list);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        toastRef.current.error(getErrorMessage(err, 'Failed to load appointments.'));
      });
  }, [store?.id, selectedBranchId, cacheKey]);

  // A link from a job order ("From consultation A-0006") opens that appointment's details.
  const opened = useRef(false);
  useEffect(() => {
    const id = Number(searchParams.get('open'));
    if (!id || opened.current || appointments.length === 0) return;
    const hit = appointments.find((a) => a.id === id);
    if (hit) { opened.current = true; setViewApt(hit); }
  }, [appointments, searchParams]);

  useEffect(() => {
    void fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (store?.id) {
      const load = <T,>(name: string, url: string, set: (v: T[]) => void, params?: Record<string, unknown>) =>
        api.get(url, { params }).then(r => {
          const list = Array.isArray(r.data?.data) ? (r.data.data as T[]) : [];
          lookups.set(`${store.id}:${name}`, list);
          set(list);
        }).catch(() => {});
      load<ServiceData>('services', `/stores/${store.id}/services`, setServices);
      // ?all=1: the picker also needs people who have only booked or visited so far (the Customers list shows only those with an order).
      load<CustomerData>('customers', `/stores/${store.id}/customers`, setCustomers, { all: 1 });
      load<BranchData>('branches', `/stores/${store.id}/branches`, setBranches);
      load<StaffData>('staff', `/stores/${store.id}/staff`, setStaff);
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
    // "Customer arrived" starts the visit, and a first-time user taps buttons to see what they do: ask first.
    const who = appointments.find((a) => a.id === id)?.customer?.name;
    if (!window.confirm(`Has ${who && who !== 'Walk-in customer' ? who : 'the customer'} arrived? This starts the visit.`)) return;
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

  // A walk-in visit started by mistake goes away completely (the server refuses once a job order or measurements hang on it).
  const handleDiscard = async (id: number): Promise<boolean> => {
    if (!store) return false;
    setActionLoadingId(id);
    try {
      await api.delete(`/stores/${store.id}/appointments/${id}/discard`);
      toast.success('Visit removed.');
      await fetchAppointments();
      return true;
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Could not remove this visit.'));
      return false;
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

  // "Start consultation": the customer is here now; the visit starts at once and opens so the notes can be written.
  const handleStartConsultation = async (payload: Record<string, unknown>) => {
    if (!store) return;
    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.post(`/stores/${store.id}/appointments/consultation`, payload);
      toast.success('Consultation started.');
      await fetchAppointments();
      setShowConsultModal(false);
      if (res.data?.data) setViewApt(res.data.data as Appointment);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { code?: string; conflicts?: WalkInClash['conflicts'] } } })?.response?.data;
      if (data?.code === 'pending_online_request') {
        setClash({ payload: { ...payload, _consult: true }, conflicts: data.conflicts ?? [] });
      } else {
        setError(getErrorMessage(err, 'Could not start the consultation.'));
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
      const { _consult, ...payload } = pending.payload;
      await (_consult ? handleStartConsultation : handleCreateSubmit)({ ...payload, on_conflict: choice });
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

  // "Done": Consultation only (completed) or Didn't come (no_show). Proceed to Job Order goes through
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

      // The box says "name or ID": the customer's name or number, the appointment number (A-0033 or 33), the service or design.
      const hay = [a.customer?.name, a.customer?.phone, appointmentNo(a.id), String(a.id), a.service?.name, a.catalog_item?.name, a.purpose_label]
        .filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
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
    showOlder, setShowOlder, historyShown,
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
    handleCreateFollowUp,
    handleCreateSubmit,
    showConsultModal,
    setShowConsultModal,
    handleStartConsultation,
    refreshAppointments: fetchAppointments,
    handleRescheduleSubmit,
    handleCompleteSubmit,
    handleCancelConfirm,
    handleCreateJob,
    handleDidntCome,
    handleDiscard,
    clash,
    resolveClash,
    filtered,
    stats,
    pendingCount: stats.pendingCount,
  };
}
