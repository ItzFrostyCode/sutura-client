import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description?: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

// Flat, no shadow — every list page in this app hand-rolled its own version
// of this exact shape (icon + heading + subtext + CTA). One source instead
// of re-deriving the layout per page.
export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-12 text-center">
      <Icon className="w-12 h-12 text-ink-muted mx-auto mb-4" />
      <h3 className="text-lg font-medium text-ink mb-2">{title}</h3>
      {description && (
        <p className="text-ink-muted text-sm mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
