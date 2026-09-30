import React from 'react';
import { Building2, Mail, MapPin, Phone } from 'lucide-react';
import { StoreSettingsData } from '@/components/settings/useSettings';
import EditableCard from './EditableCard';

interface ContactInfoCardProps {
  readonly formData: StoreSettingsData;
  readonly onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  readonly isEditing: boolean;
  readonly saving: boolean;
  readonly onEdit: () => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
}

const inputClass = 'w-full px-3 py-2 bg-canvas border border-line text-ink text-sm focus:outline-none focus:border-taupe';
const labelClass = 'text-xs font-medium text-ink-body';

function Field({ id, label, name, value, onChange, type = 'text', placeholder }: {
  readonly id: string; readonly label: string; readonly name: string; readonly value: string;
  readonly onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; readonly type?: string; readonly placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className={labelClass}>{label}</label>
      <input id={id} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} className={inputClass} />
    </div>
  );
}

function Row({ label, value }: { readonly label: React.ReactNode; readonly value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs text-ink-muted shrink-0 inline-flex items-center">{label}</span>
      <span className="text-sm text-ink-body font-medium truncate text-right">{value || '—'}</span>
    </div>
  );
}

export default function ContactInfoCard({ formData, onChange, isEditing, saving, onEdit, onCancel, onSave }: ContactInfoCardProps) {
  return (
    <EditableCard
      icon={<Building2 size={16} className="text-taupe" />}
      title="Basic Info & Contact"
      isEditing={isEditing}
      saving={saving}
      onEdit={onEdit}
      onCancel={onCancel}
      onSave={onSave}
      editBody={
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field id="store-name" label="Store Name" name="name" value={formData.name} onChange={onChange} />
            <Field id="store-email" label="Contact Email" name="email" type="email" value={formData.email} onChange={onChange} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field id="store-address" label="Address" name="address" value={formData.address} onChange={onChange} />
            <Field id="store-landmark" label="Landmark" name="landmark" value={formData.landmark ?? ''} onChange={onChange} placeholder="e.g. Near City Hall" />
            <Field id="store-city" label="City" name="city" value={formData.city} onChange={onChange} />
            <Field id="store-province" label="Province" name="province" value={formData.province} onChange={onChange} />
            <Field id="store-phone" label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={onChange} />
          </div>
        </div>
      }
    >
      <div className="divide-y divide-line/60">
        <Row label={<><Mail size={12} className="mr-1" />Email</>} value={formData.email} />
        <Row label={<><Phone size={12} className="mr-1" />Phone</>} value={formData.phone} />
        <Row label={<><MapPin size={12} className="mr-1" />Address</>} value={[formData.address, formData.landmark].filter(Boolean).join(', ')} />
        <Row label="City / Province" value={[formData.city, formData.province].filter(Boolean).join(', ')} />
      </div>
    </EditableCard>
  );
}
