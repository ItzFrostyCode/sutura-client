import React from 'react';

// "Other" appointments say what they are for in a few words — a general bucket, so the type list
// never needs another code change. Shown as "Other — {label}" everywhere.
export default function PurposeLabelField({ value, onChange }: Readonly<{ value: string; onChange: (v: string) => void }>) {
  return (
    <div className="mt-3">
      <label htmlFor="purpose-label" className="block text-sm font-medium text-ink-body mb-1">What is it for? <span className="text-rose-500">*</span></label>
      <input
        id="purpose-label"
        value={value}
        maxLength={60}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Fabric selection, Complaint discussion"
        className="w-full px-3.5 py-3 bg-surface border border-line text-ink text-base focus:outline-none focus:border-taupe"
      />
      <p className="text-[11px] text-ink-faint mt-1">{value.length}/60</p>
    </div>
  );
}
