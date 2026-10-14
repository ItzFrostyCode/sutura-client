import type { Metadata } from 'next';
import AskSutura from '@/components/ask/AskSutura';

export const metadata: Metadata = {
  title: 'Ask SUTURA',
  description: 'Tap a question and get answers from SUTURA’s live data: verified Davao tailoring shops, your orders and your appointments.',
};

export default function AskPage() {
  return <AskSutura />;
}
