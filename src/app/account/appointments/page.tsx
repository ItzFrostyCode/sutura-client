'use client';

import Link from 'next/link';
import { CalendarClock, Info, List as ListIcon, Calendar as CalendarIcon } from 'lucide-react';
import AccountHeader from '@/components/account/AccountHeader';
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
        <div className="flex items-start gap-2.5 bg-sunken border border-line px-4 py-3 mb-4">
          <Info size={18} className="text-ink-muted shrink-0 mt-0.5" />
          <p className="mobile-caption text-ink-body leading-relaxed font-normal">
            You can only hold one active appointment per store at a time. Cancel your current one if you&apos;d like to book a different date.
          </p>
        </div>
      )}

      {/* Filter Chips & View Toggle */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center overflow-x-auto gap-2 hide-scrollbar -mx-1 px-1 py-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={`shrink-0 whitespace-nowrap px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors ${
                statusFilter === f.key
                  ? 'bg-taupe text-white border-taupe'
                  : 'bg-surface text-ink-muted border-line hover:bg-sunken'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex bg-sunken border border-line p-0.5 gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setView('list')}
            aria-label="List view"
            className={`w-9 h-8 flex items-center justify-center transition-colors ${
              view === 'list' ? 'bg-surface border border-line text-ink' : 'text-ink-muted'
            }`}
          >
            <ListIcon size={16} />
          </button>
          <button
            type="button"
            onClick={() => setView('calendar')}
            aria-label="Calendar view"
            className={`w-9 h-8 flex items-center justify-center transition-colors ${
              view === 'calendar' ? 'bg-surface border border-line text-ink' : 'text-ink-muted'
            }`}
          >
            <CalendarIcon size={16} />
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-16 mobile-body-sm text-ink-muted">
          Loading your appointments…
        </div>
      )}

      {!loading && appointments.length === 0 && (
        <div className="bg-surface border border-line p-8 text-center">
          <CalendarClock size={28} className="text-ink-faint mx-auto mb-3" />
          <h2 className="mobile-h3 font-semibold text-ink mb-1">No appointments yet</h2>
          <p className="mobile-body-sm text-ink-muted mb-6 font-normal space-headline-para">
            Book a fitting or consultation with a store to see it here.
          </p>
          <Link
            href="/stores"
            className="btn-primary-mobile bg-taupe hover:bg-taupe-hover text-white max-w-[180px] mx-auto"
          >
            Browse Stores →
          </Link>
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
          <div className="space-y-3">
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
