'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, CalendarDays, Clock, CheckCircle2, XCircle, Ban,
  Info, Lock, Loader2, AlertCircle, Wallet, FileText, Link as LinkIcon,
} from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import AccountHeader from '@/components/account/AccountHeader';

interface AppointmentDetail {
  id: number;
  appointment_type: string;
  intake_channel: string | null;
  status: string;
  scheduled_at: string;
  duration_minutes: number | null;
  service_name: string | null;
  payment_status: string;
  payment_method: string | null;
  notes: string | null;
  reference_link: string | null;
  cancellation_reason: string | null;
  rebooking_blocked: boolean;
  shop: { name: string; slug: string; logo_path: string | null } | null;
  branch: { name: string; address: string | null; city: string | null } | null;
}

const STATUS_META: Record<string, { label: string; Icon: typeof Clock; tone: string }> = {
  pending: { label: 'Pending Confirmation', Icon: Clock, tone: 'text-ink-muted bg-sunken border-line' },
  confirmed: { label: 'Confirmed', Icon: CheckCircle2, tone: 'text-sage bg-sage/10 border-sage/20' },
  in_progress: { label: 'In Progress', Icon: Clock, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  completed: { label: 'Completed', Icon: CheckCircle2, tone: 'text-sage bg-sage/10 border-sage/20' },
  cancelled: { label: 'Cancelled', Icon: XCircle, tone: 'text-danger bg-danger/10 border-danger/20' },
  no_show: { label: 'No Show', Icon: Ban, tone: 'text-danger bg-danger/10 border-danger/20' },
};

const TYPE_LABELS: Record<string, string> = {
  consultation: 'Consultation', measurement: 'Measurement', fitting: 'Fitting',
  alteration: 'Alteration', pickup: 'Pickup',
};

export default function AppointmentDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();

  const [appt, setAppt] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    api.get(`/my-appointments/${id}`)
      .then((res) => setAppt(res.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSelfCancel = async () => {
    if (!appt || !window.confirm('Cancel this appointment? This can’t be undone.')) return;
    setCancelling(true);
    try {
      await api.delete(`/my-appointments/${appt.id}`);
      toast.success('Appointment cancelled.');
      router.push('/account/appointments');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to cancel appointment. Please try again.';
      toast.error(message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div>
      <AccountHeader title="Appointment Details" backHref="/account/appointments" />

      {loading && <div className="text-center py-16 text-sm text-ink-muted">Loading…</div>}

      {!loading && notFound && (
        <div className="bg-surface border border-line rounded-2xl p-10 text-center">
          <AlertCircle size={28} className="text-danger mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-body mb-1">Appointment not found</p>
          <p className="text-xs text-ink-muted mb-5">This appointment doesn&apos;t exist or doesn&apos;t belong to your account.</p>
          <Link href="/account/appointments" className="text-sm font-semibold text-taupe hover:text-taupe-hover">
            Back to My Appointments →
          </Link>
        </div>
      )}

      {!loading && appt && (() => {
        const meta = STATUS_META[appt.status] ?? STATUS_META.pending;
        const StatusIcon = meta.Icon;
        const scheduled = new Date(appt.scheduled_at);
        const canSelfCancel = appt.status === 'pending' || appt.status === 'confirmed';
        // A pending/confirmed appointment whose time has already come and
        // gone with no resolution (no in_progress/completed/no_show/
        // cancelled transition) — the shop hasn't closed it out yet. Flag
        // it rather than silently showing "Confirmed" as if it's still
        // upcoming.
        const isPastDue = canSelfCancel && scheduled < new Date();

        return (
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              {appt.shop?.slug ? (
                <Link href={`/shop/${appt.shop.slug}`} className="text-sm font-semibold text-ink hover:text-taupe truncate min-w-0">
                  {appt.shop.name}
                </Link>
              ) : (
                <span className="text-sm font-semibold text-ink truncate min-w-0">Shop</span>
              )}
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${meta.tone}`}>
                <StatusIcon size={12} /> {meta.label}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10.5px] font-medium bg-sunken text-ink-muted rounded-full px-2.5 py-0.5">
                {TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type}
              </span>
              {appt.intake_channel === 'walk_in' && (
                <span className="text-[10.5px] font-semibold bg-surface text-ink-muted border border-line rounded-full px-2.5 py-0.5">WALK-IN</span>
              )}
            </div>

            <p className="text-base font-bold text-ink mb-4">
              {appt.service_name ?? (TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type)}
            </p>

            <div className="space-y-2.5 pb-4 mb-4 border-b border-line">
              <div className="flex items-center gap-2 text-sm text-ink-body">
                <CalendarDays size={14} className="text-ink-faint shrink-0" />
                {scheduled.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="flex items-center gap-2 text-sm text-ink-body">
                <Clock size={14} className="text-ink-faint shrink-0" />
                {scheduled.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}
                {appt.duration_minutes ? ` · ${appt.duration_minutes} min` : ''}
              </div>
              {appt.branch && (
                <div className="flex items-start gap-2 text-sm text-ink-body">
                  <MapPin size={14} className="text-ink-faint shrink-0 mt-0.5" />
                  <span>
                    {appt.branch.name}
                    {appt.branch.address ? `, ${appt.branch.address}` : ''}
                    {appt.branch.city ? `, ${appt.branch.city}` : ''}
                  </span>
                </div>
              )}
              {appt.payment_method && (
                <div className="flex items-center gap-2 text-sm text-ink-body">
                  <Wallet size={14} className="text-ink-faint shrink-0" />
                  Payment: {appt.payment_status} · {appt.payment_method}
                </div>
              )}
              {appt.notes && (
                <div className="flex items-start gap-2 text-sm text-ink-body">
                  <FileText size={14} className="text-ink-faint shrink-0 mt-0.5" />
                  <span>{appt.notes}</span>
                </div>
              )}
              {appt.reference_link && (
                <div className="flex items-center gap-2 text-sm">
                  <LinkIcon size={14} className="text-ink-faint shrink-0" />
                  <a href={appt.reference_link} target="_blank" rel="noopener noreferrer" className="text-taupe hover:text-taupe-hover truncate">
                    {appt.reference_link}
                  </a>
                </div>
              )}
            </div>

            {isPastDue && (
              <div className="flex items-start gap-2 mb-4 bg-sunken rounded-lg p-3 text-xs text-ink-body leading-relaxed">
                <AlertCircle size={13} className="text-ink-muted shrink-0 mt-0.5" />
                This appointment&apos;s scheduled time has already passed with no update from the shop. If you&apos;re not sure what happened, reach out to them directly.
              </div>
            )}

            {!isPastDue && appt.status === 'pending' && (
              <div className="flex items-start gap-2 mb-4 text-xs text-ink-body leading-relaxed">
                <Info size={13} className="text-ink-muted shrink-0 mt-0.5" />
                Waiting for the shop to confirm. Walk-ins are seen first come, first served — arriving early improves your spot in line.
              </div>
            )}

            {appt.status === 'cancelled' && (
              <div className="mb-4">
                {appt.cancellation_reason && (
                  <p className="text-xs text-ink-muted leading-relaxed mb-2">
                    <span className="font-semibold text-ink-body">Reason from shop:</span> {appt.cancellation_reason}
                  </p>
                )}
                {appt.rebooking_blocked ? (
                  <div className="flex items-center gap-2 h-10 rounded-lg bg-sunken text-ink-faint text-xs px-3">
                    <Lock size={13} /> Rebooking unavailable — contact the shop
                  </div>
                ) : appt.shop?.slug ? (
                  <Link
                    href={`/shop/${appt.shop.slug}/book`}
                    className="flex items-center justify-center gap-1.5 h-10 rounded-lg border border-line-strong text-taupe text-sm font-semibold hover:bg-sunken transition-colors"
                  >
                    Book a new appointment
                  </Link>
                ) : null}
              </div>
            )}

            {canSelfCancel && (
              <button
                type="button"
                onClick={handleSelfCancel}
                disabled={cancelling}
                className="w-full flex items-center justify-center gap-1.5 h-11 rounded-lg border border-danger/30 text-sm font-semibold text-danger hover:bg-danger/5 transition-colors disabled:opacity-50"
              >
                {cancelling && <Loader2 size={13} className="animate-spin" />}
                Cancel this appointment
              </button>
            )}
          </div>
        );
      })()}
    </div>
  );
}
