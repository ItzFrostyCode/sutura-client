import LegalDocument from './LegalDocument';
import { PRIVACY, PRIVACY_INTRO, PRIVACY_UPDATED } from './privacyData';

export default function PrivacyDocument() {
  return (
    <LegalDocument
      title="Privacy Policy"
      meta={`Last updated ${PRIVACY_UPDATED}`}
      intro={PRIVACY_INTRO}
      sections={PRIVACY}
      other={{ href: '/terms', label: 'Terms of Service' }}
    />
  );
}
