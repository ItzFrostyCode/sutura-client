import type { ReactNode } from 'react';

interface HubGroupProps {
  /** Small caps label above the group, as in iOS Settings. */
  readonly title?: string;
  readonly children: ReactNode;
}

/** An iOS-style grouped list: one soft card of rows, no divider lines. */
export default function HubGroup({ title, children }: HubGroupProps) {
  return (
    <section>
      {title && <h2 className="mobile-overline mb-2 ml-4 text-ink-faint">{title}</h2>}
      <div className="card-soft overflow-hidden">{children}</div>
    </section>
  );
}
