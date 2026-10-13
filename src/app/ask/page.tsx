import type { Metadata } from 'next';
import AskSutura from '@/components/ask/AskSutura';

export const metadata: Metadata = {
  title: 'Ask SUTURA',
  description: 'Describe what you need sewn, mended or fitted and find verified tailoring shops in Davao City.',
};

export default function AskPage() {
  return <AskSutura />;
}
