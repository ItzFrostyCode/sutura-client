// The admin's Basic / Pro / Premium pill — one hue per plan, kept quiet
// against the warm neutral pages (Shops list, Reports).
export const PLAN_TONE: Record<string, string> = {
  basic: 'bg-stone-100 text-stone-700 border-stone-200',
  pro: 'bg-blue-50 text-blue-700 border-blue-200',
  premium: 'bg-amber-50 text-amber-800 border-amber-200',
};

export const PILL = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap';

export default function PlanPill({ plan }: { readonly plan: string | null | undefined }) {
  if (!plan) return <span className={`${PILL} border-line bg-sunken text-ink-muted`}>No plan</span>;
  return <span className={`${PILL} ${PLAN_TONE[plan.toLowerCase()] ?? PLAN_TONE.basic}`}>{plan}</span>;
}
