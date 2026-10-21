import AppointmentDetailHeader from './AppointmentDetailHeader';
import AppointmentDetailFacts from './AppointmentDetailFacts';
import AppointmentDetailNotices from './AppointmentDetailNotices';
import AppointmentDetailActions from './AppointmentDetailActions';
import AppointmentOrderLink from './AppointmentOrderLink';
import type { MyJobOrder } from './appointmentTypes';

export interface AppointmentDetailData {
  id: number;
  job_order?: MyJobOrder | null;
  previous_scheduled_at?: string | null;
  appointment_type: string;
  intake_channel: string | null;
  status: string;
  scheduled_at: string;
  duration_minutes: number | null;
  service_name: string | null;
  service?: { id: number; name: string; service_category?: string | null } | null;
  catalog_item?: {
    id: number;
    name: string;
    garment_type?: string | null;
  } | null;
  selected_size?: string | null;
  selected_color?: string | null;
  purpose_label?: string | null;
  material_source?: 'shop' | 'own' | null;
  material_note?: string | null;
  rejection_reason?: string | null;
  rejection_note?: string | null;
  // The store's own hand-off after accepting (link + photos), and the flag set when a walk-in took this slot.
  checked_in_at?: string | null;
  shared_link?: string | null;
  shared_links?: string[];
  shared_notes?: string | null;
  shared_images?: string[];
  needs_new_time?: boolean;
  store_branch_id?: number | null;
  kind?: 'service' | 'shop' | 'production';
  // New bookings take no payment; only an older booking that did has this.
  has_payment?: boolean;
  payment_status: string;
  payment_method: string | null;
  notes: string | null;
  reference_link: string | null;
  reference_images?: string[] | null;
  cancellation_reason: string | null;
  rebooking_blocked: boolean;
  store: { name: string; slug: string; logo_path: string | null } | null;
  branch: { name: string; address: string | null; city: string | null } | null;
  items?: Array<{
    id: number;
    appointment_id: number;
    service_id?: number | null;
    catalog_item_id?: number | null;
    item_name: string;
    quantity: number;
    unit_price?: number | null;
    selected_size?: string | null;
    selected_color?: string | null;
    add_ons?: string[] | null;
    notes?: string | null;
  }> | null;
}

interface AppointmentDetailContentProps {
  appt: AppointmentDetailData;
  cancelling: boolean;
  onCancel: () => void;
  onReschedule: () => void;
}

/** One soft card for the whole appointment: who and what, when and where, what the status means, and what to do next. */
export default function AppointmentDetailContent({ appt, cancelling, onCancel, onReschedule }: Readonly<AppointmentDetailContentProps>) {
  const scheduled = new Date(appt.scheduled_at);
  // A fitting belongs to the order, so only the shop cancels it; the customer can pick another time.
  const canSelfCancel = (appt.status === 'pending' || appt.status === 'confirmed') && appt.kind !== 'production';
  const isPastDue = canSelfCancel && scheduled < new Date();

  return (
    <div className="card-soft p-4">
      <AppointmentDetailHeader appt={appt} />
      <AppointmentOrderLink appt={appt} />

      {appt.items && appt.items.length > 0 && (
        <div className="mt-4 p-3 bg-canvas border border-line rounded-xl space-y-2">
          <p className="mobile-overline text-taupe font-semibold tracking-wider">
            Requested Items ({appt.items.length})
          </p>
          <div className="divide-y divide-line/60">
            {appt.items.map((it) => (
              <div key={it.id} className="py-2 first:pt-0 last:pb-0 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="mobile-body-sm font-semibold text-ink truncate">{it.item_name}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-ink-muted">
                    {it.selected_size && <span>Size: {it.selected_size}</span>}
                    {it.selected_size && it.selected_color && <span>•</span>}
                    {it.selected_color && <span>{it.selected_color}</span>}
                    {it.add_ons && it.add_ons.length > 0 && (
                      <span className="text-taupe font-medium">Add-ons: {it.add_ons.join(', ')}</span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 bg-surface border border-line text-ink font-bold px-2 py-0.5 rounded text-xs">
                  {it.quantity} pcs
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <AppointmentDetailFacts appt={appt} scheduled={scheduled} />
      <AppointmentDetailNotices appt={appt} isPastDue={isPastDue} />
      <AppointmentDetailActions appt={appt} canSelfCancel={canSelfCancel} cancelling={cancelling} onCancel={onCancel} onReschedule={onReschedule} />
    </div>
  );
}
