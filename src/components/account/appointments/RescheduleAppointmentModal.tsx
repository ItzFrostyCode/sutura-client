'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';
import InteractiveCalendar, { type AppointmentSlot, type OperatingHours, type SpecialHour } from '@/components/shared/InteractiveCalendar';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';

interface RescheduleAppointmentModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly appointmentId: number;
  readonly storeSlug: string;
  readonly branchId: number | null;
  readonly durationMinutes: number;
  readonly onMoved: () => Promise<void> | void;
}

interface Settings {
  operating_hours?: Record<string, OperatingHours> | string | null;
  special_hours?: SpecialHour[];
  max_appointments_per_day?: number | null;
}

// The customer's way out when a walk-in took their slot (or they simply need
// another time): same hours, closures and taken-slot rules as booking.
export default function RescheduleAppointmentModal({
  isOpen,
  onClose,
  appointmentId,
  storeSlug,
  branchId,
  durationMinutes,
  onMoved,
}: Readonly<RescheduleAppointmentModalProps>) {
  const toast = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setDate('');
    setTime('');
    Promise.all([
      api.get(`/catalog/${storeSlug}/booking-settings`),
      api.get(`/catalog/${storeSlug}/appointments`),
    ])
      .then(([s, a]) => {
        setSettings(s.data.data);
        setSlots(a.data.data ?? []);
      })
      .catch(() => toast.error('Could not load the store’s available times.'));
  }, [isOpen, storeSlug, toast]);

  const operatingHours = useMemo(() => {
    const raw = settings?.operating_hours;
    if (!raw) return null;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as Record<string, OperatingHours>;
      } catch {
        return null;
      }
    }
    return raw;
  }, [settings?.operating_hours]);

  const save = async () => {
    if (!date || !time) return;
    setSaving(true);
    try {
      await api.put(`/my-appointments/${appointmentId}/reschedule`, { scheduled_at: `${date}T${time}:00` });
      toast.success('Moved. The store will confirm the new time.');
      onClose();
      await onMoved();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not move your appointment.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pick a new time"
      maxWidth="max-w-lg"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className="h-11 px-5 border border-line-strong bg-white text-sm font-medium text-ink hover:bg-sunken cursor-pointer disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={save} disabled={saving || !date || !time} className="h-11 px-5 bg-taupe hover:bg-taupe/90 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50">
            {saving && <Loader2 size={16} className="animate-spin" />} Move my request
          </button>
        </>
      }
    >
      <p className="text-sm text-ink-muted mb-4">
        Choose another date and time. Your request stays with the store and is still waiting for their confirmation.
      </p>
      <InteractiveCalendar
        selectedDate={date}
        selectedTime={time}
        operatingHours={operatingHours}
        specialHours={settings?.special_hours ?? null}
        maxAppointmentsPerDay={settings?.max_appointments_per_day ?? null}
        appointments={slots}
        selectedBranchId={branchId ? String(branchId) : null}
        durationMinutes={durationMinutes}
        onDateChange={setDate}
        onTimeChange={setTime}
      />
    </Modal>
  );
}
