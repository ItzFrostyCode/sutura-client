'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';
import CatalogForm from '@/components/catalog/CatalogForm';
import { mapCatalogItemToState, buildSavePayload } from '@/components/catalog/catalogHelpers';
import { BulletItem, ImageItem, CatalogFormData } from '@/components/catalog/catalogTypes';
import type { SizeChartValue } from '@/components/shared/SizeChartEditor';
import { useToast } from '@/context/ToastContext';

interface CatalogState {
  features: BulletItem[];
  featuresImage: string;
  sizeChart: SizeChartValue;
  careImage: string;
  formData: CatalogFormData;
  images: ImageItem[];
}

export default function EditCatalogItemPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;

  const { shop, user } = useAuthStore();
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<CatalogState | undefined>(undefined);

  useEffect(() => {
    if (shop?.id && id) {
      api
        .get(`/shops/${shop.id}/catalog`)
        .then(res => {
          const item = res.data.data.find((i: { id: number }) => i.id.toString() === id);
          if (item) {
            const state = mapCatalogItemToState(item);
            setInitialData(state);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else if (user?.id && !shop?.id) {
      setTimeout(() => setLoading(false), 0);
    }
  }, [shop?.id, user?.id, id]);

  const handleSave = async (payload: ReturnType<typeof buildSavePayload>) => {
    if (!shop?.id) return;
    setSaving(true);
    try {
      await api.put(`/shops/${shop.id}/catalog/${id}`, payload);
      router.push('/dashboard/catalog');
    } catch (err: unknown) {
      console.error(err);
      toast.error('Failed to save catalog item');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-taupe mx-auto mb-4" />
          <p className="text-sm text-ink-muted font-medium">Loading catalog details...</p>
        </div>
      </div>
    );
  }

  return (
    <CatalogForm
      title="Edit Catalog Item"
      description="Modify premade designs or rental products in your storefront catalog."
      submitLabel="Save Changes"
      initialData={initialData}
      onSubmit={handleSave}
      submitting={saving}
    />
  );
}
