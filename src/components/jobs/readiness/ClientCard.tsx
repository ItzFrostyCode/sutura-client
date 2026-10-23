import React from 'react';
import Link from 'next/link';
import { UserRound } from 'lucide-react';
import SectionHeader from '../ui/SectionHeader';
/** Only what the card reads. The page's job carries the customer's id and email; the stage-only job type just doesn't list them. */
interface ClientCardProps {
  readonly job: { customer?: { id?: number; name: string; email?: string | null } | null };
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

/** Who the order is for, with a way into their full profile. Walk-ins without an account have no profile to open. */
export default function ClientCard({ job }: ClientCardProps) {
  const c = job.customer;
  const name = c?.name || 'Walk-in Customer';

  return (
    <section className="h-full rounded-2xl border border-line bg-surface p-5 shadow-2xs sm:p-6">
      <SectionHeader
        icon={UserRound}
        title="Client information"
        as="h3"
        actions={c?.id ? <Link href={`/dashboard/customers/${c.id}`} className="text-[13px] font-medium text-espresso hover:underline">Full profile</Link> : undefined}
      />
      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sunken text-sm font-semibold text-ink-body" aria-hidden>{initials(name)}</span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium text-ink">{name}</p>
          {c?.email && <p className="truncate text-[13px] text-ink-muted">{c.email}</p>}
        </div>
      </div>
    </section>
  );
}
