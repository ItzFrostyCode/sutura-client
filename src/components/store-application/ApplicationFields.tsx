'use client';

import { useEffect, useState } from 'react';
import { Check, FileText } from 'lucide-react';

// Flat square input still used by a few dashboard modals (GCash settings,
// change password, service discount). The application form uses FIELD_CLASS.
export const INPUT_CLASS =
  'w-full min-h-12 px-3.5 py-3 border border-line-strong bg-surface text-ink text-base focus:outline-none focus:border-ink transition-colors';

/** The application's input: rounded, 48px+ tall, 16px text (no iOS zoom), ink focus. */
export const FIELD_CLASS =
  'w-full min-h-12 rounded-xl border border-line-strong bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-faint transition-colors focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10';

/** Field label: sentence case, with a red asterisk when required or "Optional" on the right. */
export function FieldLabel({ htmlFor, label, required, optional }: {
  readonly htmlFor?: string;
  readonly label: React.ReactNode;
  readonly required?: boolean;
  readonly optional?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 flex items-baseline justify-between gap-3 text-sm font-medium text-ink-body">
      <span>
        {label}
        {required && <span className="text-danger" aria-hidden="true"> *</span>}
      </span>
      {optional && <span className="text-xs font-normal text-ink-faint">Optional</span>}
    </label>
  );
}

/**
 * A titled group: a small uppercase label above a white rounded card, with an
 * optional note under the card. Every step is built from these.
 */
export function Section({ label, tag, note, children, className = '', flush = false }: {
  readonly label?: React.ReactNode;
  /** Shown after the label, e.g. "Optional" or a Recommended chip. */
  readonly tag?: React.ReactNode;
  readonly note?: React.ReactNode;
  readonly children: React.ReactNode;
  readonly className?: string;
  /** No inner padding: for lists whose rows bring their own (divided rows). */
  readonly flush?: boolean;
}) {
  return (
    <section className={className}>
      {label && (
        <h3 className="mb-2.5 flex flex-wrap items-center gap-2 px-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
          {label}
          {tag}
        </h3>
      )}
      <div className={`rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(45,42,38,0.04)] ${flush ? 'overflow-hidden' : 'p-5 sm:p-6'}`}>
        {children}
      </div>
      {note && <div className="mt-2 px-1 text-xs leading-relaxed text-ink-muted">{note}</div>}
    </section>
  );
}

/** Live-check result shown under a field: red (taken / bad format), green (available), grey (checking). */
export interface FieldStatus {
  readonly tone: 'error' | 'success' | 'muted';
  readonly message: string;
}

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly label: string;
  readonly id: string;
  readonly status?: FieldStatus | null;
  /** Show "Optional" beside the label. */
  readonly optional?: boolean;
}

const STATUS_BORDER: Record<FieldStatus['tone'], string> = {
  error: 'border-danger! focus:border-danger! focus:ring-danger/10!',
  success: 'border-emerald-600! focus:border-emerald-600! focus:ring-emerald-600/10!',
  muted: '',
};
const STATUS_TEXT: Record<FieldStatus['tone'], string> = {
  error: 'text-danger',
  success: 'text-emerald-700',
  muted: 'text-ink-muted',
};

export function TextField({ label, id, required, status, optional, ...inputProps }: TextFieldProps) {
  const messageId = status ? `${id}-status` : undefined;
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} required={required} optional={optional} />
      <input
        id={id}
        required={required}
        className={`${FIELD_CLASS} ${status ? STATUS_BORDER[status.tone] : ''}`}
        aria-invalid={status?.tone === 'error' || undefined}
        aria-describedby={messageId}
        {...inputProps}
      />
      {status && (
        <p id={messageId} role="status" aria-live="polite" className={`mt-1.5 text-xs ${STATUS_TEXT[status.tone]}`}>
          {status.message}
        </p>
      )}
    </div>
  );
}

export type Requirement = 'Required' | 'Recommended';

/** After a title: a red asterisk when required, a small "Recommended" chip otherwise. */
export function RequirementTag({ value }: { readonly value: Requirement }) {
  if (value === 'Required') {
    return (
      <span className="text-danger">
        <span aria-hidden="true"> *</span><span className="sr-only"> (required)</span>
      </span>
    );
  }
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-sunken px-2 py-0.5 align-middle text-[11px] font-medium text-ink-muted">
      Recommended
    </span>
  );
}

interface FileFieldProps {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly accept: string;
  readonly file: File | undefined;
  readonly onChange: (file: File | null) => void;
  readonly required?: boolean;
  /** Shown after the title instead of the asterisk. */
  readonly requirement?: Requirement;
}

// A file input can't be re-populated after the user steps Back, so the
// chosen file lives in state and `required` only applies while it's empty.
// Drawn as one row (thumbnail · title · file name · Choose/Replace); put rows
// inside a <Section flush> with `divide-y` for the list look.
export function FileField({ id, label, hint, accept, file, onChange, required = true, requirement }: FileFieldProps) {
  const preview = useObjectUrl(file);
  // Set when the form is sent without this required file (the browser's
  // `invalid` event); cleared once a file is chosen.
  const [missing, setMissing] = useState(false);
  const showMissing = missing && !file;
  return (
    <div className={`relative px-4 py-3.5 sm:px-5 ${showMissing ? 'bg-danger/5' : ''}`} data-field={id}>
      <div className="flex items-center gap-3.5">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl ${showMissing ? 'bg-danger/10 text-danger' : 'bg-sunken text-ink-muted'}`}>
          {preview
            // The attached photo, shown back so the owner can check it is the right one.
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={preview} alt={`${label} preview`} className="h-full w-full object-cover" />
            : <FileText size={18} aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">
            {label}
            {requirement ? <RequirementTag value={requirement} /> : required && <RequirementTag value="Required" />}
          </p>
          {file ? (
            <p className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-ink-muted">
              <Check size={13} className="shrink-0 text-sage" aria-hidden="true" />
              <span className="truncate">{file.name}</span>
            </p>
          ) : (
            <p className={`mt-0.5 text-xs ${showMissing ? 'text-danger' : 'text-ink-muted'}`}>
              {showMissing ? 'Attach this file to continue.' : hint}
            </p>
          )}
        </div>
        <label
          htmlFor={id}
          className="inline-flex min-h-10 shrink-0 cursor-pointer items-center rounded-full bg-sunken px-4 text-xs font-semibold text-ink transition-colors hover:bg-sunken-hover"
        >
          {file ? 'Replace' : 'Choose'}
          <span className="sr-only"> {label}</span>
        </label>
      </div>
      <input
        id={id}
        type="file"
        accept={accept}
        required={required && !file}
        aria-invalid={showMissing || undefined}
        onInvalid={() => setMissing(true)}
        onChange={(e) => { setMissing(false); onChange(e.target.files?.[0] ?? null); }}
        className="sr-only"
      />
    </div>
  );
}

/** Back (soft) on the left, the main action (ink) on the right. */
export function StepActions({ onBack, nextLabel, busy = false }: { readonly onBack?: () => void; readonly nextLabel: string; readonly busy?: boolean }) {
  return (
    <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-sunken px-8 text-sm font-semibold text-ink transition-colors hover:bg-sunken-hover"
        >
          Back
        </button>
      ) : <span className="hidden sm:block" />}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-ink px-12 text-sm font-semibold text-white transition-colors hover:bg-ink/85 disabled:opacity-50"
      >
        {nextLabel}
      </button>
    </div>
  );
}

// Object URL for an attached image file (null for non-images / no file), revoked when it changes.
function useObjectUrl(file: File | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}
