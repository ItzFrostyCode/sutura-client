import React from 'react';

interface PageHeaderProps {
  /** Small uppercase category label above the title. */
  readonly eyebrow: string;
  readonly title: string;
  readonly description?: React.ReactNode;
  /** Buttons / controls, right-aligned on desktop, wrapped below on mobile. */
  readonly actions?: React.ReactNode;
  /** Tabs or filters rendered flush with the header's bottom rule. */
  readonly children?: React.ReactNode;
}

/**
 * The single page-header pattern for every dashboard page: eyebrow, display
 * title, optional description, right-aligned actions, and an optional flush
 * tab strip. Every page rolled its own before — same idea, eight variations
 * of size, weight and spacing.
 */
export default function PageHeader({ eyebrow, title, description, actions, children }: PageHeaderProps) {
  return (
    <header className={`border-b border-line ${children ? '' : 'pb-5'}`}>
      <div className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 ${children ? 'pb-5' : ''}`}>
        <div className="min-w-0">
          <p className="text-eyebrow-accent">{eyebrow}</p>
          <h1 className="text-display text-3xl font-semibold text-ink mt-2">{title}</h1>
          {/* div, not p: callers legitimately pass block-level content here
              (e.g. <ShopWideNote />, which renders its own <p>), and a <p>
              inside a <p> is invalid HTML that React reports as a hydration
              error. Caught live in the console on Customers and Catalog. */}
          {description && (
            <div className="text-sm text-ink-muted mt-2 max-w-2xl">{description}</div>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">{actions}</div>
        )}
      </div>
      {children}
    </header>
  );
}
