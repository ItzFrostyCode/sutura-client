'use client';

import { CalendarClock, Info } from 'lucide-react';
import AccountHeader from '@/components/account/AccountHeader';
import FilterChips from '@/components/account/FilterChips';
import EmptyState from '@/components/account/EmptyState';
import ApptViewToggle from '@/components/account/hub/ApptViewToggle';
import AppointmentCard from '@/components/account/appointments/AppointmentCard';
import AppointmentsCalendarView from '@/components/account/appointments/AppointmentsCalendarView';
import { useAppointmentsList } from '@/components/account/appointments/useAppointmentsList';
import { STATUS_FILTERS } from '@/components/account/appointments/appointmentTypes';

export default function MyAppointmentsPage() {
  const {
    appointments,
    loading,
    statusFilter,
    setStatusFilter,
    view,
    setView,
    calMonth,
    setCalMonth,
    selectedDay,
    setSelectedDay,
    cancellingId,
    hasActiveAppointment,
    filtered,
    monthLabel,
    cells,
    handleSelfCancel,
  } = useAppointmentsList();

  return (
    <div className="w-full">
      <AccountHeader title="My Appointments" backHref="/account" />

      {hasActiveAppointment && (
        <div className="mb-3 flex items-start gap-2.5 rounded-2xl bg-sunken px-4 py-3">
          <Info size={18} className="mt-0.5 shrink-0 text-ink-muted" />
          <p className="mobile-caption text-ink-body">
            You can only hold one active appointment per store at a time. Cancel your current one if you&apos;d like to book a different date.
          </p>
        </div>
      )}

      {/* Status chips and the List / Calendar switch */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <FilterChips label="Appointment status" active={statusFilter} onChange={setStatusFilter} options={STATUS_FILTERS} />
        </div>
        <ApptViewToggle view={view} onChange={setView} />
      </div>

      {loading && <div className="py-16 text-center mobile-body-sm text-ink-muted">Loading your appointments…</div>}

      {!loading && appointments.length === 0 && (
        <div className="mt-3">
          <EmptyState Icon={CalendarClock} title="No appointments yet" message="Book a fitting or consultation with a store to see it here." action={{ href: '/search', label: 'Browse Stores' }} />
        </div>
      )}

      {!loading && appointments.length > 0 && view === 'calendar' && (
        <AppointmentsCalendarView
          monthLabel={monthLabel}
          calMonth={calMonth}
          setCalMonth={setCalMonth}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          cells={cells}
        />
      )}

      {!loading && appointments.length > 0 && (view === 'list' || selectedDay) && (
        filtered.length === 0 ? (
          <p className="mobile-body-sm text-ink-muted text-center py-8 font-normal">
            {selectedDay ? 'No appointments on this day.' : 'No appointments match this filter.'}
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {filtered.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                cancellingId={cancellingId}
                onCancel={handleSelfCancel}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
