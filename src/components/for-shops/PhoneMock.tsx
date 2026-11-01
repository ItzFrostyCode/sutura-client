import type { ReactNode } from 'react';

/** A plain phone frame for the customer-side mockups. */
export default function PhoneMock({ children, className = '' }: { readonly children: ReactNode; readonly className?: string }) {
  return (
    <div aria-hidden className={`w-full max-w-[220px] rounded-[2rem] border-[6px] border-espresso bg-canvas p-3 shadow-[0_8px_24px_rgba(43,30,26,0.12)] ${className}`}>
      <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-espresso/80" />
      {children}
    </div>
  );
}
