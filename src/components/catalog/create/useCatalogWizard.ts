import { useState } from 'react';
import { emptyRequirementsDraft, requirementsPayload, validateRequirements } from '@/components/requirements/requirementsDraft';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useCatalogForm } from '../form/useCatalogForm';
import { buildSavePayload } from '../catalogHelpers';
import { validateCatalogSection } from '../editable/catalogSectionValidation';
import type { CatalogSection } from '../editable/useCatalogSectionEdit';

export const CATALOG_STEPS: { key: CatalogSection; title: string; hint: string; optional?: boolean }[] = [
  { key: 'gallery', title: 'Photos & colors', hint: 'Up to 10 photos. The first one is the main image.' },
  { key: 'info', title: 'Basics', hint: 'Design name, price and how long it takes to make.' },
  { key: 'sizes', title: 'Sizes', hint: 'Sizes you offer. Skip it for fully made-to-measure.', optional: true },
  { key: 'sizeChart', title: 'Size chart', hint: 'A reference chart customers can check.', optional: true },
  { key: 'measurement', title: 'Measurement guide', hint: 'How customers should measure themselves.', optional: true },
  { key: 'spec', title: 'Specification', hint: 'Category, garment type, fabric and highlights.', optional: true },
  { key: 'description', title: 'Description', hint: 'The story, care instructions and details.', optional: true },
  { key: 'requirements', title: 'Requirements', hint: 'Measurements, fitting and payment first. Leave on the default if unsure.', optional: true },
];

export function useCatalogWizard() {
  const router = useRouter();
  const toast = useToast();
  const { store } = useAuthStore();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [requirements, setRequirements] = useState(emptyRequirementsDraft);
  const form = useCatalogForm({ onSubmit: async () => {}, submitting: saving });
  const last = step === CATALOG_STEPS.length - 1;

  const next = async () => {
    const key = CATALOG_STEPS[step].key;
    const problem = key === 'requirements' ? validateRequirements(requirements) : validateCatalogSection(key, form);
    if (problem) return toast.error(problem);
    if (!last) return setStep(step + 1);
    if (!store?.id) return;
    setSaving(true);
    try {
      // The first color reflects photo #1, so it carries no photo of its own (same as the edit boxes).
      const payload = buildSavePayload(
        form.formData, form.features, form.featuresImage, form.sizeChart, form.careImage, form.images, form.measurementGuideImage,
        form.colorItems.map((c, i) => (i === 0 ? { ...c, image_url: '' } : c))
      );
      const res = await api.post(`/stores/${store.id}/catalog`, { ...payload, ...requirementsPayload(requirements) });
      toast.success('Design published.');
      const id = res.data?.data?.id;
      router.push(id ? `/dashboard/catalog/${id}` : '/dashboard/catalog');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not publish this design.'));
      setSaving(false);
    }
  };

  const back = () => (step === 0 ? router.push('/dashboard/catalog') : setStep(step - 1));

  return { step, current: CATALOG_STEPS[step], last, form, requirements, setRequirements, saving, next, back, storeId: store?.id ?? 0 };
}
