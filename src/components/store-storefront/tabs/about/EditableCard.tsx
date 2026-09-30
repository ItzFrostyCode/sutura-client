import React from 'react';
import { Pencil, Loader2, Check, X } from 'lucide-react';

interface EditableCardProps {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly headerExtra?: React.ReactNode;
  readonly isEditing: boolean;
  readonly saving: boolean;
  readonly onEdit: () => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
  readonly children: React.ReactNode;
  readonly editBody: React.ReactNode;
  readonly className?: string;
}

// Every owner-editable card on the storefront's About tab uses this same
// shell: a pencil that swaps the card's own body into an inline edit form,
// with Save/Cancel right there — never a separate settings page. Editing
// always happens exactly where the info is displayed, and only one card
// can be in edit mode at a time (enforced by the parent), so edits never
// get mixed across sections.
export default function EditableCard({
  icon,
  title,
  headerExtra,
  isEditing,
  saving,
  onEdit,
  onCancel,
  onSave,
  children,
  editBody,
  className = '',
}: EditableCardProps) {
  return (
    <div className={`bg-surface border border-line p-4 sm:p-5 ${className}`}>
      <div className="flex items-center justify-between mb-3 gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <h3 className="mobile-h4 text-ink truncate">{title}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {headerExtra}
          {!isEditing && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${title}`}
              title={`Edit ${title}`}
              className="w-8 h-8 flex items-center justify-center border border-line bg-canvas hover:bg-sunken text-ink-muted hover:text-taupe transition-colors cursor-pointer"
            >
              <Pencil size={13} />
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3.5 flex-1 flex flex-col">
          <div className="flex-1">{editBody}</div>
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-line/60 mt-1 shrink-0">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="min-h-[40px] px-4 text-xs font-semibold text-ink-body hover:bg-sunken bg-canvas border border-line transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              <X size={13} /> Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="min-h-[40px] px-4 bg-taupe text-white text-xs font-bold hover:bg-[#8A7063] transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">{children}</div>
      )}
    </div>
  );
}
