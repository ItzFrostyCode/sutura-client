import React from 'react';
import { Tag } from 'lucide-react';
import SpecializationsSelector from '@/components/settings/SpecializationsSelector';
import { specializationLabel, visibleSpecializations } from '@/lib/storeSpecializations';
import EditableCard from './EditableCard';

interface SpecializationsCardProps {
  readonly specializations: string[];
  readonly onChange: (specializations: string[]) => void;
  readonly isEditing: boolean;
  readonly saving: boolean;
  readonly onEdit: () => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
}

export default function SpecializationsCard({ specializations, onChange, isEditing, saving, onEdit, onCancel, onSave }: SpecializationsCardProps) {
  // Old Men / Women / Kids tags stay saved but are not shown (2026-10-14).
  const labels = visibleSpecializations(specializations).map(specializationLabel);

  return (
    <EditableCard
      icon={<Tag size={16} className="text-taupe" />}
      title="Specializations"
      isEditing={isEditing}
      saving={saving}
      onEdit={onEdit}
      onCancel={onCancel}
      onSave={onSave}
      editBody={<SpecializationsSelector specializations={specializations} onChange={onChange} />}
    >
      {labels.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {labels.map((label) => (
            <span key={label} className="px-2 py-0.5 text-xs bg-canvas border border-line text-ink-body">{label}</span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-ink-muted">No specializations selected yet — this affects how often you show up in search.</p>
      )}
    </EditableCard>
  );
}
