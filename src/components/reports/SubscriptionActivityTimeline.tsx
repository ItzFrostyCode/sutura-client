import { Building2, Users, Scissors, TrendingUp, TrendingDown, RefreshCw, Sparkles, XCircle } from 'lucide-react';
import UsageBar from '@/components/billing/UsageBar';

interface PlanRef {
  id: number;
  name: string;
  slug: string;
  price_monthly: string | number;
}

export interface SubscriptionEventRow {
  id: number;
  event_type: 'created' | 'renewed' | 'upgraded' | 'downgraded' | 'expired';
  billing_cycle: string | null;
  occurred_at: string;
  plan: PlanRef | null;
  previous_plan: PlanRef | null;
}

export interface SubscriptionActivityData {
  current: { plan: { name: string; slug: string } | null } | null;
  usage: {
    staff: { used: number; max: number };
    services: { used: number; max: number };
    branches: { used: number; max: number };
  };
  events: {
    data: SubscriptionEventRow[];
    meta: { current_page: number; last_page: number; total: number };
  };
}

// created/renewed read as "good, on track" (sage); upgraded is a positive
// but distinct action (taupe, the app's one accent color, not a second
// green); downgraded is the same accent dimmed to an outline so it doesn't
// read as equally celebratory; expired is the one genuinely bad state
// (danger). No rainbow hex values — only the locked DESIGN.md tokens.
const EVENT_META: Record<SubscriptionEventRow['event_type'], { label: string; Icon: typeof Sparkles; cls: string }> = {
  created: { label: 'Subscribed', Icon: Sparkles, cls: 'bg-sage text-white border-white' },
  renewed: { label: 'Renewed', Icon: RefreshCw, cls: 'bg-sage text-white border-white' },
  upgraded: { label: 'Upgraded', Icon: TrendingUp, cls: 'bg-taupe text-white border-white' },
  downgraded: { label: 'Downgraded', Icon: TrendingDown, cls: 'bg-surface text-taupe border-taupe' },
  expired: { label: 'Expired', Icon: XCircle, cls: 'bg-danger text-white border-white' },
};

function eventDescription(event: SubscriptionEventRow): string {
  const planName = event.plan?.name ?? 'a plan';
  switch (event.event_type) {
    case 'created':
      return `Subscribed to ${planName}.`;
    case 'renewed':
      return `Renewed ${planName}${event.billing_cycle ? ` (${event.billing_cycle})` : ''}.`;
    case 'upgraded':
      return `Upgraded from ${event.previous_plan?.name ?? 'a lower plan'} to ${planName}.`;
    case 'downgraded':
      return `Downgraded from ${event.previous_plan?.name ?? 'a higher plan'} to ${planName}.`;
    case 'expired':
      return `${planName} subscription expired — store hidden until renewed.`;
    default:
      return planName;
  }
}

export default function SubscriptionActivityTimeline({
  data,
  loading,
}: {
  readonly data: SubscriptionActivityData | null;
  readonly loading: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-surface border border-line rounded-2xl p-6 animate-pulse">
        <div className="h-4 w-40 bg-sunken rounded mb-4" />
        <div className="h-16 bg-sunken rounded" />
      </div>
    );
  }

  if (!data) return null;

  const events = data.events.data;

  return (
    <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm">
      <h2 className="text-base font-bold text-ink mb-1">Subscription Activity</h2>
      <p className="text-xs text-ink-muted mb-5">
        Current plan: <span className="font-semibold text-ink">{data.current?.plan?.name ?? 'No active plan'}</span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 pb-6 border-b border-line">
        <UsageBar label="Staff" used={data.usage.staff.used} max={data.usage.staff.max === -1 ? null : data.usage.staff.max} icon={Users} />
        <UsageBar label="Services" used={data.usage.services.used} max={data.usage.services.max === -1 ? null : data.usage.services.max} icon={Scissors} />
        <UsageBar label="Branches" used={data.usage.branches.used} max={data.usage.branches.max === -1 ? null : data.usage.branches.max} icon={Building2} />
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-sm text-ink-faint italic">
          No subscription activity yet.
        </div>
      ) : (
        <div className="relative pl-6 border-l-2 border-line space-y-6 ml-3">
          {events.map((event) => {
            const meta = EVENT_META[event.event_type];
            const Icon = meta.Icon;
            return (
              <div key={event.id} className="relative">
                <span className={`absolute left-[-37px] top-0.5 w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-sm shrink-0 ${meta.cls}`}>
                  <Icon size={12} />
                </span>
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="font-bold text-sm text-ink">{meta.label}</h4>
                    <span className="text-[10px] font-semibold text-ink-muted">
                      {new Date(event.occurred_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1">{eventDescription(event)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
