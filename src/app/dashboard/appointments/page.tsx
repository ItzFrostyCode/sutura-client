'use client';

import { Suspense, useEffect, useState } from 'react';
import {
  List, LayoutGrid, Calendar as CalendarIcon, AlertCircle,
  Plus, Coffee
} from 'lucide-react';
import ApplePage, { AppleBar } from '@/components/jobs/ui/ApplePage';
import AppointmentToolbar from '@/components/appointments/AppointmentToolbar';
import AppointmentKpis from '@/components/appointments/AppointmentKpis';
import { APPOINTMENTS_COLUMN } from '@/components/appointments/pageColumn';
import { useAppointments } from '@/components/appointments/useAppointments';
import type { Appointment } from '@/components/appointments/appointmentHelpers';
import AppointmentCreateModal from '@/components/appointments/AppointmentCreateModal';
import ConsultationStartModal from '@/components/appointments/ConsultationStartModal';
import AppointmentActionModals from '@/components/appointments/AppointmentActionModals';
import AppointmentCalendarView from '@/components/appointments/AppointmentCalendarView';
import AppointmentListView from '@/components/appointments/AppointmentListView';
import AppointmentDetailPanel from '@/components/appointments/AppointmentDetailPanel';
import WalkInClashDialog from '@/components/appointments/WalkInClashDialog';
import FollowUpAppointmentModal from '@/components/appointments/FollowUpAppointmentModal';
import { useAuthStore } from '@/store/useAuthStore';
import { APPOINTMENT_TYPES, TYPE_CONFIG, STATUS_CONFIG, AppointmentType } from '@/components/appointments/appointmentHelpers';

/** The column every part of this page sits in (shared with the detail, so their edges line up). */
const COL = APPOINTMENTS_COLUMN;
/** The white card under the filters. The table sits in it; the cards view is only cards on the canvas (no box around them), and on a phone the list is a stack of its own cards too. */
const CARD_BOX = 'overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_3px_rgba(43,30,26,0.04),0_4px_12px_rgba(43,30,26,0.02)]';
const CARD_BOX_FROM_SM = 'sm:overflow-hidden sm:rounded-2xl sm:border sm:border-line sm:bg-white sm:shadow-[0_1px_3px_rgba(43,30,26,0.04),0_4px_12px_rgba(43,30,26,0.02)]';

/** Table | Cards | Calendar. Its own component (not made inside the page), so it is not rebuilt on every render. */
function ViewSwitcherPill({ viewMode, setViewMode }: Readonly<{ viewMode: 'table' | 'cards' | 'calendar'; setViewMode: (v: 'table' | 'cards' | 'calendar') => void }>) {
  return (
  <div
    role="group"
    aria-label="View mode selector"
    className="inline-flex shrink-0 items-center gap-0.5 rounded-xl border border-line bg-sunken p-1"
  >
    {/* Table View */}
    <button
      type="button"
      onClick={() => setViewMode('table')}
      title="Table View"
      aria-label="Table View"
      aria-pressed={viewMode === 'table'}
      className={`hidden sm:inline-flex items-center justify-center h-8 w-8 rounded-lg transition-all cursor-pointer ${
        viewMode === 'table'
          ? 'bg-surface text-ink shadow-xs border border-line/80'
          : 'text-ink-muted hover:text-ink hover:bg-surface/60'
      }`}
    >
      <List size={16} className={viewMode === 'table' ? 'text-taupe' : 'text-ink-muted'} />
    </button>

    {/* Cards View */}
    <button
      type="button"
      onClick={() => setViewMode('cards')}
      title="Cards View"
      aria-label="Cards View"
      aria-pressed={viewMode === 'cards'}
      className={`inline-flex items-center justify-center h-8 w-8 rounded-lg transition-all cursor-pointer ${
        viewMode === 'cards'
          ? 'bg-surface text-ink shadow-xs border border-line/80'
          : 'text-ink-muted hover:text-ink hover:bg-surface/60'
      }`}
    >
      <LayoutGrid size={16} className={viewMode === 'cards' ? 'text-taupe' : 'text-ink-muted'} />
    </button>

    {/* Subtle Divider */}
    <div className="h-4 w-px bg-line/80 mx-0.5 shrink-0" aria-hidden="true" />

    {/* Calendar View */}
    <button
      type="button"
      onClick={() => setViewMode('calendar')}
      title="Calendar View"
      aria-label="Calendar View"
      aria-pressed={viewMode === 'calendar'}
      className={`inline-flex items-center justify-center h-8 w-8 rounded-lg transition-all cursor-pointer ${
        viewMode === 'calendar'
          ? 'bg-surface text-ink shadow-xs border border-line/80'
          : 'text-ink-muted hover:text-ink hover:bg-surface/60'
      }`}
    >
      <CalendarIcon size={16} className={viewMode === 'calendar' ? 'text-taupe' : 'text-ink-muted'} />
    </button>
  </div>
  );
}

