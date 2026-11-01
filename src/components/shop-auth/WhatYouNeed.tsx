const ITEMS = [
  'DTI business name registration',
  'TIN ID or BIR Form 2303',
  'Barangay business clearance',
  'A government ID',
  'A photo of your shop front',
] as const;

/** Folded away by default, so the form stays first; the owner can open it to see what the application asks for. */
export default function WhatYouNeed() {
  return (
    <details className="group mt-6 border-t border-line pt-4">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
        What you&apos;ll need to open a shop
        <span aria-hidden className="text-lg leading-none text-ink-muted group-open:hidden">+</span>
        <span aria-hidden className="hidden text-lg leading-none text-ink-muted group-open:inline">−</span>
      </summary>
      <ul className="mt-2 space-y-2">
        {ITEMS.map((t) => (
          <li key={t} className="flex gap-2.5 text-sm text-ink-body"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 bg-taupe" />{t}</li>
        ))}
      </ul>
      <p className="mobile-caption mt-3 text-ink-muted">You send these after you sign in. The SUTURA team checks them before your shop goes live, and your 14 free days start once it is approved.</p>
    </details>
  );
}
