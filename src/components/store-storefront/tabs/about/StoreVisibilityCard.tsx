import React from 'react';
import { Eye, EyeOff, Zap } from 'lucide-react';
import StoreVisibilityToggle from '@/components/settings/StoreVisibilityToggle';
import EditableCard from './EditableCard';

interface StoreVisibilityCardProps {
  readonly isFeatured: boolean;
  readonly isHidden: boolean;
  readonly onHiddenChange: (value: boolean) => void;
  readonly isEditing: boolean;
  readonly saving: boolean;
  readonly onEdit: () => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
}

export default function StoreVisibilityCard({
  isFeatured, isHidden, onHiddenChange, isEditing, saving, onEdit, onCancel, onSave,
}: StoreVisibilityCardProps) {
  return (
    <EditableCard
      icon={isHidden ? <EyeOff size={16} className="text-taupe" /> : <Eye size={16} className="text-taupe" />}
      title="Store Visibility"
      isEditing={isEditing}
      saving={saving}
      onEdit={onEdit}
      onCancel={onCancel}
      onSave={onSave}
      editBody={
        <StoreVisibilityToggle
          isFeatured={isFeatured}
          isHidden={isHidden}
          onHiddenChange={onHiddenChange}
        />
      }
    >
      <div className="flex items-center gap-2 flex-wrap text-sm">
        <span className="text-ink-body font-medium">{isHidden ? 'Hidden from customers' : 'Visible to customers'}</span>
        {isFeatured && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
            <Zap size={10} /> Featured
          </span>
        )}
      </div>
    </EditableCard>
  );
}
