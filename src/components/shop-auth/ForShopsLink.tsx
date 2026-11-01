import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/** A clear way back to the shop-owner overview from the sign-up form, for someone who wants to read first. */
export default function ForShopsLink() {
  return (
    <Link href="/for-shops" className="mt-6 flex min-h-14 items-center justify-between gap-3 rounded-xl border border-line-strong px-4 py-3 transition-colors hover:bg-sunken">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">New here? See SUTURA for shops</span>
        <span className="block text-xs text-ink-muted">What it does, the plans, and how to start.</span>
      </span>
      <ArrowRight size={18} className="shrink-0 text-ink-muted" />
    </Link>
  );
}
