import React from 'react';

interface QuotationStepProps {
  readonly n: number;
  readonly title: string;
  readonly first?: boolean;
  readonly children: React.ReactNode;
}

/** One numbered group of the quotation form: a number circle, a heading and the fields. */
export default function QuotationStep({ n, title, first = false, children }: QuotationStepProps) {
  return (
    <section className={`space-y-4 ${first ? '' : 'border-t border-line pt-5'}`}>
      <div className="flex items-center gap-2.5">
        <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-espresso text-xs font-semibold text-white">{n}</span>
        <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      </div>
      {children}
    </section>
  );
}
