import Link from 'next/link';
import { LifeBuoy } from 'lucide-react';

export default function AccountSupportCard() {
  return (
    <div className="bg-surface border border-line p-4 mb-4">
      <h2 className="mobile-h3 font-semibold text-ink mb-3">Support</h2>
      <div className="flex flex-col items-center text-center py-2">
        <div className="w-12 h-12 rounded-full bg-sunken flex items-center justify-center mb-2.5">
          <LifeBuoy size={24} className="text-ink-faint" />
        </div>
        <p className="mobile-body-sm font-normal text-ink-muted mb-4 space-headline-para">
          No support tickets yet
        </p>
        <Link
          href="/account/settings/support"
          className="btn-secondary-mobile w-full max-w-[180px] text-taupe border-line hover:bg-sunken"
        >
          Open a Ticket
        </Link>
      </div>
    </div>
  );
}
