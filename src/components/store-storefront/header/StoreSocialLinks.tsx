import { safeHref } from '@/lib/safeHref';
import { SocialIcon } from '../tabs/about/SocialLinksCard';

/**
 * The shop's social pages (Facebook, Instagram, TikTok, a website…) in the shop header, on their own line under the
 * address / hours / phone: each one a clickable chip that opens in a new tab. Added by the owner in About > Social links.
 */
export default function StoreSocialLinks({ links }: { readonly links?: { label: string; url: string }[] | null }) {
  const shown = (links ?? []).filter((l) => l?.url?.trim());
  if (shown.length === 0) return null;
  return (
    <ul aria-label="Social pages" className="mt-2 flex w-full flex-wrap items-center justify-center gap-2">
      {shown.map((link) => (
        <li key={link.url}>
          <a
            href={safeHref(link.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-sunken"
          >
            <SocialIcon label={link.label} />
            <span>{link.label || 'Website'}</span>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
