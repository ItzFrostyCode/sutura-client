import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import type { Service } from '../serviceHelpers';
import { buildPackagePayload, emptyPackageDraft, validatePackageSection, type PackageDraft, type PackageSection } from './packageEditing';

export const PACKAGE_STEPS: { key: PackageSection; title: string; hint: string; optional?: boolean }[] = [
  { key: 'photo', title: 'Photo', hint: 'The first thing customers see.', optional: true },
  { key: 'info', title: 'Basics', hint: 'Name the set and give it one flat price.' },
  { key: 'services', title: 'Included services', hint: 'Pick the services customers get in this set.' },
  { key: 'description', title: 'Description', hint: 'What it includes and who it is for.', optional: true },
];

export function usePackageWizard() {
  const router = useRouter();
  const toast = useToast();
  const { store } = useAuthStore();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<PackageDraft | null>(emptyPackageDraft);
  const [services, setServices] = useState<Service[]>([]);
  const [saving, setSaving] = useState(false);
  const last = step === PACKAGE_STEPS.length - 1;

  useEffect(() => {
    if (!store?.id) return;
    api.get(`/stores/${store.id}/services`).then(r => setServices((r.data.data ?? []).filter((s: Service) => s.is_active))).catch(() => setServices([]));
  }, [store?.id]);

  const next = async () => {
    const problem = draft ? validatePackageSection(PACKAGE_STEPS[step].key, draft) : null;
    if (problem) return toast.error(problem);
    if (!last) return setStep(step + 1);
    if (!store?.id || !draft) return;
    setSaving(true);
    try {
      const res = await api.post(`/stores/${store.id}/service-packages`, buildPackagePayload(draft));
      toast.success('Package created.');
      router.push(`/dashboard/services/packages/${res.data.data.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create this package.'));
      setSaving(false);
    }
  };

  const back = () => (step === 0 ? router.push('/dashboard/services?tab=packages') : setStep(step - 1));
  return { step, current: PACKAGE_STEPS[step], last, draft, setDraft, services, storeId: store?.id ?? 0, saving, next, back };
}
