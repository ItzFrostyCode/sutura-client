import type { Metadata } from 'next';
import ForShopsView from '@/components/for-shops/ForShopsView';

export const metadata: Metadata = {
  title: 'SUTURA for tailoring shops',
  description: 'Bookings, measurements, job orders and payments in one record, and a verified listing for customers across Davao City. Free for 14 days.',
};

export default function ForShopsPage() {
  return <ForShopsView />;
}
