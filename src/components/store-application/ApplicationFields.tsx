'use client';

import { useEffect, useState } from 'react';
import { FileCheck2, Upload } from 'lucide-react';

// Same flat input as the Sign In / Create Account forms: 48px+ tall, 16px
// text (no iOS zoom), sharp corners, ink focus border.
export const INPUT_CLASS =
  'w-full min-h-12 px-3.5 py-3 border border-line-strong bg-surface text-ink text-base focus:outline-none focus:border-ink transition-colors';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly label: string;
  readonly id: string;
}

export function TextField({ label, id, required, ...inputProps }: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-ink mb-2">
        {label}
        {required && <span className="text-danger">*</span>}
      </label>
      <input id={id} required={required} className={INPUT_CLASS} {...inputProps} />
    </div>
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
}

// A file input can't be re-populated after the user steps Back, so the
// chosen file lives in state and `required` only applies while it's empty.
export function FileField({ id, label, hint, accept, file, onChange, required = true }: FileFieldProps) {
  const preview = useObjectUrl(file);
  return (
    <div>
      <p className="text-sm text-ink mb-1">
        {label}
        {required && <span className="text-danger">*</span>}
      </p>
      <p className="mobile-caption text-ink-muted mb-2">{hint}</p>
      <label
        htmlFor={id}
        className={`flex min-h-14 cursor-pointer items-center gap-3 border border-dashed px-4 py-3 transition-colors hover:bg-sunken ${
          file ? 'border-sage bg-sage/5' : 'border-line-strong bg-surface'
        }`}
      >
        {file ? <FileCheck2 size={20} className="shrink-0 text-sage" /> : <Upload size={20} className="shrink-0 text-ink-muted" />}
        <span className={`min-w-0 truncate text-sm ${file ? 'text-ink' : 'text-ink-muted'}`}>
          {file ? file.name : 'Choose a file'}
        </span>
        {file && <span className="ml-auto shrink-0 text-sm text-ink underline underline-offset-2">Replace</span>}
      </label>
      {preview && (
        // The attached screenshot/photo, shown back so the owner can check it is the right one.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={`${label} preview`} className="mt-3 max-h-72 w-full border border-line bg-sunken object-contain" />
      )}
      <input
        id={id}
        type="file"
        accept={accept}
        required={required && !file}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="sr-only"
      />
    </div>
  );
}

export function StepActions({ onBack, nextLabel, busy = false }: { readonly onBack?: () => void; readonly nextLabel: string; readonly busy?: boolean }) {
  return (
    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
      {onBack ? (
        <button type="button" onClick={onBack} className="btn-secondary-mobile rounded-none! border border-ink text-ink uppercase tracking-widest text-sm">
          Back
        </button>
      ) : <span />}
      <button
        type="submit"
        disabled={busy}
        className="btn-primary-mobile rounded-none! bg-ink text-white uppercase tracking-widest text-sm disabled:opacity-50"
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
