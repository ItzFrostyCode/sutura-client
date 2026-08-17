'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  X, ChevronRight, BookOpen, Wrench, Activity, Mail, LifeBuoy,
} from 'lucide-react';

interface HelpPanelProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

const LINKS = [
  {
    href: '/dashboard/support',
    icon: LifeBuoy,
    title: 'Support tickets',
    desc: 'Open a ticket with the SUTURA admin team and track replies.',
  },
  {
    href: '/dashboard?tab=welcome',
    icon: BookOpen,
    title: 'Welcome guide',
    desc: 'Walk through what each part of the dashboard does.',
  },
  {
    href: '/dashboard?tab=news',
    icon: Activity,
    title: 'System news',
    desc: 'Recent changes and fixes shipped to the platform.',
  },
  {
    href: '/dashboard/audit-log',
    icon: Wrench,
    title: 'Audit log',
    desc: 'Check who changed what, when, and why.',
  },
];

/**
 * Right-hand help drawer, opened from the header's ? button. Replaces the
 * "Help & Support" nav item — support is a thing you reach for from wherever
 * you are, not a destination that earns permanent space in the nav.
 * Full-screen on mobile, side panel on desktop, matching the Modal contract.
 */
export default function HelpPanel({ open, onClose }: HelpPanelProps) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        aria-label="Close help"
        tabIndex={-1}
        className="fixed inset-0 bg-ink/40 border-none p-0 cursor-default"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Help and support"
        className="relative bg-surface border-l border-line w-full sm:w-[400px] h-[100dvh] flex flex-col animate-rise"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line shrink-0">
          <h2 className="text-sm font-semibold text-ink">Help &amp; Support</h2>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted bg-canvas border border-line rounded-full pl-2 pr-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sage" />
              All systems operational
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-sunken transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-line">
          {LINKS.map(link => (
            <Link
              key={link.title}
              href={link.href}
              onClick={onClose}
              className="flex items-start gap-3.5 px-5 py-4 hover:bg-canvas transition-colors group"
            >
              <link.icon size={17} className="text-ink-muted mt-0.5 shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-ink">{link.title}</span>
                <span className="block text-xs text-ink-muted mt-0.5 leading-relaxed">{link.desc}</span>
              </span>
              <ChevronRight size={16} className="text-ink-faint group-hover:text-ink-body transition-colors shrink-0 mt-0.5" />
            </Link>
          ))}
        </div>

        <div className="px-5 py-5 border-t border-line shrink-0" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
          <p className="text-sm font-semibold text-ink">Still stuck?</p>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            Open a support ticket and the admin team will pick it up. Include the order number
            or page you were on — it gets resolved faster.
          </p>
          <Link
            href="/dashboard/support"
            onClick={onClose}
            className="mt-3 inline-flex items-center gap-2 bg-taupe hover:bg-taupe-hover text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors min-h-[44px]"
          >
            <Mail size={15} /> Contact support
          </Link>
        </div>
      </aside>
    </div>
  );
}
