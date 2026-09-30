import React from 'react';
import { StoreSettingsData } from '@/components/settings/useSettings';

const inputClass = 'w-full px-3 py-2 bg-canvas border border-line text-ink text-sm focus:outline-none focus:border-taupe';
const labelClass = 'text-xs font-medium text-ink-body';

interface BookingFlowEditFormProps {
  readonly formData: StoreSettingsData;
  readonly onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  readonly setFormData: React.Dispatch<React.SetStateAction<StoreSettingsData>>;
}

export default function BookingFlowEditForm({ formData, onChange, setFormData }: BookingFlowEditFormProps) {
  const handleAddQuestion = () => {
    setFormData((prev) => ({ ...prev, booking_questions: [...prev.booking_questions, ''] }));
  };
  const handleQuestionChange = (idx: number, value: string) => {
    setFormData((prev) => {
      const qs = [...prev.booking_questions];
      qs[idx] = value;
      return { ...prev, booking_questions: qs };
    });
  };
  const handleRemoveQuestion = (idx: number) => {
    setFormData((prev) => ({ ...prev, booking_questions: prev.booking_questions.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="booking-policy" className={labelClass}>Cancellation Policy & Service Description</label>
        <textarea id="booking-policy" name="booking_policy" value={formData.booking_policy || ''} onChange={onChange} rows={3} className={inputClass} />
      </div>

      <div className="space-y-1 max-w-xs">
        <label htmlFor="max-appointments" className={labelClass}>Max Appointments Per Day</label>
        <input
          id="max-appointments"
          type="number"
          min={1}
          value={formData.max_appointments_per_day ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            setFormData((prev) => ({ ...prev, max_appointments_per_day: val === '' ? null : Number.parseInt(val, 10) }));
          }}
          placeholder="Leave blank for unlimited"
          className={inputClass}
        />
      </div>

      <div className="space-y-3 pt-2 border-t border-line/60">
        <h4 className="text-xs font-semibold text-ink">Fitting & Payment Rules</h4>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <div className="space-y-1">
            <label htmlFor="fitting-limit" className={labelClass}>Free Fittings/Order</label>
            <input
              id="fitting-limit" type="number" min={1} value={formData.fitting_limit ?? ''}
              onChange={(e) => { const val = e.target.value; setFormData((prev) => ({ ...prev, fitting_limit: val === '' ? 3 : Number.parseInt(val, 10) })); }}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="fitting-fee" className={labelClass}>Fee per Extra (₱)</label>
            <input
              id="fitting-fee" type="number" min={0} step="0.01" value={formData.fitting_fee ?? ''}
              onChange={(e) => { const val = e.target.value; setFormData((prev) => ({ ...prev, fitting_fee: val === '' ? 0 : Number.parseFloat(val) })); }}
              className={inputClass}
            />
          </div>
        </div>

        <fieldset className="space-y-1.5">
          <legend className="text-xs font-medium text-ink-body mb-1">Once the free fitting limit is reached</legend>
          <label className="flex items-start gap-2 cursor-pointer select-none text-sm text-ink-body">
            <input type="radio" name="fitting_limit_policy" checked={formData.fitting_limit_policy === 'fee'} onChange={() => setFormData((prev) => ({ ...prev, fitting_limit_policy: 'fee' }))} className="mt-0.5" />
            Charge the extra-fitting fee
          </label>
          <label className="flex items-start gap-2 cursor-pointer select-none text-sm text-ink-body">
            <input type="radio" name="fitting_limit_policy" checked={formData.fitting_limit_policy === 'block'} onChange={() => setFormData((prev) => ({ ...prev, fitting_limit_policy: 'block' }))} className="mt-0.5" />
            Don&apos;t allow more fittings
          </label>
        </fieldset>

        <label className="flex items-start gap-2.5 cursor-pointer select-none text-sm text-ink-body">
          <input type="checkbox" checked={formData.repair_requires_downpayment} onChange={(e) => setFormData((prev) => ({ ...prev, repair_requires_downpayment: e.target.checked }))} className="mt-0.5" />
          Require 50% downpayment for repairs
        </label>
      </div>

      <div className="space-y-2 pt-2 border-t border-line/60">
        <div className="flex items-center justify-between">
          <span className={labelClass}>Custom Booking Questions</span>
          <button type="button" onClick={handleAddQuestion} className="text-xs text-taupe hover:underline cursor-pointer">+ Add Question</button>
        </div>
        {(formData.booking_questions || []).map((q, idx) => (
          <div key={`question-${idx}`} className="flex gap-2">
            <input type="text" value={q} onChange={(e) => handleQuestionChange(idx, e.target.value)} placeholder={`Question ${idx + 1}`} className={inputClass} />
            <button type="button" onClick={() => handleRemoveQuestion(idx)} className="px-3 bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer">&times;</button>
          </div>
        ))}
      </div>
    </div>
  );
}
