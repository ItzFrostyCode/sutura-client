import type { Metadata } from 'next';
import PrivacyDocument from '@/components/legal/PrivacyDocument';

export const metadata: Metadata = { title: 'Privacy Policy · SUTURA' };

export default function PrivacyPage() {
  return <PrivacyDocument />;
}
