'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import AccountHeader from '@/components/account/AccountHeader';
import AppointmentDetailContent, { type AppointmentDetailData } from '@/components/account/appointments/AppointmentDetailContent';

export default function AppointmentDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();

  const [appt, setAppt] = useState<AppointmentDetailData | null>(null);
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
    <div className="w-full">
      <AccountHeader title="Appointment Details" backHref="/account/appointments" />

      {loading && (
        <div className="min-h-[50vh] flex items-center justify-center bg-white">
          <Loader2 size={28} className="animate-spin text-ink-faint" />
        </div>
      )}

      {!loading && notFound && (
        <div className="bg-surface border border-line p-8 text-center">
          <AlertCircle size={28} className="text-danger mx-auto mb-3" />
          <h2 className="mobile-h3 font-semibold text-ink mb-1">Appointment not found</h2>
          <p className="mobile-body-sm text-ink-muted mb-6 font-normal space-headline-para">
            This appointment doesn&apos;t exist or doesn&apos;t belong to your account.
          </p>
          <Link
            href="/account/appointments"
            className="btn-primary-mobile bg-taupe hover:bg-taupe-hover text-white max-w-[220px] mx-auto"
          >
            Back to My Appointments →
          </Link>
        </div>
      )}

      {!loading && appt && (
        <AppointmentDetailContent
          appt={appt}
          cancelling={cancelling}
          onCancel={handleSelfCancel}
        />
      )}
    </div>
  );
}
