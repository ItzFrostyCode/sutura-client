import type { Metadata } from 'next';
import TermsView from '@/components/legal/TermsView';

export const metadata: Metadata = {
  title: 'Terms of Service | SUTURA',
  description: 'The rules for using SUTURA as a customer or a tailoring shop.',
};

// Content and layout live in TermsView (client: audience filter, search, contents).
// Links into it: /terms#subscription-agreement (Billing, cancel dialog), /terms?for=shop.
export default function TermsPage() {
  return <TermsView />;
}
