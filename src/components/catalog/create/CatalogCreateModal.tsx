'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import Modal from '@/components/Modal';
import { useCatalogForm } from '../form/useCatalogForm';
import { buildSavePayload } from '../catalogHelpers';
import { validateCatalogSection } from '../editable/catalogSectionValidation';
import GalleryEditor from '../editable/editors/GalleryEditor';
import { FIELD, LABEL } from '../editable/editors/fieldStyles';

interface ServiceOption {
  id: number;
  name: string;
  is_active?: boolean | number;
}

/**
 * "+ Create New" on Catalog Designs: pick one of the shop's active services
 * (the design takes its name and is linked to it), add photos and a
 * description, then publish. Price and the rest stay on their defaults.
 */
export default function CatalogCreateModal({ isOpen, onClose, onCreated }: Readonly<{
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}>) {
  const { store } = useAuthStore();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceId, setServiceId] = useState('');
  // A fresh form each time the modal opens (the key below remounts it).
  const form = useCatalogForm({ onSubmit: async () => {}, submitting: saving });

  useEffect(() => {
    if (!isOpen || !store?.id) return;
    setLoadingServices(true);
    api.get(`/stores/${store.id}/services`)
      .then(res => {
        const list: ServiceOption[] = Array.isArray(res.data?.data) ? res.data.data : [];
        setServices(list.filter(s => s.is_active === undefined || Boolean(s.is_active)));
      })
      .catch(() => toast.error('Could not load your services.'))
      .finally(() => setLoadingServices(false));
  }, [isOpen, store?.id, toast]);

  const selected = services.find(s => String(s.id) === serviceId);

  const publish = async () => {
    if (!store?.id) return;
    if (!selected) return toast.error('Pick a service.');
    const problem = validateCatalogSection('gallery', form);
    if (problem) return toast.error(problem);
    setSaving(true);
    try {
      const payload = buildSavePayload(
        { ...form.formData, name: selected.name, service_id: String(selected.id) },
        form.features, form.featuresImage, form.sizeChart, form.careImage, form.images, form.measurementGuideImage,
        []
      );
      await api.post(`/stores/${store.id}/catalog`, payload);
      toast.success('Design published.');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not publish this design.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!saving) onClose(); }}
      title="New design"
      maxWidth="md:max-w-2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-11 px-5 border border-line-strong bg-white text-sm font-medium text-ink hover:bg-sunken transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={publish}
            disabled={saving || form.images.some(i => i.uploading)}
            className="h-11 px-5 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Publish design
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <label htmlFor="new-design-service" className={LABEL}>Service <span className="text-red-600">*</span></label>
          <select
            id="new-design-service"
            value={serviceId}
            onChange={e => setServiceId(e.target.value)}
            disabled={loadingServices}
            className={FIELD}
          >
            <option value="">{loadingServices ? 'Loading services…' : 'Select a service'}</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {!loadingServices && services.length === 0 && (
            <p className="text-xs text-ink-muted mt-1.5">No active services yet. Add one under Services first.</p>
          )}
        </div>

        <GalleryEditor edit={{ form, storeId: store?.id ?? 0, itemId: 0 }} showColors={false} />

        <div className="border-t border-line pt-4">
          <label htmlFor="new-design-desc" className={LABEL}>Description</label>
          <textarea
            id="new-design-desc"
            rows={5}
            name="description"
            value={form.formData.description}
            onChange={form.handleChange}
            placeholder="Tell clients about the design, silhouette details, and styling recommendations…"
            className={FIELD}
          />
        </div>
      </div>
    </Modal>
  );
}
