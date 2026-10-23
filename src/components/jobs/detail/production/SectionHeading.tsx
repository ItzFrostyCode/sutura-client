import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface SectionHeadingProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly optional?: boolean;
  readonly htmlFor?: string;
}

/** Icon plus a small uppercase title, the same for every section under the timeline. */
export default function SectionHeading({ icon: Icon, title, optional, htmlFor }: SectionHeadingProps) {
  const Tag = htmlFor ? 'label' : 'span';
  return (
    <Tag {...(htmlFor ? { htmlFor } : {})} className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink">
      <Icon size={16} className="text-ink-muted" />
      <span>{title}{optional && <span className="ml-1.5 font-normal normal-case tracking-normal text-ink-muted">(optional)</span>}</span>
    </Tag>
  );
}
