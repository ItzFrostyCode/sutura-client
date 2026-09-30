'use client';

import React from 'react';
import { Pencil, Loader2, Check } from 'lucide-react';

export interface EditableBoxControl {
  readonly editing: boolean;
  /** Another box is mid-edit — this pencil is disabled until it's saved or cancelled. */
  readonly locked: boolean;
  readonly saving: boolean;
  readonly onEdit: () => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
  /** Viewer can't edit (plain staff): the section shows, the pencil doesn't. */
  readonly readOnly?: boolean;
}

interface EditableBoxProps {
  readonly control: EditableBoxControl;
  /** Accessible name, and the "Editing …" label while open. */
  readonly label: string;
  /** With a title the pencil sits in a header row (numbered like the customer's accordion cards); without one it floats top-right. */
  readonly title?: string;
  readonly badge?: number;
  readonly saveDisabled?: boolean;
  readonly view: React.ReactNode;
  readonly children: React.ReactNode;
  readonly className?: string;
}

function PencilButton({ control, label, floating }: Readonly<{ control: EditableBoxControl; label: string; floating: boolean }>) {
  return (
    <button
      type="button"
      onClick={control.onEdit}
      disabled={control.locked}
      aria-label={`Edit ${label}`}
      title={control.locked ? 'Save or cancel the section you are editing first' : `Edit ${label}`}
      className={`w-11 h-11 shrink-0 flex items-center justify-center border border-[#6B5346] bg-[#6B5346] text-white shadow-sm hover:bg-ink hover:border-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${floating ? 'absolute top-2 right-2 z-20' : ''}`}
    >
      <Pencil size={16} />
    </button>
  );
}

// One section of the owner's design page: shows the exact customer-facing
// view, and swaps in that section's editor (with its own Save/Cancel) when
// the pencil is tapped — so there's no separate "form" to open.
export default function EditableBox({
  control,
  label,
  title,
  badge,
  saveDisabled,
  view,
  children,
  className = '',
}: EditableBoxProps) {
  const { editing } = control;

  return (
    <section
      className={`relative bg-white border transition-shadow ${editing ? 'border-[#6B5346] shadow-[0_0_0_3px_rgba(107,83,70,0.3),0_6px_24px_rgba(107,83,70,0.35)]' : 'border-line'} ${className}`}
      aria-label={label}
    >
      {title ? (
        <div className={`flex items-center justify-between gap-3 pl-4 pr-2 min-h-12 border-b ${editing ? 'border-[#6B5346]/40 bg-[#6B5346]/10' : 'border-line'}`}>
          <span className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-ink min-w-0">
            {badge !== undefined && (
              <span className="w-5 h-5 rounded-full bg-taupe text-white text-[11px] font-bold flex items-center justify-center shrink-0">{badge}</span>
            )}
            <span className="truncate">{editing ? `Editing ${title}` : title}</span>
          </span>
          {!editing && !control.readOnly && <PencilButton control={control} label={label} floating={false} />}
        </div>
      ) : (
        !editing && !control.readOnly && <PencilButton control={control} label={label} floating />
      )}

      {editing ? (
        <div>
          <div className="p-4 space-y-4">
            {!title && <p className="text-xs font-bold uppercase tracking-wider text-ink">Editing {label}</p>}
            {children}
          </div>
          <div className="flex flex-wrap justify-end gap-3 px-4 py-3 border-t border-line bg-canvas">
            <button
              type="button"
              onClick={control.onCancel}
              disabled={control.saving}
              className="h-11 px-5 border border-line-strong bg-white text-sm font-medium text-ink hover:bg-sunken transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={control.onSave}
              disabled={control.saving || saveDisabled}
              className="h-11 px-5 bg-taupe hover:bg-taupe/90 text-white text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {control.saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className={title ? 'p-4' : ''}>{view}</div>
      )}
    </section>
  );
}
