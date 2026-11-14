import { safeHref } from '@/lib/safeHref';
import React, { useState } from 'react';
import { Globe, ExternalLink, Plus, Trash2, Copy, Check } from 'lucide-react';
import EditableCard from './EditableCard';

export const MAX_SOCIAL_LINKS = 8;

export type SocialLink = { label: string; url: string };

interface SocialLinksEditBundle {
  readonly isEditing: boolean;
  readonly saving: boolean;
  readonly onEdit: () => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
  readonly onLinksChange: (links: SocialLink[]) => void;
}

interface SocialLinksCardProps {
  readonly links: SocialLink[];
  readonly edit?: SocialLinksEditBundle;
}

export function detectSocialPlatform(label?: string | null, url?: string | null) {
  const urlLower = (url ?? '').toLowerCase();
  const labelLower = (label ?? '').toLowerCase();
  const target = `${urlLower} ${labelLower}`;

  let platform = 'generic';
  let defaultName = 'Website';

  if (target.includes('facebook') || target.includes('fb.me') || target.includes('fb.watch') || urlLower.includes('fb.com')) {
    platform = 'facebook';
    defaultName = 'Facebook';
  } else if (target.includes('instagram') || target.includes('instagr.am') || target.includes('threads.net')) {
    if (target.includes('threads.net')) {
      platform = 'threads';
      defaultName = 'Threads';
    } else {
      platform = 'instagram';
      defaultName = 'Instagram';
    }
  } else if (target.includes('youtube') || target.includes('youtu.be')) {
    platform = 'youtube';
    defaultName = 'YouTube';
  } else if (target.includes('tiktok') || target.includes('tiktok.com')) {
    platform = 'tiktok';
    defaultName = 'TikTok';
  } else if (target.includes('pinterest') || target.includes('pin.it')) {
    platform = 'pinterest';
    defaultName = 'Pinterest';
  } else if (target.includes('linkedin') || target.includes('linkedin.com')) {
    platform = 'linkedin';
    defaultName = 'LinkedIn';
  } else if (target.includes('twitter') || target.includes('x.com')) {
    platform = 'twitter';
    defaultName = 'X';
  }

  // Custom name set by the owner (e.g., 'Thread & Needle Tailoring') is preserved while the logo stays platform-based
  const finalName = label?.trim() || defaultName;

  return { platform, name: finalName };
}

