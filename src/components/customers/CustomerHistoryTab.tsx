'use client';

import React, { ComponentType } from 'react';
import { User, Ruler, RefreshCw, Scissors, Calendar } from 'lucide-react';
import { CustomerData, MeasurementProfile, JobOrder, Appointment } from './customerTypes';

interface CustomerHistoryTabProps {
  readonly customer: CustomerData | null;
  readonly measurements: MeasurementProfile[];
  readonly jobs: JobOrder[];
  readonly appointments: Appointment[];
}

export default function CustomerHistoryTab({
  customer,
  measurements,
  jobs,
  appointments,
}: CustomerHistoryTabProps) {
  const getTimelineEvents = () => {
    const events: {
      id: string;
      type: 'customer' | 'measurement' | 'job' | 'appointment';
      title: string;
      description: string;
      date: Date;
      icon: ComponentType<{ size?: number; className?: string }>;
      color: string;
    }[] = [];

    // 1. Customer Created
    if (customer) {
      events.push({
        id: `cust-${customer.id}`,
        type: 'customer',
        title: 'Client Profile Created',
        description: `Customer profile for ${customer.name} was added to the shop database.`,
        date: new Date(customer.created_at),
        icon: User,
        color: 'bg-taupe text-white border-taupe',
      });
    }

    // 2. Measurements
    measurements.forEach(m => {
      if (m.created_at) {
        events.push({
          id: `meas-create-${m.id}`,
          type: 'measurement',
          title: `Specs Profile Added: ${m.profile_name}`,
          description: `Added a new measurement specifications profile (Version Profile #${m.id}).`,
          date: new Date(m.created_at),
          icon: Ruler,
          color: 'bg-emerald-600 text-white border-emerald-600',
        });
      }
      if (m.updated_at && m.updated_at !== m.created_at) {
        events.push({
          id: `meas-update-${m.id}`,
          type: 'measurement',
          title: `Specs Profile Updated: ${m.profile_name}`,
          description: `Modified the body measurements metrics for ${m.profile_name}.`,
          date: new Date(m.updated_at),
          icon: RefreshCw,
          color: 'bg-blue-600 text-white border-blue-600',
        });
      }
    });

    // 3. Job Orders
    jobs.forEach(j => {
      if (j.created_at) {
        events.push({
          id: `job-create-${j.id}`,
          type: 'job',
          title: `Job Order Placed: ${j.order_number}`,
          description: `Placed production run for ${j.service?.name || 'Garment'} with status "${j.status.toUpperCase()}".`,
          date: new Date(j.created_at),
          icon: Scissors,
          color: 'bg-amber-600 text-white border-amber-600',
        });
      }
    });

    // 4. Appointments
    appointments.forEach(a => {
      if (a.created_at) {
        events.push({
          id: `appt-create-${a.id}`,
          type: 'appointment',
          title: 'Appointment Booked',
          description: `Scheduled fitting/consultation for ${new Date(a.scheduled_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.`,
          date: new Date(a.created_at),
          icon: Calendar,
          color: 'bg-indigo-600 text-white border-indigo-600',
        });
      }
    });

    // Sort by date descending
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const timelineEvents = getTimelineEvents();

  return (
    <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm animate-fade-in">
      <h2 className="text-base font-bold text-ink mb-6">Client Activity History</h2>
      <div className="relative pl-6 border-l-2 border-line space-y-8 ml-3">
        {timelineEvents.map(event => {
          const Icon = event.icon;
          return (
            <div key={event.id} className="relative">
              {/* Circle marker with icon */}
              <span className={`absolute left-[-37px] top-0.5 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white ${event.color} shadow-sm shrink-0`}>
                <Icon size={12} />
              </span>
              <div>
                <div className="flex items-center justify-between gap-4">
                  <h4 className="font-bold text-sm text-ink">{event.title}</h4>
                  <span className="text-[10px] font-semibold text-ink-muted">
                    {event.date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-1">{event.description}</p>
              </div>
            </div>
          );
        })}
        {timelineEvents.length === 0 && (
          <div className="text-center py-8 text-sm text-ink-faint italic">
            No activities recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
