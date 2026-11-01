'use client';

import { useEffect, useState } from 'react';
import LegalDocument from './LegalDocument';
import type { AudienceFilter } from './AudiencePicker';
import { KEY_POINTS, TERMS, TERMS_INTRO, TERMS_UPDATED, TERMS_VERSION } from './termsData';

const FOR: Record<string, AudienceFilter> = { owners: 'owners', customers: 'customers' };

/** The Terms of Service. Opened from shop sign-up (`?for=owners`) it starts on "I own a shop". */
export default function TermsDocument() {
  const [start, setStart] = useState<AudienceFilter | undefined>();
  useEffect(() => { setStart(FOR[new URLSearchParams(window.location.search).get('for') ?? '']); }, []);

  return (
    <LegalDocument
      title="Terms of Service"
      meta={`Last updated ${TERMS_UPDATED} · Version ${TERMS_VERSION}`}
      intro={TERMS_INTRO}
      sections={TERMS}
      keyPoints={KEY_POINTS}
      byAudience
      startAudience={start}
      other={{ href: '/privacy', label: 'Privacy Policy' }}
    />
  );
}
