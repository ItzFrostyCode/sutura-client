import { Crown, Check, ShieldCheck, Loader2 } from 'lucide-react';
import { getPlanMeta, type Plan } from './billingTypes';

interface PlanCardsSectionProps {
  plans: Plan[];
  activePlanId: number | undefined;
  currentPrice: number;
  upgradingTo: number | null;
  onSubscribe: (planId: number) => void;
}

export default function PlanCardsSection({
  plans,
  activePlanId,
  currentPrice,
  upgradingTo,
  onSubscribe,
}: PlanCardsSectionProps) {
  const getButtonContent = (plan: Plan) => {
    if (upgradingTo === plan.id) return <Loader2 className="w-5 h-5 animate-spin" />;
    if (activePlanId === plan.id) return <><Check size={15} /> Current Plan</>;
    if (plan.price_monthly > currentPrice) return 'Upgrade';
    if (plan.price_monthly < currentPrice) return 'Downgrade';
    return 'Select Plan';
  };

  return (
    <section className="space-y-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-taupe flex items-center gap-1.5">
        <Crown size={12} /> Choose Your Plan
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const meta = getPlanMeta(plan.slug);
          const Icon = meta.icon;
          const isActive = activePlanId === plan.id;
          let features: string[] = [];
          try {
            features = JSON.parse(plan.features || '[]');
          } catch {
            features = [];
          }

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl p-6 flex flex-col border transition-all duration-200 ${
                isActive ? 'border-taupe ring-1 ring-taupe' : meta.cardClass
              }`}
            >
              {meta.badge && !isActive && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 bg-white border border-taupe text-taupe">
                  <Crown size={11} /> {meta.badge}
                </div>
              )}
              {isActive && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-taupe text-white flex items-center gap-1">
                  <Check size={11} /> Active
                </div>
              )}

              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.iconBg}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">{plan.name}</h3>
                  <p className="text-xs text-ink-faint">{plan.description}</p>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-ink">
                    ₱{plan.price_monthly.toLocaleString()}
                  </span>
                  <span className="text-sm text-ink-faint">/mo</span>
                </div>
                <p className="text-xs text-ink-faint mt-0.5">
                  ₱{(plan.price_monthly * 10).toLocaleString()}/yr (save 2 months)
                </p>
              </div>

              <div className="space-y-2.5 mb-6 flex-1">
                {features.map((f) => (
                  <div key={f} className="flex items-start gap-2.5">
                    <ShieldCheck size={15} className="shrink-0 mt-0.5 text-taupe" />
                    <span className="text-[13px] text-ink-body">{f}</span>
                  </div>
                ))}
              </div>

              <button
                id={`plan-btn-${plan.slug}`}
                onClick={() => onSubscribe(plan.id)}
                disabled={isActive || upgradingTo !== null}
                className={`w-full py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm cursor-pointer ${
                  isActive
                    ? 'bg-sunken text-ink-faint cursor-not-allowed'
                    : meta.btnClass
                }`}
              >
                {getButtonContent(plan)}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
