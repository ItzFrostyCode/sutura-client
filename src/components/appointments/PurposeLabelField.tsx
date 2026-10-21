import React from 'react';

// "Other" appointments say what they are for in a few words — a general bucket, so the type list
// never needs another code change. Shown as "Other — {label}" everywhere.
interface PurposeLabelFieldProps {
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly label?: string;
  readonly placeholder?: string;
  readonly helperText?: string;
}

// "Other" and "Alteration" appointments say what they are for in a few words
export default function PurposeLabelField({
  value,
  onChange,
  label = 'What is it for?',
  placeholder = 'e.g. Fabric selection, Complaint discussion',
  helperText,
}: PurposeLabelFieldProps) {
  return (
    <div className="mt-3">
      <label htmlFor="purpose-label" className="block text-sm font-semibold text-ink-body mb-1">
        {label} <span className="text-rose-500">*</span>
      </label>
      <input
        id="purpose-label"
        value={value}
        maxLength={60}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-3 bg-surface border border-line text-ink text-base rounded-xl focus:outline-none focus:border-taupe shadow-2xs"
      />
      <div className="flex items-center justify-between mt-1 text-[11px] text-ink-faint">
        <span>{helperText || 'Brief description of the request'}</span>
        <span>{value.length}/60</span>
      </div>
    </div>
  );
}
