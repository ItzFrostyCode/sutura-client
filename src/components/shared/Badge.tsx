import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type BadgeVariant = 'neutral' | 'success' | 'danger' | 'warning' | 'accent';

interface BadgeProps {
  readonly children: React.ReactNode;
  readonly variant?: BadgeVariant;
  readonly icon?: LucideIcon;
  readonly className?: string;
}

// Flat pill, border only — no shadow. Every status/type badge in this app
// was hand-rolled per call site with the same shape (rounded-full, border,
// text-[10-11px], font-semibold); this is the one source to reuse instead
// of re-deriving the shape and colors each time.
const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-sunken text-ink-muted border-line',
  success: 'bg-sage/10 text-sage border-sage/25',
  danger: 'bg-danger/10 text-danger border-danger/25',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  accent: 'bg-taupe/10 text-taupe border-taupe/25',
};

export default function Badge({ children, variant = 'neutral', icon: Icon, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}
