import React from 'react';

// Placeholder for a section the customer page hides when it is empty — the
// owner still needs something to tap the pencil on.
export default function EmptyHint({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <p className="px-4 py-5 pr-14 text-sm text-ink-faint border border-dashed border-line-strong bg-canvas/40 m-4">
      {children}
    </p>
  );
}
