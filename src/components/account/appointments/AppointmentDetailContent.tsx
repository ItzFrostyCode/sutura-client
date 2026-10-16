import AppointmentDetailHeader from './AppointmentDetailHeader';
import AppointmentDetailFacts from './AppointmentDetailFacts';
import AppointmentDetailNotices from './AppointmentDetailNotices';
import AppointmentDetailActions from './AppointmentDetailActions';

export interface AppointmentDetailData {
  id: number;
  appointment_type: string;
  intake_channel: string | null;
  status: string;
  scheduled_at: string;
  duration_minutes: number | null;
  service_name: string | null;
  service?: { id: number; name: string; service_category?: string | null; service_leaf_type?: string | null } | null;
  catalog_item?: {
    id: number;
    name: string;
    department?: string | null;
    subcategory?: string | null;
    garment_structure?: string | null;
    garment_type?: string | null;
  } | null;
  selected_size?: string | null;
  selected_color?: string | null;
  purpose_label?: string | null;
  rejection_reason?: string | null;
  rejection_note?: string | null;
  // The store's own hand-off after accepting (link + photos), and the flag set when a walk-in took this slot.
  shared_link?: string | null;
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
  cancellation_reason: string | null;
  rebooking_blocked: boolean;
  store: { name: string; slug: string; logo_path: string | null } | null;
  branch: { name: string; address: string | null; city: string | null } | null;
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
  const canSelfCancel = appt.status === 'pending' || appt.status === 'confirmed';
  const isPastDue = canSelfCancel && scheduled < new Date();

  return (
    <div className="card-soft p-4">
      <AppointmentDetailHeader appt={appt} />
      <AppointmentDetailFacts appt={appt} scheduled={scheduled} />
      <AppointmentDetailNotices appt={appt} isPastDue={isPastDue} />
      <AppointmentDetailActions appt={appt} canSelfCancel={canSelfCancel} cancelling={cancelling} onCancel={onCancel} onReschedule={onReschedule} />
    </div>
  );
}
