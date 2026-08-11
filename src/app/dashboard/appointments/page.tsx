'use client';

import { List, LayoutGrid, AlertCircle, Plus } from 'lucide-react';
import SearchInput from '@/components/shared/SearchInput';
import { useAppointments } from '@/components/appointments/useAppointments';
import AppointmentCreateModal from '@/components/appointments/AppointmentCreateModal';
import AppointmentActionModals from '@/components/appointments/AppointmentActionModals';
import AppointmentCalendarView from '@/components/appointments/AppointmentCalendarView';
import AppointmentListView from '@/components/appointments/AppointmentListView';
import { APPOINTMENT_TYPES, TYPE_CONFIG, STATUS_CONFIG, AppointmentType } from '@/components/appointments/appointmentHelpers';

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
    pendingCount,
  } = useAppointments();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Schedule & Appointments</h1>
          <p className="text-[#827A73] text-sm mt-1">Book and manage client fittings, measurement sessions, and garment consultations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white shadow-sm border border-[#EBE6E0] rounded-lg p-1">
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[#F0EAE3] text-[#2D2A26]' : 'text-[#A8A19A] hover:text-[#524A44]'}`}
            >
              <List size={18} />
            </button>
            <button 
              onClick={() => setViewMode('calendar')} 
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-[#F0EAE3] text-[#2D2A26]' : 'text-[#A8A19A] hover:text-[#524A44]'}`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          {isOwnerOrManager && (
            <button
              onClick={() => { setEditingApt(null); setError(''); setShowCreateModal(true); }}
              className="flex items-center gap-2 bg-[#9A8073] hover:bg-[#9A8073]/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus size={18} /> New Appointment
            </button>
          )}
        </div>
      </div>

      {/* Pending inbox banner */}
      {pendingCount > 0 && isOwnerOrManager && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <AlertCircle size={16} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              {pendingCount} appointment{pendingCount === 1 ? '' : 's'} awaiting your review
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Review and confirm or reject pending bookings below.</p>
          </div>
          <button
            onClick={() => setStatusFilter('pending')}
            className="shrink-0 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            View Pending
          </button>
        </div>
      )}

      {/* Main content card */}
      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden">
        {viewMode === 'list' ? (
          <>
            {/* Filters */}
            <div className="p-4 border-b border-[#EBE6E0] flex flex-wrap items-center gap-3 bg-[#FAF6F3]/30">
              <SearchInput value={search} onChange={setSearch} placeholder="Search customer or service..." className="w-56" />

              {/* Type filter */}
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as AppointmentType | 'all')}
                className="text-sm border border-[#EBE6E0] rounded-lg px-3 py-2 bg-white text-[#524A44] focus:outline-none focus:border-[#9A8073]"
              >
                <option value="all">All Types</option>
                {APPOINTMENT_TYPES.map(t => (
                  <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>
                ))}
              </select>

              {/* Status tabs */}
              <div className="flex flex-wrap items-center gap-1 border border-[#EBE6E0] rounded-lg bg-white p-1 w-full sm:w-auto sm:ml-auto">
                {(['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const).map(s => {
                  let tabLabel = '';
                  if (s === 'all') {
                    tabLabel = 'All';
                  } else if (s === 'in_progress') {
                    tabLabel = 'In Progress';
                  } else {
                    tabLabel = STATUS_CONFIG[s]?.label || '';
                  }
                  return (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors relative ${
                        statusFilter === s ? 'bg-[#F0EAE3] text-[#2D2A26]' : 'text-[#827A73] hover:text-[#2D2A26]'
                      }`}
                    >
                      {tabLabel}
                      {s === 'pending' && pendingCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List */}
            <AppointmentListView
              filtered={filtered}
              loading={loading}
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
              onNoShowClick={(apt) => { if (window.confirm(`Mark the appointment for ${apt.customer?.name} as No-Show? The customer will be notified.`)) updateStatus(apt.id, 'no_show'); }}
            />
          </>
        ) : (
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
            onNoShowClick={(apt) => { if (window.confirm(`Mark the appointment for ${apt.customer?.name} as No-Show? The customer will be notified.`)) updateStatus(apt.id, 'no_show'); }}
            onDetailsClick={(apt) => { setViewApt(apt); setShowViewModal(true); }}
            onAddClick={() => {
              setEditingApt(null);
              setError('');
              setShowCreateModal(true);
            }}
          />
        )}
      </div>

      {/* Modals */}
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