export default function AppointmentsPage() {
  // useSearchParams (a customer's "Book appointment" link) needs a Suspense boundary.
  return <Suspense fallback={null}><AppointmentsPageContent /></Suspense>;
}

function AppointmentsPageContent() {
  const {
    loading,
    viewMode,
    setViewMode,
    calSubMode,
    setCalSubMode,
    statusFilter,
    setStatusFilter,
    typeFilter,
    whenFilter,
    setWhenFilter,
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
    customers,
    handleCreateCustomer,
    branches,
    staff,
    appointments,
    todayStr,
    minTimeFor,
    isOwnerOrManager,
    handleConfirmReview,
    handleRejectReview,
    handleAssign,
    isPlainStaff,
    assignedToMe,
    setAssignedToMe,
    updateStatus,
    handleCheckIn,
    handleDidntCome,
    handleDiscard,
    clash,
    resolveClash,
    services,
    handleCreateFollowUp,
    handleCreateSubmit,
    showConsultModal,
    setShowConsultModal,
    handleStartConsultation,
    refreshAppointments,
    handleRescheduleSubmit,
    handleCompleteSubmit,
    handleCancelConfirm,
    handleCreateJob,
    filtered,
    stats,
    pendingCount,
    presetCustomerId,
    setPresetCustomerId,
  } = useAppointments();

  // The appointment a follow-up visit is being booked for. A follow-up always belongs to an existing record.
  const [followUpFor, setFollowUpFor] = useState<Appointment | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectApt, setRejectApt] = useState<Appointment | null>(null);

  const { store, user } = useAuthStore();
  const storeOwner = store?.owner ?? (user?.roles?.some(r => r.name === 'store_owner') ? { id: user.id, name: user.name } : null);

  // A phone has no table: its "list" and its "cards" are the same card stack, so it offers Cards and Calendar only.
  useEffect(() => {
    const phone = window.matchMedia('(max-width: 639px)');
    const fix = () => { if (phone.matches && viewMode === 'table') setViewMode('cards'); };
    fix();
    phone.addEventListener('change', fix);
    return () => phone.removeEventListener('change', fix);
  }, [viewMode, setViewMode]);

  // Keep viewApt synced with refreshed appointments
  const currentViewApt = viewApt ? (appointments.find(a => a.id === viewApt.id) || viewApt) : null;

  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0) + (whenFilter !== 'any' ? 1 : 0) + (search ? 1 : 0);

  const clearAllFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setWhenFilter('any');
    setSearch('');
  };


  return (
    <ApplePage>
      {/* ── Title row, inside the main panel (the detail has its own with the same margins) ── */}
      {!currentViewApt && (
        <div className={COL}>
        <AppleBar flush>
          <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
            <h1 className="text-2xl font-semibold sm:text-[30px] leading-tight tracking-tight text-ink">Appointments</h1>
            <p className="text-[13px] text-ink-muted">{stats.todayCount} today · {stats.pendingCount} waiting for approval · {stats.totalCount} in total</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <button
              type="button"
              onClick={() => { setError(''); setShowConsultModal(true); }}
              className="flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-taupe-hover px-4 text-[13px] font-medium text-white shadow-sm transition-opacity hover:opacity-95 sm:px-5"
            >
              <Coffee size={16} /> Start consultation
            </button>
            {isOwnerOrManager && (
              <button
                type="button"
                onClick={() => { setEditingApt(null); setError(''); setShowCreateModal(true); }}
                className="flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-espresso px-4 text-[13px] font-medium text-white shadow-sm hover:bg-espresso/90 sm:px-5"
              >
                <Plus size={16} /> Schedule a visit
              </button>
            )}
          </div>
        </AppleBar>
        </div>
      )}

      {/* ── The four counts (not shown on an appointment's own page) ────── */}
      {!currentViewApt && (
        <div className={`${COL} mt-6`}>
          <AppointmentKpis loading={loading} stats={stats} status={statusFilter} onStatus={setStatusFilter} onToday={() => { setStatusFilter('all'); setSearch(''); }} />
        </div>
      )}

      {/* ── Main Container: In-place Detail View OR List/Calendar View ──── */}
      {currentViewApt ? (
        <AppointmentDetailPanel
          apt={currentViewApt}
          onBack={() => setViewApt(null)}
          storeSlug={store?.slug}
          storeOwner={storeOwner}
          staff={staff}
          canAssign={isOwnerOrManager}
          onAssign={handleAssign}
          actionLoadingId={actionLoadingId}
          onConfirmReview={handleConfirmReview}
          onRejectClick={() => {
            setRejectApt(currentViewApt);
            setShowRejectModal(true);
          }}
          onRescheduleClick={() => {
            setRescheduleApt(currentViewApt);
            setShowRescheduleModal(true);
          }}
          onCheckInClick={handleCheckIn}
          onCreateJob={handleCreateJob}
          onDidntComeClick={(apt) => {
            if (window.confirm(`Record that ${apt.customer?.name || 'this customer'} didn't come?`)) {
              handleDidntCome(apt.id);
            }
          }}
          onCompleteClick={(apt) => {
            setCompleteApt(apt);
            setShowCompleteModal(true);
          }}
          onFinish={(apt, result, notes) => handleCompleteSubmit(apt.id, result, notes)}
          onDiscard={async (apt) => {
            if (!window.confirm(`Remove this visit with ${apt.customer?.name || 'this customer'}? It disappears from the list completely.`)) return;
            if (await handleDiscard(apt.id)) setViewApt(null);
          }}
          onAppointmentUpdated={refreshAppointments}
          onCancelClick={() => {
            setCancelApt(currentViewApt);
            setShowCancelModal(true);
          }}
          onFollowUp={(apt) => {
            setFollowUpError('');
            setFollowUpFor(apt);
            setShowFollowUpModal(true);
          }}
        />
      ) : (
        <div className={`${COL} space-y-4 pb-10 pt-6`}>
          <AppointmentToolbar
            search={search} onSearch={setSearch}
            status={statusFilter} onStatus={setStatusFilter}
            type={typeFilter} onType={setTypeFilter}
            when={whenFilter} onWhen={setWhenFilter}
            mine={assignedToMe ?? isPlainStaff} onMine={setAssignedToMe}
            counts={{
              all: stats.totalCount, pending: stats.pendingCount, confirmed: stats.confirmedCount,
              in_progress: stats.inProgressCount, completed: stats.completedCount,
              closed: stats.cancelledCount + stats.rejectedCount + stats.noShowCount,
            }}
            viewSwitcher={<ViewSwitcherPill viewMode={viewMode} setViewMode={setViewMode} />}
            hasFilters={activeFiltersCount > 0}
            onReset={clearAllFilters}
          />

          <div className={viewMode === 'table' ? CARD_BOX_FROM_SM : ''}>
          {/* View Mode Content */}
          {viewMode === 'calendar' ? (
            <AppointmentCalendarView
              appointments={appointments}
              loading={loading}
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              calSubMode={calSubMode}
              setCalSubMode={setCalSubMode}
              hoveredAptId={hoveredAptId}
              setHoveredAptId={setHoveredAptId}
              actionLoadingId={actionLoadingId}
              isOwnerOrManager={isOwnerOrManager}
              onReviewClick={(apt) => { setReviewApt(apt); setShowReviewModal(true); }}
              onCheckInClick={handleCheckIn}
              onCompleteClick={(apt) => { setCompleteApt(apt); setShowCompleteModal(true); }}
              onCreateJobClick={handleCreateJob}
              onNoShowClick={(apt) => {
                if (window.confirm(`Record that ${apt.customer?.name || 'this customer'} didn't come?`)) {
                  handleDidntCome(apt.id);
                }
              }}
              onDetailsClick={(apt) => { setViewApt(apt); }}
              onAddClick={() => {
                setEditingApt(null);
                setError('');
                setShowCreateModal(true);
              }}
            />
          ) : (
            <AppointmentListView
              filtered={filtered}
              loading={loading}
              resetKey={`${statusFilter}|${typeFilter}|${whenFilter}|${search}|${assignedToMe}`}
              viewMode={viewMode}
              actionLoadingId={actionLoadingId}
              isOwnerOrManager={isOwnerOrManager}
              onReviewClick={(apt) => { setReviewApt(apt); setShowReviewModal(true); }}
              onCheckInClick={handleCheckIn}
              onCreateJobClick={handleCreateJob}
              onCompleteClick={(apt) => { setCompleteApt(apt); setShowCompleteModal(true); }}
              onRescheduleClick={(apt) => { setRescheduleApt(apt); setShowRescheduleModal(true); }}
              onDetailsClick={(apt) => { setViewApt(apt); }}
              onEditClick={(apt) => { setEditingApt(apt); setShowCreateModal(true); }}
              onCancelClick={(apt) => { setCancelApt(apt); setShowCancelModal(true); }}
              onNoShowClick={(apt) => {
                if (window.confirm(`Record that ${apt.customer?.name || 'this customer'} didn't come?`)) {
                  handleDidntCome(apt.id);
                }
              }}
              onNewAppointmentClick={() => {
                setEditingApt(null);
                setError('');
                setShowCreateModal(true);
              }}
            />
          )}
          </div>
        </div>
      )}

      {/* ── Action Modals ────────────────────────────────────────────────── */}
      <AppointmentCreateModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditingApt(null); setError(''); setPresetCustomerId(''); }}
        editingApt={editingApt}
        presetCustomerId={presetCustomerId}
        customers={customers}
        onCreateCustomer={handleCreateCustomer}
        branches={branches}
        staff={staff}
        services={services}
        appointments={appointments}
        onSubmit={handleCreateSubmit}
        isSubmitting={isSubmitting}
        error={error}
      />

      <ConsultationStartModal
        isOpen={showConsultModal}
        onClose={() => { setShowConsultModal(false); setError(''); }}
        customers={customers}
        services={services}
        isSubmitting={isSubmitting}
        error={error}
        onStart={handleStartConsultation}
      />

      <WalkInClashDialog clash={clash} isSubmitting={isSubmitting} onChoose={resolveClash} />

      <AppointmentActionModals
        appointments={appointments}
        showReviewModal={showReviewModal}
        setShowReviewModal={setShowReviewModal}
        reviewApt={reviewApt}
        setReviewApt={setReviewApt}
        showRescheduleModal={showRescheduleModal}
        setShowRescheduleModal={setShowRescheduleModal}
        rescheduleApt={rescheduleApt}
        setRescheduleApt={setRescheduleApt}
        showCompleteModal={showCompleteModal}
        setShowCompleteModal={setShowCompleteModal}
        completeApt={completeApt}
        setCompleteApt={setCompleteApt}
        showCancelModal={showCancelModal}
        setShowCancelModal={setShowCancelModal}
        cancelApt={cancelApt}
        setCancelApt={setCancelApt}
        showRejectModal={showRejectModal}
        setShowRejectModal={setShowRejectModal}
        rejectApt={rejectApt}
        setRejectApt={setRejectApt}
        todayStr={todayStr}
        minTimeFor={minTimeFor}
        isSubmitting={isSubmitting}
        actionLoadingId={actionLoadingId}
        onConfirmReview={handleConfirmReview}
        onRejectReview={handleRejectReview}
        staff={staff}
        canAssign={isOwnerOrManager}
        onAssign={handleAssign}
        onRescheduleSubmit={handleRescheduleSubmit}
        onCompleteSubmit={handleCompleteSubmit}
        onCancelConfirm={handleCancelConfirm}
        onCreateJob={handleCreateJob}
        onFollowUp={(apt) => { setFollowUpError(''); setFollowUpFor(apt); setShowFollowUpModal(true); }}
        onEditClick={(apt) => { setEditingApt(apt); setShowCreateModal(true); }}
        onCheckInClick={handleCheckIn}
        onDidntComeClick={(apt) => {
          if (window.confirm(`Record that ${apt.customer?.name || 'this customer'} didn't come?`)) {
            handleDidntCome(apt.id);
          }
        }}
      />

      <FollowUpAppointmentModal
        isOpen={showFollowUpModal && followUpFor !== null}
        onClose={() => { setShowFollowUpModal(false); setFollowUpError(''); setFollowUpFor(null); }}
        customers={customers}
        presetCustomerId={followUpFor?.customer?.id}
        presetJobOrderId={followUpFor?.job_order?.id}
        presetCustomerName={followUpFor?.customer?.name}
                todayStr={todayStr}
        minTimeFor={minTimeFor}
        onSubmit={handleCreateFollowUp}
        isSubmitting={isSubmitting}
        error={followUpError}
      />
    </ApplePage>
  );
}
