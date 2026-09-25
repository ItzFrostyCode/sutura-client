'use client';

import React from 'react';
import { Trash2, Gift } from 'lucide-react';
import { SERVICE_TYPES, SERVICE_TYPE_META } from '@/components/services/serviceHelpers';
import CollapsibleSection from '@/components/jobs/CollapsibleSection';
import { JobCreateFormData, RosterMember, ServiceData, ServiceField } from './types';

interface CustomSpecsSectionProps {
  readonly formData: JobCreateFormData;
  readonly setFormData: React.Dispatch<React.SetStateAction<JobCreateFormData>>;
  readonly selectedService?: ServiceData;
  readonly isSelectedAlterationRepair: boolean;
  readonly preExistingDamageNotes: string;
  readonly setPreExistingDamageNotes: (notes: string) => void;
  readonly customFieldValues: Record<string, string>;
  readonly setCustomFieldValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  readonly handleCheckboxChange: (fieldLabel: string, opt: string, selected: string[], checked: boolean) => void;
  readonly isBulkOrder: boolean;
  readonly setIsBulkOrder: (bulk: boolean) => void;
  readonly teamName: string;
  readonly setTeamName: (name: string) => void;
  readonly roster: RosterMember[];
  readonly setRoster: (roster: RosterMember[]) => void;
  readonly sectionTwoMeta: { icon: React.ElementType; bg: string; border: string; text: string };
}

