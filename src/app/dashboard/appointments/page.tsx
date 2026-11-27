'use client';

import { useEffect } from 'react';
import {
  List, LayoutGrid, Calendar as CalendarIcon, AlertCircle,
  Plus, Clock, CheckCircle2, Scissors, Building2,
  RotateCcw, CalendarPlus
} from 'lucide-react';
import SearchInput from '@/components/shared/SearchInput';
import PageHeader from '@/components/shared/PageHeader';
import { useAppointments, DATE_FILTER_OPTIONS, type AppointmentDateFilter } from '@/components/appointments/useAppointments';
import AppointmentCreateModal from '@/components/appointments/AppointmentCreateModal';
import AppointmentActionModals from '@/components/appointments/AppointmentActionModals';
import AppointmentCalendarView from '@/components/appointments/AppointmentCalendarView';
import AppointmentListView from '@/components/appointments/AppointmentListView';
import FollowUpAppointmentModal from '@/components/appointments/FollowUpAppointmentModal';
import { APPOINTMENT_TYPES, TYPE_CONFIG, STATUS_CONFIG, AppointmentType } from '@/components/appointments/appointmentHelpers';
import { useBranch } from '@/context/BranchContext';
import ReadOnlyLock from '@/components/billing/ReadOnlyLock';

// Same height and look as the search box and buttons in the toolbar.
const TOOLBAR_SELECT = 'h-[38px] pl-3 pr-8 bg-surface border border-line rounded-lg text-xs font-semibold text-ink-body focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe/30 cursor-pointer max-w-full';

