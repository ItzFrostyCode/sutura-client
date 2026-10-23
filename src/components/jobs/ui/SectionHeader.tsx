import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  as?: 'h2' | 'h3';
}

/** The title row every card on the order tabs uses: a plain icon, the title (with an optional badge), a subtitle and header buttons. */
export default function SectionHeader({ icon: Icon, title, subtitle, badge, actions, as: Heading = 'h2' }: Readonly<SectionHeaderProps>) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && <Icon size={18} className="mt-0.5 shrink-0 text-taupe-dark" />}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Heading className="text-[17px] font-semibold leading-snug text-ink">{title}</Heading>
            {badge}
          </div>
          {subtitle && <div className="mt-0.5 text-[13px] text-ink-muted">{subtitle}</div>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
