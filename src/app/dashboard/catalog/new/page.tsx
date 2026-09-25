'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import CatalogForm from '@/components/catalog/CatalogForm';
import { buildSavePayload } from '@/components/catalog/catalogHelpers';
import { useToast } from '@/context/ToastContext';

export default function NewCatalogItemPage() {
  const { store } = useAuthStore();
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const handleSave = async (payload: ReturnType<typeof buildSavePayload>) => {
    if (!store?.id) return;
    setSaving(true);
    try {
      await api.post(`/stores/${store.id}/catalog`, payload);
      router.push('/dashboard/catalog');
    } catch (err: unknown) {
      console.error(err);
      toast.error('Failed to save catalog item');
      setSaving(false);
    }
  };

  return (
    <CatalogForm
      title="Create Catalog Item"
      description="Add a new craftsmanship sample or bespoke design to your atelier catalog."
      submitLabel="Publish to Catalog"
      onSubmit={handleSave}
      submitting={saving}
    />
  );
}
