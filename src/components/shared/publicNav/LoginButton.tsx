import Link from 'next/link';
import type { MouseEvent } from 'react';
import { User as UserIcon } from 'lucide-react';

/** The one "Sign in" button for a visitor, the same on a phone, a tablet and desktop: outlined pill, person icon + word, 44px tall. */
export const loginButtonClass =
  'flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-line-strong bg-surface px-4 text-sm font-semibold text-espresso transition-colors hover:border-espresso';

export default function LoginButton({ href = '/login', onClick }: Readonly<{ href?: string; onClick?: (e: MouseEvent<HTMLAnchorElement>) => void }>) {
  return (
    <Link href={href} onClick={onClick} className={loginButtonClass}>
      <UserIcon size={16} aria-hidden />
      Sign in
    </Link>
  );
}
