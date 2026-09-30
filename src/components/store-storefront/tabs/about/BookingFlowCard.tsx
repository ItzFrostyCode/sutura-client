import React from 'react';
import { Calendar } from 'lucide-react';
import { StoreSettingsData } from '@/components/settings/useSettings';
import EditableCard from './EditableCard';
import BookingFlowEditForm from './BookingFlowEditForm';

interface BookingFlowCardProps {
  readonly formData: StoreSettingsData;
  readonly onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  readonly setFormData: React.Dispatch<React.SetStateAction<StoreSettingsData>>;
  readonly isEditing: boolean;
  readonly saving: boolean;
  readonly onEdit: () => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
}

export default function BookingFlowCard({ formData, onChange, setFormData, isEditing, saving, onEdit, onCancel, onSave }: BookingFlowCardProps) {
  return (
    <EditableCard
      icon={<Calendar size={16} className="text-taupe" />}
      title="Booking Flow Setup"
      isEditing={isEditing}
      saving={saving}
      onEdit={onEdit}
      onCancel={onCancel}
      onSave={onSave}
      editBody={<BookingFlowEditForm formData={formData} onChange={onChange} setFormData={setFormData} />}
    >
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-ink-muted text-xs">Max appointments/day</span>
          <span className="text-ink-body font-medium">{formData.max_appointments_per_day ?? 'Unlimited'}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-ink-muted text-xs">Free fittings per order</span>
          <span className="text-ink-body font-medium">{formData.fitting_limit}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-ink-muted text-xs">After free fittings</span>
          <span className="text-ink-body font-medium">
            {formData.fitting_limit_policy === 'block' ? "Don't allow more" : `₱${formData.fitting_fee} fee`}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-ink-muted text-xs">Repairs require 50% DP</span>
          <span className="text-ink-body font-medium">{formData.repair_requires_downpayment ? 'Yes' : 'No'}</span>
        </div>
        {formData.booking_policy && (
          <p className="text-xs text-ink-muted pt-1.5 border-t border-line/60 whitespace-pre-line line-clamp-3">{formData.booking_policy}</p>
        )}
      </div>
    </EditableCard>
  );
}
