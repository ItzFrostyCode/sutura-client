'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import LegalShell from './LegalShell';
import LegalAccordion from './LegalAccordion';
import LegalContents from './LegalContents';
import LegalToolbar from './LegalToolbar';
import KeyPoints, { type KeyPoint } from './KeyPoints';
import AudiencePicker, { type AudienceFilter } from './AudiencePicker';
import { useLegalReader } from './useLegalReader';
import type { LegalSectionData } from './legalTypes';

interface LegalDocumentProps {
  readonly title: string;
  readonly meta: string;
  readonly intro: string;
  readonly sections: readonly LegalSectionData[];
  readonly keyPoints?: readonly KeyPoint[];
  /** Terms have sections meant for customers or shop owners; the privacy policy reads the same for everyone. */
  readonly byAudience?: boolean;
  readonly startAudience?: AudienceFilter;
  readonly other: { readonly href: string; readonly label: string };
}

/** The reader shared by Terms and Privacy: headline, plain-words summary, who-is-reading choice, search, contents, sections. */
export default function LegalDocument({ title, meta, intro, sections, keyPoints, byAudience = false, startAudience, other }: LegalDocumentProps) {
  const r = useLegalReader(sections);
  const { setAudience } = r;
  useEffect(() => { if (startAudience) setAudience(startAudience); }, [startAudience, setAudience]);

  return (
    <LegalShell>
      <p className="mobile-overline text-taupe">Legal</p>
      <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">{title}</h1>
      <p className="mobile-body-sm mt-4 text-ink-muted">{meta}</p>
      <p className="mobile-body-lg mt-6 max-w-2xl text-ink-body sm:text-xl sm:leading-8">{intro}</p>

      {keyPoints && <KeyPoints points={keyPoints} />}

      <div className="mt-12 space-y-4">
        {byAudience && (
          <>
            <h2 className="text-xl font-semibold text-ink">Read what applies to you</h2>
            <AudiencePicker value={r.audience} onChange={r.setAudience} sections={sections} />
          </>
        )}
        <div className="pt-2"><LegalToolbar label={`Search the ${title}`} query={r.query} onQuery={r.setQuery} count={r.visible.length} onExpand={r.expandAll} onCollapse={r.collapseAll} /></div>
      </div>

      <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:gap-14">
        <LegalContents sections={r.visible} active={r.active} onPick={r.goTo} />
        <div className="mt-4 max-w-3xl lg:mt-0">
          {r.visible.length === 0 ? (
            <p className="border-t border-line-strong py-10 text-center text-ink-muted">Nothing matches “{r.query}”. Try a shorter word.</p>
          ) : r.visible.map((s) => (
            <LegalAccordion key={s.n} section={s} open={r.isOpen(s.n)} onToggle={() => r.toggle(s.n)} showAudience={byAudience && r.audience === 'all'} />
          ))}
          <p className="mt-10 text-sm text-ink-muted">Questions? Write to [Contact email].</p>
          <Link href={other.href} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-taupe-dark hover:text-ink">{other.label} <ArrowRight size={14} /></Link>
        </div>
      </div>
    </LegalShell>
  );
}
