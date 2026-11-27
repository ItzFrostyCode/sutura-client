import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import type { EditableBoxControl } from '@/components/catalog/editable/EditableBox';
import type { Service } from '../serviceHelpers';
import { buildServicePayload, sectionChanged, toDraft, validateSection, type ServiceDraft, type ServiceSection } from './serviceEditing';

// One box at a time: open a section, edit the draft, Save (or Cancel to
// discard). Mirrors the catalog design page's editor, for services.
export function useServiceSectionEdit(service: Service | null, onSaved: () => Promise<void> | void, canManage = true) {
  const { store } = useAuthStore();
  const toast = useToast();
  const [editing, setEditing] = useState<ServiceSection | null>(null);
  const [saving, setSaving] = useState(false);
  const saved = useMemo(() => (service ? toDraft(service) : null), [service]);
  const [draft, setDraft] = useState<ServiceDraft | null>(saved);

  useEffect(() => setDraft(saved), [saved]);

  const cancel = useCallback(() => {
    setEditing(null);
    setDraft(saved);
  }, [saved]);

  const isDirty = editing !== null && !!draft && !!saved && sectionChanged(editing, draft, saved);

  const save = async (section: ServiceSection): Promise<boolean> => {
    if (!store?.id || !service || !draft) return false;
    const problem = validateSection(section, draft);
    if (problem) {
      toast.error(problem);
      return false;
    }
    setSaving(true);
    try {
      await api.put(`/stores/${store.id}/services/${service.id}`, buildServicePayload(service, draft));
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

  const control = (section: ServiceSection): EditableBoxControl => ({
    editing: editing === section,
    locked: editing !== null && editing !== section,
    saving: saving && editing === section,
    onEdit: () => setEditing(section),
    onCancel: cancel,
    onSave: () => save(section),
    readOnly: !canManage,
  });

  return {
    draft,
    setDraft,
    control,
    storeId: store?.id ?? 0,
    isDirty,
    saving,
    saveCurrent: async () => (editing ? save(editing) : true),
    discard: cancel,
    reload: onSaved,
  };
}

export type ServiceSectionEdit = ReturnType<typeof useServiceSectionEdit>;
