'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AlertCircle, Check, FileText, Loader2, Plus, X } from 'lucide-react';
import { prepareUpload } from './uploadPrep';

/*
 * The shop application's look: Apple-style grouped forms (no glass, no blur). White rounded groups on the page
 * background, 16px text, soft focus rings, one primary button per screen. Everything on /register/store (and the
 * onboarding and "update your application" forms that reuse these pieces) is built from what is in this file.
 */

// The old flat input, still used by a few dashboard/admin dialogs. The application uses FIELD.
export const INPUT_CLASS =
  'w-full min-h-12 px-3.5 py-3 border border-line-strong bg-surface text-ink text-base focus:outline-none focus:border-ink transition-colors';

/** A text field: 48px tall on a phone (44px from 640px), 16px text (no zoom on iPhone), rounded, soft ring on focus. */
export const FIELD =
  'block w-full min-h-12 rounded-xl border border-line-strong/80 bg-surface px-4 py-3 sm:min-h-11 sm:py-2.5 text-base text-ink placeholder:text-ink-faint outline-none transition-[border-color,box-shadow] focus:border-ink/50 focus:ring-4 focus:ring-ink/[0.07] disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-muted';
export const FIELD_ERROR = 'border-danger! focus:border-danger! focus:ring-danger/10!';
export const LABEL = 'mb-1.5 flex items-baseline justify-between gap-2 text-[13px] font-medium text-ink-body';
const PRESS = 'transition-[background-color,transform,opacity] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100';
/** The one main button of a screen. */
export const BTN_PRIMARY = `inline-flex min-h-12 sm:min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-ink px-6 text-[15px] font-semibold text-white hover:bg-ink/90 ${PRESS}`;
/** A quiet button (Back, Cancel): grey fill, no outline. */
export const BTN_SECONDARY = `inline-flex min-h-12 sm:min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-sunken px-6 text-[15px] font-semibold text-ink hover:bg-line/70 ${PRESS}`;
/** A small rounded button inside a row (Add, Replace, Retake). */
export const BTN_PILL = `inline-flex min-h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-sunken px-4 text-[13px] font-semibold text-ink hover:bg-line/70 ${PRESS}`;

/** Live-check result shown under a field: red (taken / bad format), green (available), grey (checking). */
export interface FieldStatus {
  readonly tone: 'error' | 'success' | 'muted';
  readonly message: string;
}

/** The red asterisk after a required field's label (screen readers get aria-required instead). */
export function Req() {
  return <span className="ml-0.5 text-danger" aria-hidden="true">*</span>;
}

/** The red line under a field that needs fixing. */
export function FieldError({ id, message }: { readonly id: string; readonly message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-[13px] text-danger">
      <AlertCircle size={14} className="mt-px shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

/**
 * After Continue: brings the first field that needs fixing (in page order) to the middle of the screen,
 * focuses it on a computer (not on a phone, where the keyboard would cover it), and flashes it.
 * `ids` are element ids of fields, or of their [data-field] boxes.
 */
export function revealFirstProblem(ids: readonly string[]): void {
  if (typeof window === 'undefined' || ids.length === 0) return;
  // Twice: once for React to show the messages, once for the layout to settle.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const found = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    if (found.length === 0) return;
    found.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    const el = found[0];
    const box = el.closest<HTMLElement>('[data-field]') ?? el;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    const touch = window.matchMedia?.('(pointer: coarse)').matches;
    const target = el.matches('input, select, textarea, button') ? el : el.querySelector<HTMLElement>('input:not([type=hidden]):not([tabindex="-1"]), select, textarea, button');
    if (target && !touch) target.focus({ preventScroll: true });
    box.classList.remove('field-flash');
    void box.offsetWidth; // restart the animation when pressed again
    box.classList.add('field-flash');
    window.setTimeout(() => box.classList.remove('field-flash'), 1900);
  }));
}

/**
 * Enter inside a step goes to the next field (like "Next" on a phone keyboard) instead of pressing Continue:
 * a stray Enter in the street or a dropdown used to jump the page to the first missing field and flag errors.
 * Continue is pressed with the button itself. Put on each step's <form onKeyDown>.
 */
export function enterMovesOn(e: React.KeyboardEvent<HTMLFormElement>): void {
  if (e.key !== 'Enter' || e.defaultPrevented || e.nativeEvent.isComposing) return;
  const el = e.target as HTMLElement;
  if (!(el instanceof HTMLInputElement) || ['checkbox', 'radio', 'submit', 'button', 'file'].includes(el.type)) return;
  e.preventDefault();
  const fields = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('input:not([type=hidden]):not([type=file]):not([disabled]):not([tabindex="-1"]), select:not([disabled]), textarea:not([disabled])'))
    .filter((f) => f.offsetParent !== null);
  const next = fields[fields.indexOf(el) + 1];
  if (next) next.focus(); else el.blur();
}

// ---------- Layout ----------

