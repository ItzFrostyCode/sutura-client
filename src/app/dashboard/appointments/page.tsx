'use client';

import { Suspense, useState } from 'react';
import {
  List, LayoutGrid, Calendar as CalendarIcon, AlertCircle,
  Plus, Clock, CheckCircle2, Scissors,
  RotateCcw, CalendarPlus
} from 'lucide-react';
import SearchInput from '@/components/shared/SearchInput';
import PageHeader from '@/components/shared/PageHeader';
import AppointmentToolbar from '@/components/appointments/AppointmentToolbar';
import { useAppointments } from '@/components/appointments/useAppointments';
import type { Appointment } from '@/components/appointments/appointmentHelpers';
import AppointmentCreateModal from '@/components/appointments/AppointmentCreateModal';
import AppointmentActionModals from '@/components/appointments/AppointmentActionModals';
import AppointmentCalendarView from '@/components/appointments/AppointmentCalendarView';
import AppointmentListView from '@/components/appointments/AppointmentListView';
import WalkInClashDialog from '@/components/appointments/WalkInClashDialog';
import FollowUpAppointmentModal from '@/components/appointments/FollowUpAppointmentModal';
import { APPOINTMENT_TYPES, TYPE_CONFIG, STATUS_CONFIG, AppointmentType } from '@/components/appointments/appointmentHelpers';

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
    clash,
    resolveClash,
    services,
    handleAccommodateEarly,
    handleAskToWait,
    refreshAppointments,
    handleCreateFollowUp,
    handleCreateSubmit,
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

  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0) + (whenFilter !== 'any' ? 1 : 0) + (search ? 1 : 0);

  const clearAllFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setWhenFilter('any');
    setSearch('');
  };

  // Compact & perfectly proportional View Switcher Pill (38px height with 10px item spacing)
  const ViewSwitcherPill = () => (
    <div className="h-[38px] flex items-center gap-[10px] bg-canvas border border-line rounded-lg px-1.5 shadow-2xs shrink-0">
      <button
        type="button"
        onClick={() => setViewMode('table')}
        title="Table View"
        aria-label="Table View"
        className={`h-7 w-7 flex items-center justify-center rounded-md transition-all ${
          viewMode === 'table'
            ? 'bg-surface text-ink shadow-xs border border-line/60'
            : 'text-ink-muted hover:text-ink'
        }`}
      >
        <List size={15} />
      </button>
      <button
        type="button"
        onClick={() => setViewMode('cards')}
        title="Card List View"
        aria-label="Card List View"
        className={`h-7 w-7 flex items-center justify-center rounded-md transition-all ${
          viewMode === 'cards'
            ? 'bg-surface text-ink shadow-xs border border-line/60'
            : 'text-ink-muted hover:text-ink'
        }`}
      >
        <LayoutGrid size={15} />
      </button>
      <button
        type="button"
        onClick={() => setViewMode('calendar')}
        title="Calendar View"
        aria-label="Calendar View"
        className={`h-7 w-7 flex items-center justify-center rounded-md transition-all ${
          viewMode === 'calendar'
            ? 'bg-surface text-ink shadow-xs border border-line/60'
            : 'text-ink-muted hover:text-ink'
        }`}
      >
        <CalendarIcon size={15} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <PageHeader
        title="Schedule & Appointments"
        description="Book and manage fittings, measurements and consultations."
        actions={
          // flex-wrap — on the narrowest real phones (320px, e.g. iPhone SE)
          // "Schedule Follow-Up" + "New Appointment" together are wider than
          // the available width and this row has no sibling to wrap between
          // (PageHeader's own flex-wrap only applies above this one child),
          // so without its own wrap the second button would overflow off
          // the edge of the screen instead of dropping to its own line.
          <div className="flex items-center gap-2 flex-wrap">
            {isOwnerOrManager && (
              <button
                type="button"
                onClick={() => {
                  setEditingApt(null);
                  setError('');
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 bg-taupe hover:bg-taupe-hover text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xs transition-colors min-h-[40px]"
              >
                <Plus size={16} /> New Appointment
              </button>
            )}
          </div>
        }
      />

      {/* ── Operational KPI Cards (Clickable Quick Filters) ───────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Today's Schedule */}
        <button
          type="button"
          onClick={() => { setStatusFilter('all'); setSearch(''); }}
          className="bg-surface border border-line rounded-xl p-4 flex flex-col justify-between min-h-[96px] shadow-2xs hover:border-taupe/60 transition-all text-left group"
        >
          <div className="flex items-center justify-between gap-2 w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted group-hover:text-ink">Today</span>
            <Clock size={15} className="text-taupe shrink-0" />
          </div>
          <p className="text-figure text-2xl font-bold text-ink mt-2 tabular-nums">{stats.todayCount}</p>
        </button>

        {/* Pending Review */}
        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`bg-surface border rounded-xl p-4 flex flex-col justify-between min-h-[96px] shadow-2xs transition-all text-left group ${
            statusFilter === 'pending' ? 'border-taupe ring-1 ring-taupe' : 'border-line hover:border-taupe/60'
          }`}
        >
          <div className="flex items-center justify-between gap-2 w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted group-hover:text-ink">
              Waiting for approval
            </span>
            <AlertCircle size={15} className={stats.pendingCount > 0 ? 'text-amber-600' : 'text-ink-faint'} />
          </div>
          <p className="text-figure text-2xl font-bold mt-2 tabular-nums text-ink">
            {stats.pendingCount}
          </p>
        </button>

        {/* Confirmed & Active */}
        <button
          type="button"
          onClick={() => setStatusFilter('confirmed')}
          className={`bg-surface border rounded-xl p-4 flex flex-col justify-between min-h-[96px] shadow-2xs transition-all text-left group ${
            statusFilter === 'confirmed' ? 'border-taupe ring-1 ring-taupe' : 'border-line hover:border-taupe/60'
          }`}
        >
          <div className="flex items-center justify-between gap-2 w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted group-hover:text-ink">Approved & in progress</span>
            <Scissors size={15} className="text-taupe shrink-0" />
          </div>
          <p className="text-figure text-2xl font-bold text-ink mt-2 tabular-nums">{stats.activeCount}</p>
        </button>

        {/* Completed Sessions */}
        <button
          type="button"
          onClick={() => setStatusFilter('completed')}
          className={`bg-surface border rounded-xl p-4 flex flex-col justify-between min-h-[96px] shadow-2xs transition-all text-left group ${
            statusFilter === 'completed' ? 'border-taupe ring-1 ring-taupe' : 'border-line hover:border-taupe/60'
          }`}
        >
          <div className="flex items-center justify-between gap-2 w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted group-hover:text-ink">Done</span>
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          </div>
          <p className="text-figure text-2xl font-bold text-ink mt-2 tabular-nums">{stats.completedCount}</p>
        </button>
      </div>

      {/* ── Main Container Card ──────────────────────────────────────────── */}
      <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xs">
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
          viewSwitcher={<ViewSwitcherPill />}
          hasFilters={activeFiltersCount > 0}
          onReset={clearAllFilters}
        />

        {/* View Mode Content */}
        {viewMode === 'calendar' ? (
          <AppointmentCalendarView
            appointments={appointments}
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
            onDetailsClick={(apt) => { setViewApt(apt); setShowViewModal(true); }}
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
            viewMode={viewMode}
            actionLoadingId={actionLoadingId}
            isOwnerOrManager={isOwnerOrManager}
            onReviewClick={(apt) => { setReviewApt(apt); setShowReviewModal(true); }}
            onCheckInClick={handleCheckIn}
            onCreateJobClick={handleCreateJob}
            onCompleteClick={(apt) => { setCompleteApt(apt); setShowCompleteModal(true); }}
            onRescheduleClick={(apt) => { setRescheduleApt(apt); setShowRescheduleModal(true); }}
            onDetailsClick={(apt) => { setViewApt(apt); setShowViewModal(true); }}
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

      <WalkInClashDialog clash={clash} isSubmitting={isSubmitting} onChoose={resolveClash} />

      <AppointmentActionModals
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
        showViewModal={showViewModal}
        setShowViewModal={setShowViewModal}
        viewApt={viewApt}
        setViewApt={setViewApt}
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
        onAccommodateEarly={handleAccommodateEarly}
        onAskToWait={handleAskToWait}
        onAppointmentUpdated={refreshAppointments}
        onFollowUp={(apt) => { setFollowUpError(''); setFollowUpFor(apt); setShowFollowUpModal(true); }}
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
    </div>
  );
}
