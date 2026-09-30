import { useMemo, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useCatalogForm } from '../form/useCatalogForm';
import { mapCatalogItemToState, buildSavePayload } from '../catalogHelpers';
import type { DetailedCatalogItem } from '../detail/detailTypes';
import { toCatalogItemResponse } from './catalogItemMappers';
import type { EditableBoxControl } from './EditableBox';
import { validateCatalogSection } from './catalogSectionValidation';

export type CatalogSection =
  | 'gallery'
  | 'info'
  | 'sizes'
  | 'sizeChart'
  | 'measurement'
  | 'spec'
  | 'description';

// Which payload fields each box owns. The backend's update() keeps every
// field that's absent from the request, so a box only ever writes its own.
// Photos and Colors are one editor: a color's photo is a regular catalog
// image tagged with the color name, so `images` and `color` save together.
const SECTION_KEYS: Record<CatalogSection, string[]> = {
  gallery: ['images', 'color'],
  info: ['name', 'price', 'estimated_days', 'estimated_days_max'],
  sizes: ['sizes'],
  sizeChart: ['size_chart_image_url', 'size_chart_columns', 'size_chart_rows'],
  measurement: ['measurement_guide'],
  spec: ['department', 'subcategory', 'garment_structure', 'garment_type', 'service_id', 'material', 'fabric_image_url', 'features'],
  description: ['description', 'care_instructions'],
};

const EMPTY_ITEM = { id: 0, name: '', price: 0 } as DetailedCatalogItem;

// `item` may still be loading (null) — hooks can't run conditionally, so the
// page calls this before its loading/not-found early returns.
export function useCatalogSectionEdit(loadedItem: DetailedCatalogItem | null, onSaved: () => Promise<void> | void, canManage = true) {
  const item = loadedItem ?? EMPTY_ITEM;
  const { store } = useAuthStore();
  const toast = useToast();
  const [editing, setEditing] = useState<CatalogSection | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // A fresh object whenever the saved item changes (or an edit is cancelled)
  // is what makes useCatalogForm re-seed its working state from the server copy.
  const initialData = useMemo(
    () => mapCatalogItemToState(toCatalogItemResponse(item)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item, resetKey]
  );
  const form = useCatalogForm({ initialData, onSubmit: async () => {}, submitting: saving });

  const cancel = useCallback(() => {
    setEditing(null);
    setResetKey(k => k + 1);
  }, []);

  // The full payload for a given working state. The default (first) color
  // reflects photo #1, so it carries no photo of its own.
  const payloadFor = (s: {
    formData: typeof form.formData; features: typeof form.features; featuresImage: string;
    sizeChart: typeof form.sizeChart; careImage: string; images: typeof form.images;
    measurementGuideImage: string; colorItems: typeof form.colorItems;
  }) =>
    buildSavePayload(
      s.formData, s.features, s.featuresImage, s.sizeChart, s.careImage, s.images, s.measurementGuideImage,
      s.colorItems.map((c, i) => (i === 0 ? { ...c, image_url: '' } : c))
    ) as Record<string, unknown>;

  const pick = (full: Record<string, unknown>, section: CatalogSection) =>
    Object.fromEntries(SECTION_KEYS[section].map(key => [key, full[key]]));

  // True once the open section differs from what is saved — drives the
  // "unsaved changes" prompt when the owner tries to leave.
  const isDirty = editing !== null
    && JSON.stringify(pick(payloadFor(form), editing)) !== JSON.stringify(pick(payloadFor(initialData), editing));

  const save = async (section: CatalogSection): Promise<boolean> => {
    if (!store?.id || !loadedItem) return false;
    const problem = validateCatalogSection(section, form);
    if (problem) {
      toast.error(problem);
      return false;
    }
    const body = pick(payloadFor(form), section);

    setSaving(true);
    try {
      await api.put(`/stores/${store.id}/catalog/${item.id}`, body);
      toast.success('Saved — customers see this right away.');
      setEditing(null);
      await onSaved();
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save this section.'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const control = (section: CatalogSection): EditableBoxControl => ({
    editing: editing === section,
    locked: editing !== null && editing !== section,
    saving: saving && editing === section,
    onEdit: () => setEditing(section),
    onCancel: cancel,
    onSave: () => save(section),
    readOnly: !canManage,
  });

  return {
    form,
    control,
    storeId: store?.id ?? 0,
    itemId: item.id,
    reload: onSaved,
    isDirty,
    saving,
    saveCurrent: async () => (editing ? save(editing) : true),
    discard: cancel,
  };
}

export type CatalogSectionEdit = ReturnType<typeof useCatalogSectionEdit>;

/** What the field editors actually need — the create steps supply the same three. */
export type CatalogDraftEdit = Pick<CatalogSectionEdit, 'form' | 'storeId' | 'itemId'>;