/** The platform's own mark for a link (Facebook, Instagram, YouTube, Threads, LinkedIn, Pinterest, TikTok, X), or a globe for anything else. */
export function SocialIcon({ label, url, size = 18 }: { readonly label?: string | null; readonly url?: string | null; readonly size?: number }) {
  const { platform } = detectSocialPlatform(label, url);
  const px = `${size}px`;
  const style = { width: px, height: px };
  switch (platform) {
    case 'facebook':
      return (
        <svg style={style} className="fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg style={style} className="fill-[#E4405F] shrink-0" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg style={style} className="fill-[#FF0000] shrink-0" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case 'threads':
      return (
        <svg style={style} className="fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M12.186 24C5.466 24 0 18.534 0 11.814 0 5.094 5.466 0 12.186 0c6.643 0 11.956 5.257 11.956 11.814 0 .53-.035 1.056-.104 1.574h-3.992c.046-.511.07-.1.07-.432 0-4.385-3.56-7.945-7.93-7.945-4.37 0-7.93 3.56-7.93 7.945 0 4.385 3.56 7.945 7.93 7.945 2.134 0 4.07-.847 5.49-2.227l2.83 2.83C18.665 22.753 15.584 24 12.186 24zm4.272-10.748a4.272 4.272 0 1 0-8.544 0 4.272 4.272 0 0 0 8.544 0z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg style={style} className="fill-[#0A66C2] shrink-0" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      );
    case 'pinterest':
      return (
        <svg style={style} className="fill-[#BD081C] shrink-0" viewBox="0 0 24 24">
          <path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.334 1.373-.057.235-.187.285-.431.172-1.606-.747-2.609-3.094-2.609-4.981 0-4.053 2.944-7.778 8.494-7.778 4.459 0 7.925 3.178 7.925 7.425 0 4.432-2.794 8-6.671 8-1.303 0-2.527-.677-2.946-1.477l-.801 3.056c-.29 1.109-1.074 2.499-1.601 3.354 1.144.353 2.361.545 3.626.545 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg style={style} className="fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg style={style} className="fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    default:
      return <Globe size={size} className="text-taupe shrink-0" />;
  }
}

function SocialLinkInteractiveChip({ link }: { readonly link: SocialLink }) {
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
    <div className="flex min-h-11 w-full items-center justify-between gap-3 border-b border-line py-2 text-sm text-ink last:border-b-0">
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

function SocialLinksView({ links }: { readonly links: SocialLink[] }) {
  const activeLinks = (links || []).filter((l) => l?.url?.trim()).slice(0, MAX_SOCIAL_LINKS);
  if (activeLinks.length > 0) {
    return (
      <div className="flex flex-col gap-2 w-full">
        {activeLinks.map((link, idx) => (
          <SocialLinkInteractiveChip key={`${link.url}-${idx}`} link={link} />
        ))}
      </div>
    );
  }
  return <p className="mobile-body-sm text-ink-muted py-1">No social links listed yet.</p>;
}

function SocialLinksEditForm({
  links,
  onLinksChange,
}: {
  readonly links: SocialLink[];
  readonly onLinksChange: (l: SocialLink[]) => void;
}) {
  const currentLinks = links || [];
  const isMaxReached = currentLinks.length >= MAX_SOCIAL_LINKS;

  const handleUrlChange = (idx: number, urlVal: string) => {
    const next = [...currentLinks];
    const prev = next[idx];
    const auto = detectSocialPlatform('', urlVal);
    // Auto-detect and suggest label if user hasn't typed one
    const updatedLabel = !prev.label || prev.label.trim() === '' || prev.label === 'Website'
      ? (auto.platform !== 'generic' ? auto.name : prev.label)
      : prev.label;

    next[idx] = { ...prev, url: urlVal, label: updatedLabel };
    onLinksChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-muted">
          Shown on your public store profile ({currentLinks.length}/{MAX_SOCIAL_LINKS} links max).
        </p>
        <button
          type="button"
          disabled={isMaxReached}
          onClick={() => {
            if (isMaxReached) return;
            onLinksChange([...currentLinks, { label: '', url: '' }]);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
            isMaxReached
              ? 'text-ink-faint bg-sunken cursor-not-allowed opacity-60'
              : 'text-taupe bg-canvas hover:bg-sunken cursor-pointer'
          }`}
        >
          <Plus size={14} /> {isMaxReached ? 'Max Reached' : 'Add Link'}
        </button>
      </div>

      {currentLinks.map((link, idx) => (
        <div key={idx} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="flex items-center gap-2 sm:w-1/3">
            <span className="shrink-0 p-1 bg-surface border border-line rounded flex items-center justify-center">
              <SocialIcon label={link.label} url={link.url} size={18} />
            </span>
            <input
              type="text"
              value={link.label}
              onChange={(e) => {
                const next = [...currentLinks];
                next[idx] = { ...next[idx], label: e.target.value };
                onLinksChange(next);
              }}
              placeholder="Label (e.g. Thread & Needle FB)"
              className="w-full px-3 py-2 bg-canvas border border-line text-ink text-sm focus:border-taupe outline-none"
            />
          </div>
          <div className="flex-1 flex items-center gap-2">
            <input
              type="url"
              value={link.url}
              onChange={(e) => handleUrlChange(idx, e.target.value)}
              placeholder="https://..."
              className="flex-1 px-3 py-2 bg-canvas border border-line text-ink text-sm focus:border-taupe outline-none"
            />
            <button
              type="button"
              onClick={() => onLinksChange(currentLinks.filter((_, i) => i !== idx))}
              className="p-2 text-danger hover:bg-danger/10 transition-colors cursor-pointer"
              title="Remove link"
              aria-label="Remove link"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}

      {currentLinks.length === 0 && (
        <div className="text-center py-5 bg-canvas border border-dashed border-line">
          <p className="text-xs text-ink-muted">No social links added yet.</p>
        </div>
      )}
    </div>
  );
}

export default function SocialLinksCard({ links, edit }: SocialLinksCardProps) {
  if (!edit) {
    return (
      <div className="bg-surface border border-line p-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe size={16} className="text-taupe" />
          <h3 className="text-sm font-bold text-ink">Social Links</h3>
        </div>
        <SocialLinksView links={links} />
      </div>
    );
  }

  return (
    <EditableCard
      icon={<Globe size={16} className="text-taupe" />}
      title="Social Links"
      isEditing={edit.isEditing}
      saving={edit.saving}
      onEdit={edit.onEdit}
      onCancel={edit.onCancel}
      onSave={edit.onSave}
      editBody={<SocialLinksEditForm links={links} onLinksChange={edit.onLinksChange} />}
    >
      <SocialLinksView links={links} />
    </EditableCard>
  );
}
