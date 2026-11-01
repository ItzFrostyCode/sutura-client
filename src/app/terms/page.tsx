import type { Metadata } from 'next';
import TermsDocument from '@/components/legal/TermsDocument';

export const metadata: Metadata = { title: 'Terms of Service · SUTURA' };

export default function TermsPage() {
  return <TermsDocument />;
}
