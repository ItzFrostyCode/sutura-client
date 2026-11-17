import { getPhaseMeta } from './ordersTypes';

/** The shared order-status pill (one vocabulary, see orderPhases.ts), for solo cards, grouped rows and the detail page. */
export default function OrderStatusPill({ status, className = '' }: Readonly<{ status: string; className?: string }>) {
  const meta = getPhaseMeta(status);
  const Icon = meta.Icon;
  return (
    <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.tone} ${className}`}>
      <Icon size={12} /> {meta.label}
    </span>
  );
}
