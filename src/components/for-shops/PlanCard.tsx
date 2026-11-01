import Link from 'next/link';
import { Check } from 'lucide-react';
import { formatPeso, type BillingCycle, type PublicPlan } from '@/components/store-application/applicationTypes';

/** One plan. The featured one is espresso; the rest sit flat on the page. */
export default function PlanCard({ plan, cycle, featured }: { readonly plan: PublicPlan; readonly cycle: BillingCycle; readonly featured: boolean }) {
  const yearly = cycle === 'yearly';
  const price = yearly ? plan.price_yearly : plan.price_monthly;
  const saved = Number(plan.price_monthly) * 12 - Number(plan.price_yearly);
  const features = (plan.display_features ?? plan.features ?? []).slice(0, 7);

  return (
    <article className={`flex flex-col rounded-2xl border p-5 sm:p-6 ${featured ? 'border-espresso bg-espresso text-white' : 'border-line bg-surface text-ink'}`}>
      <h3 className="text-xl font-semibold">{plan.name}</h3>
      {plan.description && <p className={`mobile-body-sm mt-1 ${featured ? 'text-white/70' : 'text-ink-muted'}`}>{plan.description}</p>}
      <p className="mt-5 text-4xl font-semibold tabular-nums">
        {formatPeso(price)}
        <span className={`ml-1 text-sm font-normal ${featured ? 'text-white/70' : 'text-ink-muted'}`}>/ {yearly ? 'year' : 'month'}</span>
      </p>
      <p className={`mobile-caption mt-1 min-h-4 ${featured ? 'text-amber-300' : 'text-taupe'}`}>{yearly && saved > 0 ? `Save ${formatPeso(saved)} a year` : ''}</p>
      <Link
        href={`/signup/shop?plan=${plan.slug}&cycle=${cycle}`}
        className={`btn-secondary-mobile mt-5 w-full rounded-[10px] border transition-transform active:scale-[0.98] ${featured ? 'border-amber-300 bg-amber-300 text-espresso hover:bg-amber-200' : 'border-line-strong text-ink hover:bg-sunken'}`}
      >
        Choose {plan.name}
      </Link>
      <ul className={`mt-5 space-y-2.5 border-t pt-5 ${featured ? 'border-white/15' : 'border-line'}`}>
        {features.map((f) => (
          <li key={f} className="flex gap-2.5 text-sm">
            <Check size={16} className={`mt-0.5 shrink-0 ${featured ? 'text-amber-300' : 'text-sage'}`} />
            <span className={featured ? 'text-white/90' : 'text-ink-body'}>{f}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
