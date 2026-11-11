'use client';

import { useEffect, useRef, type FormEvent } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

interface TrackCodeFormProps {
  readonly id: string;
  readonly code: string;
  readonly onCodeChange: (value: string) => void;
  readonly error: string;
  readonly checking: boolean;
  readonly onSubmit: () => void;
}

/**
 * The tracking-code box + Track button, used on Discover and on /track. The button is never disabled: pressing it with
 * an empty or wrong code is how the person gets told what to fix (the message sits under the box, and focus returns
 * to the box so they can type the right code straight away).
 */
export default function TrackCodeForm({ id, code, onCodeChange, error, checking, onSubmit }: TrackCodeFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = `${id}-error`;

  useEffect(() => {
    if (error) inputRef.current?.focus();
  }, [error]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!checking) onSubmit();
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex gap-3">
        <label htmlFor={id} className="sr-only">Tracking code</label>
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          placeholder="e.g. TNED8K2P"
          maxLength={24}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`h-12 min-w-0 flex-1 rounded-xl border bg-surface px-4 text-base uppercase tracking-widest text-ink placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-faint focus:outline-none focus:ring-1 ${
            error ? 'border-[#9C4F40] focus:border-[#9C4F40] focus:ring-[#9C4F40]' : 'border-line focus:border-taupe-dark focus:ring-taupe-dark'
          }`}
        />
        <button
          type="submit"
          aria-busy={checking || undefined}
          className="flex h-12 shrink-0 items-center gap-2 rounded-xl bg-taupe-dark px-5 text-base font-semibold text-white transition-colors hover:bg-nav-bar disabled:opacity-60"
          disabled={checking}
        >
          {checking && <Loader2 size={18} className="animate-spin" aria-hidden />}
          {checking ? 'Checking' : 'Track'}
        </button>
      </div>
      {error && (
        // #9C4F40: the danger red darkened to 5.8:1 (the --accent-danger token is 4.15:1, under AA for 14px text).
        <p id={errorId} role="alert" className="mobile-body-sm mt-2 flex items-start gap-1.5 text-[#9C4F40]">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </form>
  );
}
