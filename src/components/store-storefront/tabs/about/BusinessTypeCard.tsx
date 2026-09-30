import React from 'react';
import { Store } from 'lucide-react';
import BusinessTypeSelector, { BUSINESS_TYPE_LABELS } from '@/components/settings/BusinessTypeSelector';
import EditableCard from './EditableCard';

interface BusinessTypeCardProps {
  readonly businessType: string;
  readonly onChange: (value: string) => void;
  readonly isEditing: boolean;
  readonly saving: boolean;
  readonly onEdit: () => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
}

export default function BusinessTypeCard({ businessType, onChange, isEditing, saving, onEdit, onCancel, onSave }: BusinessTypeCardProps) {
  return (
    <EditableCard
      icon={<Store size={16} className="text-taupe" />}
      title="Business Type"
      isEditing={isEditing}
      saving={saving}
      onEdit={onEdit}
      onCancel={onCancel}
      onSave={onSave}
      editBody={<BusinessTypeSelector businessType={businessType} onChange={onChange} />}
    >
      <p className="text-sm font-medium text-ink-body">{BUSINESS_TYPE_LABELS[businessType] || businessType}</p>
    </EditableCard>
  );
}
