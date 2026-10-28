'use client';

import React, { ComponentType, useState } from 'react';
import { User, Ruler, RefreshCw, Scissors, Calendar, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { CustomerData, MeasurementProfile, JobOrder, Appointment } from './customerTypes';

const PAGE_SIZE = 10;

interface CustomerActivityTimelineProps {
  readonly customer: CustomerData | null;
  readonly measurements: MeasurementProfile[];
  readonly jobs: JobOrder[];
  readonly appointments: Appointment[];
  /** Show only the most recent N events (the Overview short view). */
  readonly limit?: number;
  /** Shown at the top-right when `limit` is set and there are more events below it. */
  readonly onViewAll?: () => void;
  /** Paginate the full view instead of showing every event (the customer's activity tab). */
  readonly paged?: boolean;
}

/** Everything the shop has recorded for this client, newest first, auto-logged from real records. */
export default function CustomerActivityTimeline({
  customer,
  measurements,
  jobs,
  appointments,
  limit,
  onViewAll,
  paged,
}: CustomerActivityTimelineProps) {
  const [page, setPage] = useState(1);
  const buildEvents = () => {
    const events: {
      id: string;
      title: string;
      description: string;
      date: Date;
      icon: ComponentType<{ size?: number; className?: string }>;
      color: string;
    }[] = [];

    if (customer) {
      events.push({
        id: `cust-${customer.id}`,
        title: 'Client Profile Created',
        description: `Customer profile for ${customer.name} was added to the store database.`,
        date: new Date(customer.created_at),
        icon: User,
        color: 'bg-ink',
      });
    }

    measurements.forEach((m) => {
      if (m.created_at) {
        events.push({
          id: `meas-create-${m.id}`,
          title: `Specs Profile Added: ${m.profile_name}`,
          description: 'Recorded a new set of body measurement specs.',
          date: new Date(m.created_at),
          icon: Ruler,
          color: 'bg-sage',
        });
      }
      if (m.updated_at && m.updated_at !== m.created_at) {
        events.push({
          id: `meas-update-${m.id}`,
          title: `Specs Profile Updated: ${m.profile_name}`,
          description: 'Body measurement specs were revised.',
          date: new Date(m.updated_at),
          icon: RefreshCw,
          color: 'bg-ink-muted',
        });
      }
    });

    jobs.forEach((j) => {
      if (j.created_at) {
        events.push({
          id: `job-create-${j.id}`,
          title: `Job Order Placed: ${j.order_number}`,
          description: `Production run for ${j.service?.name || 'garment'}`,
          date: new Date(j.created_at),
          icon: Scissors,
          color: 'bg-espresso',
        });
      }
    });

    appointments.forEach((a) => {
      if (a.created_at) {
        events.push({
          id: `appt-create-${a.id}`,
          title: 'Appointment Booked',
          description: `Scheduled visit for ${new Date(a.scheduled_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.`,
          date: new Date(a.created_at),
          icon: Calendar,
          color: 'bg-taupe',
        });
      }
    });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const allEvents = buildEvents();
  const pages = Math.max(1, Math.ceil(allEvents.length / PAGE_SIZE));
  const hasMore = limit ? allEvents.length > limit : false;
  // The short Overview view shows the newest N; the paged tab view flips through the rest ten at a time.
  const events = limit ? allEvents.slice(0, limit) : paged ? allEvents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : allEvents;

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sunken flex items-center justify-center text-ink-muted shrink-0">
            <History size={15} />
          </div>
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink">Recent Activity</h3>
            <p className="text-xs text-ink-muted">{allEvents.length} recorded event{allEvents.length === 1 ? '' : 's'} for this client</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-ink-faint">Auto-logged</span>
          {hasMore && onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="flex items-center gap-0.5 text-xs font-bold text-taupe hover:text-ink transition-colors cursor-pointer"
            >
              View all <ChevronRight size={13} />
            </button>
          )}
        </div>
      </div>

      {events.length > 0 ? (
        <div className="relative pl-1 space-y-4 before:absolute before:left-[10px] before:top-2 before:bottom-2 before:w-px before:bg-line">
          {events.map((event) => {
            const Icon = event.icon;
            return (
              <div key={event.id} className="relative flex items-start justify-between gap-4 pl-8">
                <div className={`absolute left-0 top-0.5 w-[21px] h-[21px] rounded-full ${event.color} text-white flex items-center justify-center ring-2 ring-surface shrink-0`}>
                  <Icon size={12} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-ink">{event.title}</div>
                  <p className="text-xs text-ink-muted mt-0.5">{event.description}</p>
                </div>
                <span className="text-[11px] text-ink-faint whitespace-nowrap">
                  {event.date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-ink-faint italic">No activities recorded yet.</div>
      )}

      {paged && !limit && pages > 1 && (
        <div className="flex items-center justify-between border-t border-line pt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-line bg-white px-2.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-sunken hover:text-ink disabled:cursor-default disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-line bg-white px-2.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-sunken hover:text-ink disabled:cursor-default disabled:opacity-40"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
