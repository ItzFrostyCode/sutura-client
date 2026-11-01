import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SuturaLogo from '@/components/brand/SuturaLogo';

const WIDTH = 'mx-auto w-full max-w-[1040px] mobile-screen-margins';

/** Page frame for Terms and Privacy. The header and the content share one width and margin, so their edges line up. */
export default function LegalShell({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl">
        <div className={`${WIDTH} flex h-[52px] items-center justify-between sm:h-[60px]`}>
          <Link href="/" aria-label="SUTURA home" className="flex min-h-11 items-center"><SuturaLogo className="h-7 w-auto text-espresso sm:h-8" /></Link>
          <Link href="/for-shops" className="flex min-h-11 items-center gap-1.5 text-sm text-ink-muted hover:text-ink"><ArrowLeft size={16} /> For shops</Link>
        </div>
      </header>
      <main className={`${WIDTH} flex-1 py-10 sm:py-14`}>{children}</main>
      <footer className="border-t border-line">
        <div className={`${WIDTH} flex flex-col gap-1 py-6 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between`}>
          <p>© {new Date().getFullYear()} SUTURA</p>
          <p><Link href="/terms" className="underline underline-offset-2 hover:text-ink">Terms of Service</Link> · <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">Privacy Policy</Link></p>
        </div>
      </footer>
    </div>
  );
}
