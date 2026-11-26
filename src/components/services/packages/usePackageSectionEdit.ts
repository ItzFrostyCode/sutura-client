import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import type { EditableBoxControl } from '@/components/catalog/editable/EditableBox';
import type { Service, ServicePackage } from '../serviceHelpers';
import { buildPackagePayload, packageSectionChanged, toPackageDraft, validatePackageSection, type PackageDraft, type PackageSection } from './packageEditing';

// One box at a time, same behaviour as the service and catalog design pages.
export function usePackageSectionEdit(pkg: ServicePackage | null, services: Service[], onSaved: () => Promise<void> | void, canManage = true) {
  const { store } = useAuthStore();
  const toast = useToast();
  const [editing, setEditing] = useState<PackageSection | null>(null);
  const [saving, setSaving] = useState(false);
  const saved = useMemo(() => (pkg ? toPackageDraft(pkg) : null), [pkg]);
  const [draft, setDraft] = useState<PackageDraft | null>(saved);

  useEffect(() => setDraft(saved), [saved]);

  const cancel = useCallback(() => { setEditing(null); setDraft(saved); }, [saved]);
  const isDirty = editing !== null && !!draft && !!saved && packageSectionChanged(editing, draft, saved);

  const save = async (section: PackageSection): Promise<boolean> => {
    if (!store?.id || !pkg || !draft) return false;
    const problem = validatePackageSection(section, draft);
    if (problem) { toast.error(problem); return false; }
    setSaving(true);
    try {
      await api.put(`/stores/${store.id}/service-packages/${pkg.id}`, buildPackagePayload(draft, pkg.is_active));
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

  const control = (section: PackageSection): EditableBoxControl => ({
    editing: editing === section,
    locked: editing !== null && editing !== section,
    saving: saving && editing === section,
    onEdit: () => setEditing(section),
    onCancel: cancel,
    onSave: () => save(section),
    readOnly: !canManage,
  });

  return { draft, setDraft, services, storeId: store?.id ?? 0, control, isDirty, saving, saveCurrent: async () => (editing ? save(editing) : true), discard: cancel };
}

export type PackageSectionEdit = ReturnType<typeof usePackageSectionEdit>;