/** A titled group: a white rounded card, with an optional note under it (like iOS Settings). */
export function Group({ id, title, footer, children, flush = false, invalid = false, required = false }: {
  readonly id?: string;
  readonly title?: ReactNode;
  /** A red asterisk after the title (the group must be answered). */
  readonly required?: boolean;
  readonly footer?: ReactNode;
  readonly children: ReactNode;
  /** No inner padding: for lists of rows (each row pads itself). */
  readonly flush?: boolean;
  readonly invalid?: boolean;
}) {
  return (
    <section id={id} data-field={id} className="scroll-mt-24">
      {title && <h3 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-muted">{title}{required && <Req />}</h3>}
      <div className={`rounded-2xl bg-surface ring-1 ${invalid ? 'ring-danger/70' : 'ring-line/80'} ${flush ? 'divide-y divide-line/80 overflow-hidden' : 'space-y-5 p-4 sm:space-y-4 sm:p-4 short:space-y-3'}`}>
        {children}
      </div>
      {footer && <div className="mt-2 px-1 text-[13px] leading-relaxed text-ink-muted">{footer}</div>}
    </section>
  );
}

/** Two choices side by side (Monthly / Yearly), iOS segmented control. */
export function Segmented<T extends string>({ label, options, value, onChange }: {
  readonly label: string;
  readonly options: readonly { readonly value: T; readonly label: string }[];
  readonly value: T;
  readonly onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex w-full rounded-xl bg-sunken p-1 sm:inline-flex sm:w-auto">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)}
            className={`min-h-9 flex-1 cursor-pointer rounded-lg px-5 text-[13px] font-semibold transition-colors sm:flex-none ${on ? 'bg-surface text-ink shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'text-ink-muted hover:text-ink'}`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** The round selection mark of a choice card. */
function RadioMark({ on }: { readonly on: boolean }) {
  return (
    <span aria-hidden="true" className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors ${on ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface'}`}>
      {on && <Check size={13} strokeWidth={3} />}
    </span>
  );
}

/** A selectable card (a plan, a way to pay): rounded, ringed in ink when chosen. */
export function ChoiceCard({ on, onClick, children, className = '' }: {
  readonly on: boolean;
  readonly onClick: () => void;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onClick}
      className={`relative flex w-full cursor-pointer flex-col rounded-2xl bg-surface p-4 text-left transition-[box-shadow] sm:p-5 ${on ? 'ring-2 ring-ink' : 'ring-1 ring-line/80 hover:ring-line-strong'} ${className}`}>
      <span className="absolute right-4 top-4"><RadioMark on={on} /></span>
      {children}
    </button>
  );
}

/** An agreement: a rounded checkbox and its text, in its own card. */
export function CheckRow({ id, checked, onChange, invalid = false, required = false, children }: {
  readonly id: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly invalid?: boolean;
  readonly required?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <label htmlFor={id} className={`flex cursor-pointer gap-3 rounded-2xl bg-surface p-4 ring-1 sm:p-5 ${invalid ? 'ring-danger/70' : 'ring-line/80'}`}>
      <span className="relative mt-0.5 h-[22px] w-[22px] shrink-0">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-invalid={invalid || undefined}
          className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-[7px] border-[1.5px] border-line-strong bg-surface transition-colors checked:border-ink checked:bg-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/10" />
        <Check size={14} strokeWidth={3} aria-hidden="true" className="pointer-events-none absolute inset-0 m-auto hidden text-white peer-checked:block" />
      </span>
      <span className="mobile-body-sm text-ink-body">{children}{required && <Req />}</span>
    </label>
  );
}

// ---------- Fields ----------

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly label: string;
  readonly id: string;
  readonly status?: FieldStatus | null;
  /** What is missing or wrong, shown after Continue (wins over `status`). */
  readonly error?: string;
  /** Shows "Optional" next to the label (required fields carry no mark, as in Apple's forms). */
  readonly optional?: boolean;
}

const STATUS_TEXT: Record<FieldStatus['tone'], string> = {
  error: 'text-danger',
  success: 'text-emerald-700',
  muted: 'text-ink-muted',
};

export function TextField({ label, id, required, status, error, optional = false, className = '', ...inputProps }: TextFieldProps) {
  const shown: FieldStatus | null | undefined = error ? { tone: 'error', message: error } : status;
  const messageId = shown ? `${id}-status` : undefined;
  return (
    <div data-field={id}>
      <label htmlFor={id} className={LABEL}>
        <span>{label}{required && <Req />}</span>
        {optional && <span className="font-normal text-ink-faint">Optional</span>}
      </label>
      <input
        id={id}
        required={required}
        aria-required={required || undefined}
        className={`${FIELD} ${shown?.tone === 'error' ? FIELD_ERROR : shown?.tone === 'success' ? 'border-emerald-600/70!' : ''} ${className}`}
        aria-invalid={shown?.tone === 'error' || undefined}
        aria-describedby={messageId}
        {...inputProps}
      />
      {shown && (shown.tone === 'error'
        ? <FieldError id={messageId as string} message={shown.message} />
        : <p id={messageId} role="status" aria-live="polite" className={`mt-1.5 text-[13px] ${STATUS_TEXT[shown.tone]}`}>{shown.message}</p>)}
    </div>
  );
}

export type Requirement = 'Required' | 'Recommended';

/** Required: a red asterisk. Recommended / Optional: a small pill. */
export function RequirementTag({ value }: { readonly value: Requirement | 'Optional' }) {
  if (value === 'Required') return <Req />;
  return (
    <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 align-middle text-[11px] font-semibold ${value === 'Recommended' ? 'bg-sage/15 text-sage' : 'bg-sunken text-ink-muted'}`}>
      {value}
    </span>
  );
}

/** A photo shown full size over the page (solid dark backdrop, no blur). */
export function PhotoPreview({ src, alt, onClose }: { readonly src: string | null; readonly alt: string; readonly onClose: () => void }) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [src, onClose]);
  if (!src) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={alt} onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="max-h-[85vh] max-w-full rounded-2xl object-contain" onClick={(e) => e.stopPropagation()} />
      <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25">
        <X size={20} />
      </button>
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
  /** Recommended / Optional pill after the title. */
  readonly requirement?: Requirement;
  /** What is missing, shown after Continue. */
  readonly error?: string;
  /** 'row' sits inside a <Group flush> list; 'card' (default) stands on its own. */
  readonly variant?: 'row' | 'card';
}

/**
 * One document, as a list row: thumbnail (tap to see it full size), name, what to send, and Add / Replace.
 * The chosen file lives in state (a file input can't be refilled after stepping Back). Photos are shrunk to a
 * JPEG on the device first (uploadPrep): phone photos are too big for the server.
 */
export function FileField({ id, label, hint, accept, file, onChange, required = true, requirement, error, variant = 'card' }: FileFieldProps) {
  const preview = useObjectUrl(file);
  const [busy, setBusy] = useState(false);
  const [pickError, setPickError] = useState('');
  const [zoom, setZoom] = useState(false);
  const allowPdf = /pdf/i.test(accept);
  const message = pickError || error || '';

  const pick = async (picked: File | null | undefined) => {
    if (!picked) return;
    setBusy(true);
    setPickError('');
    const ready = await prepareUpload(picked, { allowPdf });
    setBusy(false);
    if (ready.error !== undefined) { setPickError(ready.error); return; }
    onChange(ready.file);
  };

  const row = (
    <div data-field={id} className="px-4 py-3.5 sm:px-5">
      <div className="flex items-center gap-3.5">
        {preview ? (
          <button type="button" onClick={() => setZoom(true)} aria-label={`See ${label} full size`}
            className="relative h-12 w-12 shrink-0 cursor-zoom-in overflow-hidden rounded-xl bg-sunken ring-1 ring-line/80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="h-full w-full object-cover" />
          </button>
        ) : (
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${file ? 'bg-sage/15 text-sage' : message ? 'bg-danger/10 text-danger' : 'bg-sunken text-ink-muted'}`}>
            {busy ? <Loader2 size={20} className="animate-spin" aria-hidden="true" /> : file ? <FileText size={20} aria-hidden="true" /> : <Plus size={20} aria-hidden="true" />}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium leading-snug text-ink">
            {label}
            {requirement ? <RequirementTag value={requirement} /> : <RequirementTag value={required ? 'Required' : 'Optional'} />}
          </p>
          <p className={`mt-0.5 text-[13px] ${file ? 'truncate text-ink-body' : 'text-ink-muted'}`}>
            {busy ? 'Preparing your file…' : file ? (
              <span className="inline-flex items-center gap-1"><Check size={13} strokeWidth={3} className="shrink-0 text-sage" aria-hidden="true" />{file.name}</span>
            ) : hint}
          </p>
        </div>
        <label htmlFor={id} className={`${BTN_PILL} ${busy ? 'pointer-events-none opacity-40' : ''}`}>
          {file ? 'Replace' : 'Add'}
        </label>
      </div>
      <FieldError id={`${id}-error`} message={message} />
      <input
        id={id}
        type="file"
        accept={accept}
        aria-label={label}
        aria-invalid={message ? true : undefined}
        aria-describedby={message ? `${id}-error` : undefined}
        disabled={busy}
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; void pick(f); }}
        className="sr-only"
      />
      <PhotoPreview src={zoom ? preview : null} alt={label} onClose={() => setZoom(false)} />
    </div>
  );

  if (variant === 'row') return row;
  return <div className={`overflow-hidden rounded-2xl bg-surface ring-1 ${message ? 'ring-danger/70' : 'ring-line/80'}`}>{row}</div>;
}

/** `aside`: shown on the left when there is no Back (step 1), e.g. "Already approved? Sign in". */
export function StepActions({ onBack, nextLabel, busy = false, aside }: { readonly onBack?: () => void; readonly nextLabel: string; readonly busy?: boolean; readonly aside?: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
      {onBack ? (
        <button type="button" onClick={onBack} className={`${BTN_SECONDARY} w-full sm:w-auto sm:min-w-32`}>Back</button>
      ) : aside ?? <span className="hidden sm:block" />}
      <button type="submit" disabled={busy} className={`${BTN_PRIMARY} w-full sm:w-auto sm:min-w-44`}>
        {busy && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
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