export default function CustomSpecsSection({
  formData,
  setFormData,
  selectedService,
  isSelectedAlterationRepair,
  preExistingDamageNotes,
  setPreExistingDamageNotes,
  customFieldValues,
  setCustomFieldValues,
  handleCheckboxChange,
  isBulkOrder,
  setIsBulkOrder,
  teamName,
  setTeamName,
  roster,
  setRoster,
  sectionTwoMeta,
}: CustomSpecsSectionProps) {
  const SectionTwoIcon = sectionTwoMeta.icon;

  const renderCustomField = (field: ServiceField) => {
    if (field.type === 'select') {
      return (
        <select
          id={field.id}
          required={field.required}
          value={customFieldValues[field.label] || ''}
          onChange={(e) =>
            setCustomFieldValues((prev) => ({
              ...prev,
              [field.label]: e.target.value,
            }))
          }
          className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
        >
          <option value="">Select an option</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === 'radio') {
      return (
        <div className="flex flex-wrap gap-2 pt-1">
          {field.options?.map((opt) => {
            const isSelected = customFieldValues[field.label] === opt;
            return (
              <label
                key={opt}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                  isSelected
                    ? 'border-taupe bg-canvas text-ink'
                    : 'border-line bg-white text-ink-muted hover:border-line-strong hover:text-ink'
                }`}
              >
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={isSelected}
                  onChange={() =>
                    setCustomFieldValues((prev) => ({
                      ...prev,
                      [field.label]: opt,
                    }))
                  }
                  className="sr-only"
                />
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-taupe bg-taupe text-white' : 'border-ink-faint'
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                {opt}
              </label>
            );
          })}
        </div>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <div className="flex flex-wrap gap-2 pt-1">
          {field.options?.map((opt) => {
            const currentVal = customFieldValues[field.label] || '';
            const selected = currentVal
              ? currentVal
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              : [];
            const isChecked = selected.includes(opt);
            return (
              <label
                key={opt}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                  isChecked
                    ? 'border-taupe bg-canvas text-ink'
                    : 'border-line bg-white text-ink-muted hover:border-line-strong hover:text-ink'
                }`}
              >
                <input
                  type="checkbox"
                  name={field.id}
                  value={opt}
                  checked={isChecked}
                  onChange={(e) =>
                    handleCheckboxChange(field.label, opt, selected, e.target.checked)
                  }
                  className="sr-only"
                />
                <div
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                    isChecked ? 'border-taupe bg-taupe text-white' : 'border-ink-faint'
                  }`}
                >
                  {isChecked && (
                    <svg className="w-2 h-2 fill-current" viewBox="0 0 20 20">
                      <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                    </svg>
                  )}
                </div>
                {opt}
              </label>
            );
          })}
        </div>
      );
    }

    return (
      <input
        id={field.id}
        type={field.type === 'number' ? 'number' : 'text'}
        required={field.required}
        value={customFieldValues[field.label] || ''}
        onChange={(e) =>
          setCustomFieldValues((prev) => ({
            ...prev,
            [field.label]: e.target.value,
          }))
        }
        className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
        placeholder={`Enter ${field.label.toLowerCase()}...`}
      />
    );
  };

  return (
    <CollapsibleSection
      icon={<SectionTwoIcon size={16} className={sectionTwoMeta.text} />}
      iconBoxClassName={`${sectionTwoMeta.bg} border ${sectionTwoMeta.border}`}
      title="Custom Specifications & Notes"
      description={
        selectedService?.service_type
          ? `Fields adapted for ${SERVICE_TYPES.find((t) => t.value === selectedService.service_type)?.label}`
          : undefined
      }
      defaultOpen={false}
      forceOpenWhen={isBulkOrder || isSelectedAlterationRepair}
    >
      {selectedService?.service_type === 'fashion_bridal' && (
        <div
          className={`flex items-start gap-2 text-xs ${sectionTwoMeta.text} ${sectionTwoMeta.bg} border ${sectionTwoMeta.border} rounded-xl p-3`}
        >
          <SectionTwoIcon size={14} className="shrink-0 mt-0.5" />
          <span>
            Fashion/bridal garments typically need <strong>two fittings</strong> — book the base-fit and final-drape sessions separately from the Appointments tab once cutting begins.
          </span>
        </div>
      )}

      {isSelectedAlterationRepair && (
        <div className={`space-y-1 border ${sectionTwoMeta.border} ${sectionTwoMeta.bg} rounded-xl p-4`}>
          <label
            htmlFor="pre_existing_damage_notes"
            className={`flex items-center gap-1.5 text-xs font-bold ${sectionTwoMeta.text} uppercase tracking-wider`}
          >
            <SectionTwoIcon size={12} />
            Pre-Existing Damage / Condition Notes <span className="text-danger">*</span>
          </label>
          <p className="text-[11px] text-amber-700 mb-1">
            Log any existing stains, tears, or missing parts before starting work — protects the store from false damage claims later. Consider also attaching a photo in the Damage / Condition Photo section above.
          </p>
          <textarea
            id="pre_existing_damage_notes"
            value={preExistingDamageNotes}
            onChange={(e) => setPreExistingDamageNotes(e.target.value)}
            rows={2}
            className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe resize-y"
            placeholder="e.g. Small stain near hemline, missing one button on left cuff. No damage noted if left blank is not allowed — describe condition even if 'No visible damage.'"
          />
        </div>
      )}

      {/* Dynamic Custom Fields Section */}
      {formData.service_id && selectedService?.custom_fields && selectedService.custom_fields.length > 0 ? (
        <div className={`space-y-4 border ${sectionTwoMeta.border} rounded-xl p-4`}>
          <h4
            className={`flex items-center gap-1.5 text-xs font-bold ${sectionTwoMeta.text} border-b border-line pb-2 uppercase tracking-wider`}
          >
            <SectionTwoIcon size={12} />
            Custom Service Fields
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedService.custom_fields.map((field) => (
              <div key={field.id} className="space-y-1">
                <label htmlFor={field.id} className="block text-xs font-semibold text-ink-body">
                  {field.label} {field.required && <span className="text-danger">*</span>}
                </label>
                {renderCustomField(field)}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <label htmlFor="notes" className="block text-xs font-semibold text-ink-muted mb-1 uppercase tracking-wider">
          Notes & Instructions
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          className="w-full bg-canvas border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe min-h-24 resize-y"
          placeholder="Enter measurements, specific requests, or design notes here..."
        />
      </div>

      {/* Team Roster / Size Sheet Toggle */}
      <div className="border-t border-line pt-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isBulkOrder}
            onChange={(e) => {
              const checked = e.target.checked;
              setIsBulkOrder(checked);
              if (checked) {
                setFormData((prev) => ({ ...prev, measurement_id: '' }));
              }
            }}
            className="rounded border-line text-taupe focus:ring-taupe"
          />
          <span className="text-sm font-semibold text-ink-body">
            Include Team Roster / Size Sheet (For Bulk Sublimation / Uniforms)
          </span>
        </label>

        {isBulkOrder && (
          <div
            className={`mt-4 ${SERVICE_TYPE_META.bulk_sublimation.bg} border ${SERVICE_TYPE_META.bulk_sublimation.border} rounded-xl p-4 space-y-3`}
          >
            <div>
              <label
                htmlFor="team-name-input"
                className="block text-xs font-semibold text-ink-muted mb-1 uppercase tracking-wider"
              >
                Team Name
              </label>
              <input
                id="team-name-input"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Gilas Pilipinas, Blacklist Esports"
                className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe max-w-md"
              />
            </div>

            {selectedService?.min_order_qty && selectedService.min_order_qty > 1 && (
              <p
                className={`text-xs font-semibold px-3 py-2 rounded-lg border ${
                  roster.length < selectedService.min_order_qty
                    ? 'bg-danger/5 border-danger/20 text-danger'
                    : 'bg-sage/5 border-sage/20 text-sage'
                }`}
              >
                {roster.length} / {selectedService.min_order_qty} minimum pieces
                {roster.length < selectedService.min_order_qty &&
                  ' — add more players/items to meet this service\'s minimum order quantity'}
              </p>
            )}

            {roster.length >= 10 && (
              <p className="text-xs font-semibold px-3 py-2 rounded-lg border bg-amber-50 border-amber-200 text-amber-700 flex items-start gap-2">
                <Gift size={14} className="mt-0.5 shrink-0" />
                <span>
                  Freebies unlocked:{' '}
                  {roster.length >= 20
                    ? 'Free Layout + Free Banner + Free Coach Shirt'
                    : roster.length >= 15
                    ? 'Free Layout + Free Banner'
                    : 'Free Layout Design'}{' '}
                  (remember to apply manually to pricing)
                </span>
              </p>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider">Roster List</h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newRow = {
                        id: `${Date.now()}-${Math.random()}`,
                        name: '',
                        print_name: '',
                        number: '',
                        size: 'M',
                      };
                      setRoster([...roster, newRow]);
                    }}
                    className="bg-canvas hover:bg-line border border-line text-ink px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors"
                  >
                    + Add 1 Player
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newRows = Array.from({ length: 5 }).map((_, idx) => ({
                        id: `${Date.now()}-${Math.random()}-${idx}`,
                        name: '',
                        print_name: '',
                        number: '',
                        size: 'M',
                      }));
                      setRoster([...roster, ...newRows]);
                    }}
                    className="bg-canvas hover:bg-line border border-line text-ink px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors"
                  >
                    + Add 5 Players
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newRows = Array.from({ length: 10 }).map((_, idx) => ({
                        id: `${Date.now()}-${Math.random()}-${idx}`,
                        name: '',
                        print_name: '',
                        number: '',
                        size: 'M',
                      }));
                      setRoster([...roster, ...newRows]);
                    }}
                    className="bg-canvas hover:bg-line border border-line text-ink px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors"
                  >
                    + Add 10 Players
                  </button>
                </div>
              </div>
            </div>

            <div className="hidden sm:grid grid-cols-[28px_1fr_1fr_72px_72px_28px] gap-2 text-[10px] font-semibold text-blue-700/70 uppercase tracking-wider px-1">
              <span></span>
              <span>Player/Employee Name</span>
              <span>Print Name / Nickname</span>
              <span>Number</span>
              <span>Size</span>
              <span></span>
            </div>
            <div className="space-y-1.5">
              {roster.map((row, idx) => (
                <div
                  key={row.id}
                  className={`grid grid-cols-2 sm:grid-cols-[28px_1fr_1fr_72px_72px_28px] gap-2 items-center p-2 rounded-lg border border-blue-100 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/50'
                  }`}
                >
                  <span className="hidden sm:flex items-center justify-center text-[10px] font-bold text-blue-700 w-6 h-6 rounded-full bg-blue-100 shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    required
                    value={row.name}
                    placeholder="e.g. J. Arabejo"
                    onChange={(e) => {
                      const newRoster = [...roster];
                      newRoster[idx].name = e.target.value;
                      setRoster(newRoster);
                    }}
                    className="col-span-2 sm:col-span-1 w-full bg-surface border border-line rounded px-2 py-1.5 text-xs focus:outline-none focus:border-taupe"
                  />
                  <input
                    type="text"
                    value={row.print_name}
                    placeholder="e.g. FROSTY"
                    onChange={(e) => {
                      const newRoster = [...roster];
                      newRoster[idx].print_name = e.target.value;
                      setRoster(newRoster);
                    }}
                    className="w-full bg-surface border border-line rounded px-2 py-1.5 text-xs focus:outline-none focus:border-taupe"
                  />
                  <input
                    type="text"
                    value={row.number}
                    placeholder="e.g. 12"
                    onChange={(e) => {
                      const newRoster = [...roster];
                      newRoster[idx].number = e.target.value;
                      setRoster(newRoster);
                    }}
                    className="w-full bg-surface border border-line rounded px-2 py-1.5 text-xs focus:outline-none focus:border-taupe"
                  />
                  <select
                    value={row.size}
                    onChange={(e) => {
                      const newRoster = [...roster];
                      newRoster[idx].size = e.target.value;
                      setRoster(newRoster);
                    }}
                    className="w-full bg-surface border border-line rounded px-2 py-1.5 text-xs focus:outline-none"
                  >
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                  {roster.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setRoster(roster.filter((r) => r.id !== row.id))}
                      title="Remove"
                      className="flex items-center justify-center w-6 h-6 rounded-md text-danger hover:bg-danger/10 transition-colors shrink-0 justify-self-end sm:justify-self-auto cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-line pt-2 text-xs text-ink-muted font-semibold">
              <span>Total Items: {roster.length}</span>
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
