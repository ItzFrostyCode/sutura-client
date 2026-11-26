'use client';

import React, { useState } from 'react';
import { safeHref } from '@/lib/safeHref';
import { SocialIcon, detectSocialPlatform, MAX_SOCIAL_LINKS } from '../tabs/about/SocialLinksCard';
import { ExternalLink, Copy, Check, ChevronDown, Globe } from 'lucide-react';

export const DEFAULT_THREAD_NEEDLE_SOCIALS = [
  { label: 'Thread & Needle Tailoring', url: 'https://facebook.com/threadandneedle.davao' },
  { label: '@threadandneedle.davao', url: 'https://instagram.com/threadandneedle.davao' },
  { label: 'Thread & Needle TikTok', url: 'https://tiktok.com/@threadandneedle.davao' },
  { label: 'Thread & Needle Tailoring Davao', url: 'https://youtube.com/@threadandneedledavao' },
  { label: 'Thread & Needle Official Portfolio', url: 'https://pinterest.com/threadandneedledavao' },
  { label: 'Thread & Needle Co.', url: 'https://linkedin.com/company/threadandneedle' },
  { label: '@threadandneedle.davao', url: 'https://threads.net/@threadandneedle.davao' },
  { label: 'threadandneedle.ph', url: 'https://threadandneedle.ph' },
];

function StoreSocialLinkRow({ link }: { readonly link: { label: string; url: string } }) {
  const [copied, setCopied] = useState(false);
  const detected = detectSocialPlatform(link.label, link.url);
  const displayName = link.label?.trim() || detected.name;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback
    }
  };

  return (
    <div className="flex min-h-10 items-center justify-between gap-3 py-1.5 text-sm text-ink transition-colors hover:bg-sunken/40 px-1 rounded-md">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="shrink-0 flex items-center justify-center">
          <SocialIcon label={link.label} url={link.url} size={18} />
        </span>
        <a
          href={safeHref(link.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 truncate text-ink hover:underline cursor-pointer"
          title={`Open ${displayName}`}
        >
          {displayName}
        </a>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <a
          href={safeHref(link.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-1.5 text-ink-muted hover:text-ink hover:bg-sunken rounded transition-colors cursor-pointer"
          title={`Open ${displayName} in new tab`}
          aria-label={`Open ${displayName} in new tab`}
        >
          <ExternalLink size={16} />
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 p-1.5 text-ink-muted hover:text-ink hover:bg-sunken rounded transition-colors cursor-pointer"
          title="Copy link URL"
          aria-label="Copy link URL"
        >
          {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}

/**
 * The shop's social pages (Facebook, Instagram, TikTok, YouTube, Threads, LinkedIn, etc.):
 * Single-line row with icon, social link summary, and dropdown chevron button (matching Opening Hours UI/UX).
 */
export default function StoreSocialLinks({ links }: { readonly links?: { label: string; url: string }[] | null }) {
  const [open, setOpen] = useState(false);
  const shown = (links ?? []).filter((l) => l?.url?.trim()).slice(0, MAX_SOCIAL_LINKS);
  if (shown.length === 0) return null;

  return (
    <div className="border-b border-line py-2 text-sm text-ink w-full">
      <div
        onClick={() => setOpen(!open)}
        className="flex min-h-7 items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 text-sm">
          <span className="shrink-0 text-taupe-dark">
            <Globe size={18} />
          </span>
          <div className="min-w-0 flex-1 truncate text-sm">
            <span className="font-semibold text-ink">Social Links</span>
            <span className="text-ink-muted"> · {shown.length} {shown.length === 1 ? 'account' : 'accounts'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          aria-expanded={open}
          aria-label="Toggle social links"
          className="shrink-0 p-1.5 text-ink-muted hover:text-ink hover:bg-sunken rounded transition-colors cursor-pointer"
        >
          <ChevronDown
            size={17}
            className={`transition-transform duration-200 ${open ? 'rotate-180 text-ink' : 'text-ink-muted'}`}
          />
        </button>
      </div>

      {/* Social links dropdown accordion with matching UI/UX */}
      {open && (
        <div className="pt-2 pb-1 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {shown.map((link, idx) => (
            <StoreSocialLinkRow key={`${link.url}-${idx}`} link={link} />
          ))}
        </div>
      )}
    </div>
  );
}
