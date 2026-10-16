import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { buildServicePayload, emptyServiceDraft, validateSection, type ServiceDraft, type ServiceSection } from '../detail/serviceEditing';

export const WIZARD_STEPS: { key: ServiceSection; title: string; hint: string; optional?: boolean }[] = [
  { key: 'photo', title: 'Photo', hint: 'The first thing customers see.', optional: true },
  { key: 'info', title: 'Basics', hint: 'Name, starting price and how long it takes.' },
  { key: 'type', title: 'Kind of work', hint: 'Make, uniforms & jerseys, alter & repair, or embroider.' },
  { key: 'garments', title: 'Garments', hint: 'The clothing you work on, by category.' },
  { key: 'capabilities', title: 'What you do', hint: 'Select only the tasks you offer. Customers are matched to these.' },
  { key: 'spec', title: 'Prices & add-ons', hint: 'What you charge, add-ons, and where it shows on your shop page.' },
  { key: 'chart', title: 'Reference chart', hint: 'A size or measurement chart customers can check.', optional: true },
  { key: 'description', title: 'Description', hint: 'What it covers and what to bring.', optional: true },
  { key: 'booking', title: 'Booking form', hint: 'Extra questions customers answer when they order.', optional: true },
  { key: 'requirements', title: 'Requirements', hint: 'Measurements, fitting and payment first. Leave on the shop default if unsure.', optional: true },
];

// Only ever return to a dashboard page — never an arbitrary URL.
const safeReturn = (v: string | null) => (v?.startsWith('/dashboard/') && !v.startsWith('//') ? v : null);

export function useServiceWizard() {
  const router = useRouter();
  const toast = useToast();
  const { store } = useAuthStore();
  const returnTo = safeReturn(useSearchParams().get('return'));
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ServiceDraft | null>(emptyServiceDraft);
  const [saving, setSaving] = useState(false);
  const last = step === WIZARD_STEPS.length - 1;

  const leave = () => router.push(returnTo ?? '/dashboard/services');

  const next = async () => {
    const problem = draft ? validateSection(WIZARD_STEPS[step].key, draft) : null;
    if (problem) return toast.error(problem);
    if (!last) return setStep(step + 1);
    if (!store?.id || !draft) return;
    setSaving(true);
    try {
      const res = await api.post(`/stores/${store.id}/services`, buildServicePayload(null, draft));
      toast.success('Service created.');
      const id = res.data.data.id;
      router.push(returnTo ? `${returnTo}?linked_service=${id}` : `/dashboard/services/${id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create this service.'));
      setSaving(false);
    }
  };

  const back = () => (step === 0 ? leave() : setStep(step - 1));

  return { step, current: WIZARD_STEPS[step], last, draft, setDraft, saving, next, back, leave, storeId: store?.id ?? 0 };
}
