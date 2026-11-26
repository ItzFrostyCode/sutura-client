import React from 'react';
import { Info } from 'lucide-react';
import EditableCard from './EditableCard';

interface DescriptionEditBundle {
  readonly isEditing: boolean;
  readonly saving: boolean;
  readonly onEdit: () => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
  readonly value: string;
  readonly onChange: (value: string) => void;
}

interface DescriptionCardProps {
  readonly description: string;
  readonly edit?: DescriptionEditBundle;
}

function DescriptionView({ description }: { readonly description: string }) {
  return (
    <p className="flex-1 flex items-center mobile-body-lg sm:text-lg text-ink-body font-normal leading-relaxed whitespace-pre-line">
      {description || 'No description provided yet.'}
    </p>
  );
}

export default function DescriptionCard({ description, edit }: DescriptionCardProps) {
  if (!edit) {
    return (
      <div className="bg-surface border border-line p-6 sm:p-8 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3 shrink-0">
          <Info size={16} className="text-taupe" />
          <h3 className="mobile-h4 text-ink">Description</h3>
        </div>
        <DescriptionView description={description} />
      </div>
    );
  }

  return (
    <EditableCard
      icon={<Info size={16} className="text-taupe" />}
      title="Description"
      isEditing={edit.isEditing}
      saving={edit.saving}
      onEdit={edit.onEdit}
      onCancel={edit.onCancel}
      onSave={edit.onSave}
      className="h-full flex flex-col p-6 sm:p-8"
      editBody={
        <textarea
          value={edit.value}
          onChange={(e) => edit.onChange(e.target.value)}
          rows={8}
          placeholder="Tell customers what your shop does best..."
          className="w-full h-full min-h-[160px] px-3 py-2 bg-canvas border border-line text-ink text-base focus:outline-none focus:border-taupe resize-none"
        />
      }
    >
      <DescriptionView description={description} />
    </EditableCard>
  );
}
