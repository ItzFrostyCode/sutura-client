import React from 'react';
import Link from 'next/link';
import { CopyPlus } from 'lucide-react';

interface FollowUp { id: number; order_number: string; free_fix: boolean }

/** On a completed order: the orders made as a follow-up to it ("Follow-up orders: ORD-0009 (free fix)"), each a link. */
export default function FollowUpLinks({ followUps }: Readonly<{ followUps?: FollowUp[] }>) {
  if (!followUps || followUps.length === 0) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border border-line bg-surface px-5 py-4 text-sm text-ink-body shadow-2xs">
      <CopyPlus size={16} className="shrink-0 text-taupe-dark" aria-hidden />
      <span className="font-medium text-ink">Follow-up orders:</span>
      {followUps.map((f, i) => (
        <span key={f.id}>
          <Link href={`/dashboard/jobs/${f.id}`} className="font-medium text-espresso underline-offset-2 hover:underline">{f.order_number}</Link>
          {f.free_fix && ' (free fix)'}{i < followUps.length - 1 && ','}
        </span>
      ))}
    </p>
  );
}