export default function AppointmentsPage() {
  const {
    loading,
    viewMode,
    setViewMode,
    calSubMode,
    setCalSubMode,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    dateFilter,
    setDateFilter,
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
    assigneeFilter,
    setAssigneeFilter,
    updateStatus,
    handleCheckIn,
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
  } = useAppointments();

  // ?new=1 (Home → Quick Actions) opens the New Appointment form right away,
  // then drops the flag so a refresh doesn't reopen it.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('new') !== '1') return;
    setEditingApt(null);
    setError('');
    setShowCreateModal(true);
    window.history.replaceState(null, '', window.location.pathname);
  }, [setEditingApt, setError, setShowCreateModal]);

  const { selectedBranchId, branches: branchList } = useBranch();
  const currentBranch = branchList.find(b => b.id === selectedBranchId);

  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0) + (dateFilter !== 'any' ? 1 : 0)
    + (!isPlainStaff && assigneeFilter !== 'everyone' ? 1 : 0) + (search ? 1 : 0);

  // "Assigned to" choices for owners/managers: the staff of the branch being viewed
  // (plus anyone not tied to a branch). With All Branches, everyone, labelled by branch.
  const assigneeOptions = Array.from(
    new Map(
      staff
        .filter((s) => selectedBranchId === null || !s.branch || s.branch.id === selectedBranchId)
        .map((s) => {
          const name = s.user?.name || `Staff #${s.user_id}`;
          return [s.user_id, selectedBranchId === null && s.branch ? `${name} · ${s.branch.name}` : name] as const;
        })
    ).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  // A person from another branch can't stay picked after switching branches.
  useEffect(() => {
    if (typeof assigneeFilter === 'number' && !assigneeOptions.some(([id]) => id === assigneeFilter)) {
      setAssigneeFilter('everyone');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId, staff]);

  // The status dropdown's choices, with how many bookings each has.
  const STATUS_OPTIONS: [typeof statusFilter, string][] = [
    ['all', 'All statuses'],
    ['pending', STATUS_CONFIG.pending?.label ?? 'Pending'],
    ['confirmed', STATUS_CONFIG.confirmed?.label ?? 'Confirmed'],
    ['in_progress', 'In Progress'],
    ['completed', STATUS_CONFIG.completed?.label ?? 'Completed'],
    ['cancelled', STATUS_CONFIG.cancelled?.label ?? 'Cancelled'],
    ['rejected', STATUS_CONFIG.rejected?.label ?? 'Rejected'],
    ['no_show', 'No Show'],
  ];
  const statusCount = (s: typeof statusFilter): number => ({
    all: stats.totalCount,
    pending: stats.pendingCount,
    confirmed: stats.confirmedCount,
    in_progress: stats.inProgressCount,
    completed: stats.completedCount,
    cancelled: stats.cancelledCount,
    rejected: stats.rejectedCount,
    no_show: stats.noShowCount,
  } as Record<string, number>)[s] ?? 0;

  const clearAllFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setDateFilter('any');
    setAssigneeFilter('everyone');
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
        description="Book and manage client fittings, measurement sessions, and bespoke consultations."
        actions={
          // flex-wrap — on the narrowest real phones (320px, e.g. iPhone SE)
          // "Schedule Follow-Up" + "New Appointment" together are wider than
          // the available width and this row has no sibling to wrap between
          // (PageHeader's own flex-wrap only applies above this one child),
          // so without its own wrap the second button would overflow off
          // the edge of the screen instead of dropping to its own line.
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setFollowUpError('');
                setShowFollowUpModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xs transition-colors min-h-[40px] bg-surface border border-taupe/40 hover:bg-taupe/10 text-taupe"
            >
              <CalendarPlus size={16} /> Schedule Follow-Up
            </button>
            {/* Every shop role books appointments (staff: their own branch, set by the server). */}
            <ReadOnlyLock>
              <button
                type="button"
                onClick={() => {
                  setEditingApt(null);
                  setError('');
                  setShowCreateModal(true);
                }}
                data-tour="appts-create"
                className="flex items-center gap-2 bg-taupe hover:bg-taupe-hover text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xs transition-colors min-h-[40px]"
              >
                <Plus size={16} /> New Appointment
              </button>
            </ReadOnlyLock>
          </div>
        }
      />

      {/* ── Operational KPI Cards (Clickable Quick Filters) ───────────────── */}
      <div data-tour="appts-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Today's Schedule */}
        <button
          type="button"
          onClick={() => { setStatusFilter('all'); setSearch(''); }}
          className="bg-surface border border-line rounded-xl p-4 flex flex-col justify-between min-h-[96px] shadow-2xs hover:border-taupe/60 transition-all text-left group"
        >
          <div className="flex items-center justify-between gap-2 w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted group-hover:text-ink">Today&apos;s Schedule</span>
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
              Pending Review
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted group-hover:text-ink">Active & Confirmed</span>
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted group-hover:text-ink">Completed</span>
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          </div>
          <p className="text-figure text-2xl font-bold text-ink mt-2 tabular-nums">{stats.completedCount}</p>
        </button>
      </div>

      {/* ── Main Container Card ──────────────────────────────────────────── */}
      <div data-tour="appts-list" className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xs">
        {/* One row of plain controls: search, status, visit type, "Assigned to me", view.
            Wraps onto two lines on narrow screens instead of hiding anything. */}
        <div data-tour="appts-toolbar" className="p-3.5 sm:p-4 border-b border-line bg-canvas/30">
          <div className="flex flex-wrap items-center gap-2.5">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search name, service or notes…"
              className="w-full md:w-auto md:flex-1 md:min-w-[220px]"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              aria-label="Booking status"
              className={`${TOOLBAR_SELECT} ${statusFilter !== 'all' ? 'border-taupe text-taupe-dark' : ''}`}
            >
              {STATUS_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label} ({statusCount(value)})</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as AppointmentType | 'all')}
              aria-label="Visit type"
              className={`${TOOLBAR_SELECT} ${typeFilter !== 'all' ? 'border-taupe text-taupe-dark' : ''}`}
            >
              <option value="all">All visit types</option>
              {APPOINTMENT_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as AppointmentDateFilter)}
              aria-label="Date"
              className={`${TOOLBAR_SELECT} ${dateFilter !== 'any' ? 'border-taupe text-taupe-dark' : ''}`}
            >
              {DATE_FILTER_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {isPlainStaff ? (
              // Staff: their own appointments first (on by default), one tap to see the whole branch.
              <button
                type="button"
                aria-pressed={assignedToMe ?? true}
                onClick={() => setAssignedToMe(!(assignedToMe ?? true))}
                className={`h-[38px] px-3.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-colors cursor-pointer ${(assignedToMe ?? true) ? 'bg-taupe text-white border-taupe' : 'bg-surface text-ink-body border-line hover:border-taupe/50'}`}
              >
                Assigned to me
              </button>
            ) : (
              // Owners and managers: one person's schedule, or bookings nobody has taken yet.
              <select
                value={String(assigneeFilter)}
                onChange={(e) => {
                  const v = e.target.value;
                  setAssigneeFilter(v === 'everyone' || v === 'unassigned' ? v : Number(v));
                }}
                aria-label="Assigned to"
                className={`${TOOLBAR_SELECT} ${assigneeFilter !== 'everyone' ? 'border-taupe text-taupe-dark' : ''}`}
              >
                <option value="everyone">Everyone</option>
                <option value="unassigned">Not assigned yet</option>
                {assigneeOptions.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            )}

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="h-[38px] px-2 text-xs font-semibold text-taupe flex items-center gap-1 hover:underline cursor-pointer"
              >
                <RotateCcw size={12} /> Clear
              </button>
            )}

            {currentBranch && (
              <span className="hidden xl:flex h-[38px] items-center gap-1.5 text-xs text-taupe bg-taupe/10 border border-taupe/20 px-2.5 rounded-lg font-semibold">
                <Building2 size={12} /> {currentBranch.name}
              </span>
            )}

            <div className="ml-auto">
              <ViewSwitcherPill />
            </div>
          </div>
        </div>

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
            onStartClick={(id) => updateStatus(id, 'in_progress')}
            onCheckInClick={handleCheckIn}
            onCompleteClick={(apt) => { setCompleteApt(apt); setShowCompleteModal(true); }}
            onCreateJobClick={handleCreateJob}
            onNoShowClick={(apt) => {
              if (window.confirm(`Mark the appointment for ${apt.customer?.name || 'this client'} as No-Show?`)) {
                updateStatus(apt.id, 'no_show');
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
            onStartClick={(id) => updateStatus(id, 'in_progress')}
            onCheckInClick={handleCheckIn}
            onCreateJobClick={handleCreateJob}
            onCompleteClick={(apt) => { setCompleteApt(apt); setShowCompleteModal(true); }}
            onRescheduleClick={(apt) => { setRescheduleApt(apt); setShowRescheduleModal(true); }}
            onDetailsClick={(apt) => { setViewApt(apt); setShowViewModal(true); }}
            onEditClick={(apt) => { setEditingApt(apt); setShowCreateModal(true); }}
            onCancelClick={(apt) => { setCancelApt(apt); setShowCancelModal(true); }}
            onNoShowClick={(apt) => {
              if (window.confirm(`Mark the appointment for ${apt.customer?.name || 'this client'} as No-Show?`)) {
                updateStatus(apt.id, 'no_show');
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
        onClose={() => { setShowCreateModal(false); setEditingApt(null); setError(''); }}
        editingApt={editingApt}
        customers={customers}
        onCreateCustomer={handleCreateCustomer}
        branches={branches}
        staff={staff}
        appointments={appointments}
        onSubmit={handleCreateSubmit}
        isSubmitting={isSubmitting}
        error={error}
      />

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
      />

      <FollowUpAppointmentModal
        isOpen={showFollowUpModal}
        onClose={() => { setShowFollowUpModal(false); setFollowUpError(''); }}
        customers={customers}
        branches={branches}
        todayStr={todayStr}
        minTimeFor={minTimeFor}
        onSubmit={handleCreateFollowUp}
        isSubmitting={isSubmitting}
        error={followUpError}
      />
    </div>
  );
}
