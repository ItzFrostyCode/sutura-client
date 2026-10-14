'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import RescheduleAppointmentModal from '@/components/account/appointments/RescheduleAppointmentModal';
import AccountHeader from '@/components/account/AccountHeader';
import EmptyState from '@/components/account/EmptyState';
import AppointmentDetailContent, { type AppointmentDetailData } from '@/components/account/appointments/AppointmentDetailContent';

export default function AppointmentDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();

  const [appt, setAppt] = useState<AppointmentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const load = () =>
    api.get(`/my-appointments/${id}`)
      .then((res) => setAppt(res.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="w-full">
      <AccountHeader title="Appointment Details" backHref="/account/appointments" />

      {loading && (
        <div className="min-h-[50vh] flex items-center justify-center bg-white">
          <Loader2 size={28} className="animate-spin text-ink-faint" />
        </div>
      )}

      {!loading && notFound && (
        <EmptyState Icon={AlertCircle} title="Appointment not found" message="This appointment doesn't exist or doesn't belong to your account." action={{ href: '/account/appointments', label: 'Back to My Appointments' }} />
      )}

      {!loading && appt && (
        <AppointmentDetailContent
          appt={appt}
          cancelling={cancelling}
          onCancel={handleSelfCancel}
          onReschedule={() => setRescheduleOpen(true)}
        />
      )}

      {appt?.store?.slug && (
        <RescheduleAppointmentModal
          isOpen={rescheduleOpen}
          onClose={() => setRescheduleOpen(false)}
          appointmentId={appt.id}
          storeSlug={appt.store.slug}
          branchId={appt.store_branch_id ?? null}
          durationMinutes={appt.duration_minutes ?? 60}
          onMoved={async () => { await load(); }}
        />
      )}
    </div>
  );
}
