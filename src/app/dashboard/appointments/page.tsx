'use client';

import { useState } from 'react';
import {
  List, LayoutGrid, Calendar as CalendarIcon, AlertCircle,
  Plus, Clock, CheckCircle2, Scissors, Building2, SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import SearchInput from '@/components/shared/SearchInput';
import PageHeader from '@/components/shared/PageHeader';
import { useAppointments } from '@/components/appointments/useAppointments';
import AppointmentCreateModal from '@/components/appointments/AppointmentCreateModal';
import AppointmentActionModals from '@/components/appointments/AppointmentActionModals';
import AppointmentCalendarView from '@/components/appointments/AppointmentCalendarView';
import AppointmentListView from '@/components/appointments/AppointmentListView';
import { APPOINTMENT_TYPES, TYPE_CONFIG, STATUS_CONFIG, AppointmentType } from '@/components/appointments/appointmentHelpers';
import { useBranch } from '@/context/BranchContext';

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
    updateStatus,
    handleCreateSubmit,
    handleRescheduleSubmit,
    handleCompleteSubmit,
    handleCancelConfirm,
    handleCreateJob,
    filtered,
    stats,
    pendingCount,
  } = useAppointments();

  const { selectedBranchId, branches: branchList } = useBranch();
  const currentBranch = branchList.find(b => b.id === selectedBranchId);

  // Mobile / Collapsible Filter State
  const [showFilters, setShowFilters] = useState(false);

  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0) + (search ? 1 : 0);

  const clearAllFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
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
        eyebrow="Atelier Operations"
        title="Schedule & Appointments"
        description="Book and manage client fittings, measurement sessions, and bespoke consultations."
        actions={
          isOwnerOrManager ? (
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
          ) : null
        }
      />

      {/* ── Operational KPI Cards (Clickable Quick Filters) ───────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
      <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xs">
        {/* Table & Cards Filter & View Switcher Bar (Always Single Full Row) */}
        <div className="p-3.5 sm:p-4 border-b border-line bg-canvas/30">
          <div className="flex items-center justify-between gap-3">
            {/* Left Controls: Search + Filter Button (or Type Select on huge screens) */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search customer, service, notes..."
                className="w-48 sm:w-64 shrink-0"
              />

              {/* Filter Trigger Button — clean, never collides, opens drawer */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`h-[38px] flex items-center gap-1.5 px-3.5 rounded-lg border text-xs font-bold transition-all shrink-0 ${
                  showFilters || activeFiltersCount > 0
                    ? 'bg-taupe text-white border-taupe shadow-xs'
                    : 'bg-canvas text-ink border-line hover:bg-sunken'
                }`}
              >
                <SlidersHorizontal size={14} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white text-taupe text-[10px] font-black flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Active Filter Indicators on desktop */}
              {statusFilter !== 'all' && (
                <div className="hidden md:flex h-[38px] items-center gap-1.5 text-xs bg-taupe/10 border border-taupe/20 text-taupe px-3 rounded-lg font-semibold shrink-0">
                  <span className="capitalize">{statusFilter.replace(/_/g, ' ')}</span>
                  <button type="button" onClick={() => setStatusFilter('all')} className="hover:text-ink ml-1 font-bold">×</button>
                </div>
              )}

              {typeFilter !== 'all' && (
                <div className="hidden md:flex h-[38px] items-center gap-1.5 text-xs bg-taupe/10 border border-taupe/20 text-taupe px-3 rounded-lg font-semibold shrink-0">
                  <span className="capitalize">{typeFilter}</span>
                  <button type="button" onClick={() => setTypeFilter('all')} className="hover:text-ink ml-1 font-bold">×</button>
                </div>
              )}

              {currentBranch && (
                <div className="hidden xl:flex items-center gap-1.5 text-xs text-taupe bg-taupe/10 border border-taupe/20 px-2.5 py-1 rounded-lg font-semibold shrink-0">
                  <Building2 size={12} />
                  <span>{currentBranch.name}</span>
                </div>
              )}
            </div>

            {/* Right: View Switcher Pill (ALWAYS on the Right Side!) */}
            <div className="flex items-center gap-2 shrink-0">
              <ViewSwitcherPill />
            </div>
          </div>

          {/* Collapsible Filter Panel (Clean, spacious, responsive drawer) */}
          {showFilters && (
            <div className="mt-3.5 pt-3.5 border-t border-line/80 space-y-3.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink uppercase tracking-wider">Filter Bookings</span>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-[11px] font-semibold text-taupe flex items-center gap-1 hover:underline"
                  >
                    <RotateCcw size={11} /> Reset All Filters
                  </button>
                )}
              </div>

              <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-6">
                {/* Appointment Type Select (Adjustable compact combobox) */}
                <div className="w-full lg:w-56 xl:w-64 shrink-0">
                  <label className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                    Type of Session
                  </label>
                  <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value as AppointmentType | 'all')}
                    className="w-full h-[38px] text-xs font-medium border border-line rounded-lg px-3 bg-surface text-ink focus:outline-none focus:border-taupe shadow-2xs"
                  >
                    <option value="all">All Appointment Types</option>
                    {APPOINTMENT_TYPES.map(t => (
                      <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>
                    ))}
                  </select>
                </div>

                {/* Status Selection Pills (Full horizontal row) */}
                <div className="flex-1 min-w-0">
                  <label className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                    Booking Status
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap xl:flex-nowrap">
                    {(['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'] as const).map(s => {
                      let tabLabel = '';
                      let count = 0;
                      if (s === 'all') {
                        tabLabel = 'All';
                        count = stats.totalCount;
                      } else if (s === 'in_progress') {
                        tabLabel = 'In Progress';
                        count = stats.inProgressCount;
                      } else if (s === 'no_show') {
                        tabLabel = 'No Show';
                        count = stats.noShowCount;
                      } else {
                        tabLabel = STATUS_CONFIG[s]?.label || '';
                        if (s === 'pending') count = stats.pendingCount;
                        if (s === 'confirmed') count = stats.confirmedCount;
                        if (s === 'completed') count = stats.completedCount;
                        if (s === 'cancelled') count = stats.cancelledCount;
                      }

                      const isActive = statusFilter === s;

                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatusFilter(s)}
                          className={`h-[38px] px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border whitespace-nowrap shrink-0 ${
                            isActive
                              ? 'bg-taupe text-white border-taupe shadow-xs'
                              : 'bg-surface text-ink-body border-line hover:border-taupe/50'
                          }`}
                        >
                          <span>{tabLabel}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums ${
                            isActive ? 'bg-white/20 text-white' : 'bg-sunken text-ink-faint'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
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
        onRescheduleSubmit={handleRescheduleSubmit}
        onCompleteSubmit={handleCompleteSubmit}
        onCancelConfirm={handleCancelConfirm}
        onCreateJob={handleCreateJob}
      />
    </div>
  );
}
