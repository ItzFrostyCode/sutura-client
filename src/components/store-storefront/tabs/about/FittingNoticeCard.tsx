import React from 'react';
import { Ruler } from 'lucide-react';
import { StoreSettingsData } from '@/components/settings/useSettings';
import EditableCard from './EditableCard';

/** Same default and placeholders as the server (JobOrder::DEFAULT_FITTING_MESSAGE). */
export const DEFAULT_FITTING_MESSAGE = 'Your garment is ready for fitting. Please visit our tailoring shop within {days} days (by {date}).';

export function fittingPreview(message: string | null | undefined, days: number | null | undefined): string {
  const n = days || 7;
  const by = new Date(Date.now() + n * 86400000).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  return (message?.trim() || DEFAULT_FITTING_MESSAGE).replaceAll('{days}', String(n)).replaceAll('{date}', by);
}

const inputClass = 'w-full px-3 py-2 bg-canvas border border-line text-ink text-sm focus:outline-none focus:border-taupe';
const labelClass = 'text-xs font-medium text-ink-body';

interface FittingNoticeCardProps {
  readonly formData: StoreSettingsData;
  readonly setFormData: React.Dispatch<React.SetStateAction<StoreSettingsData>>;
  readonly isEditing: boolean;
  readonly saving: boolean;
  readonly onEdit: () => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
}

/**
 * The message a customer gets (app, email, SMS) when their order is moved to
 * Ready for Fitting, and how many days they have to come in. That's all.
 */
export default function FittingNoticeCard({ formData, setFormData, isEditing, saving, onEdit, onCancel, onSave }: FittingNoticeCardProps) {
  return (
    <EditableCard
      icon={<Ruler size={16} className="text-taupe" />}
      title="Fitting Notification"
      isEditing={isEditing}
      saving={saving}
      onEdit={onEdit}
      onCancel={onCancel}
      onSave={onSave}
      editBody={
        <div className="space-y-4">
          <p className="text-xs text-ink-muted">Sent to the customer when their order is moved to Ready for Fitting.</p>
          <div className="space-y-1">
            <label htmlFor="fitting-message" className={labelClass}>Message</label>
            <textarea
              id="fitting-message"
              rows={3}
              maxLength={300}
              value={formData.fitting_message || DEFAULT_FITTING_MESSAGE}
              onChange={(e) => setFormData((prev) => ({ ...prev, fitting_message: e.target.value }))}
              className={inputClass}
            />
            <p className="text-[11px] text-ink-muted">
              <code>{'{days}'}</code> becomes the number of days below and <code>{'{date}'}</code> the visit-by date.
            </p>
          </div>
          <div className="space-y-1 max-w-48">
            <label htmlFor="fitting-visit-days" className={labelClass}>Days to Come In for Fitting</label>
            <input
              id="fitting-visit-days" type="number" min={1} max={60} value={formData.fitting_visit_days ?? ''}
              onChange={(e) => { const val = Number.parseInt(e.target.value, 10); setFormData((prev) => ({ ...prev, fitting_visit_days: Number.isNaN(val) ? 7 : Math.min(60, Math.max(1, val)) })); }}
              className={inputClass}
            />
          </div>
          <p className="text-xs text-ink-body bg-canvas border border-line p-3">
            <span className="text-ink-muted">Customer sees: </span>
            &ldquo;{fittingPreview(formData.fitting_message, formData.fitting_visit_days)}&rdquo;
          </p>
        </div>
      }
    >
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-ink-muted text-xs">Days to come in</span>
          <span className="text-ink-body font-medium">{formData.fitting_visit_days} days</span>
        </div>
        <p className="text-xs text-ink-body">&ldquo;{fittingPreview(formData.fitting_message, formData.fitting_visit_days)}&rdquo;</p>
      </div>
    </EditableCard>
  );
}
