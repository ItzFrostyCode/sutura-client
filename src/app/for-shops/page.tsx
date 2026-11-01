import type { Metadata } from 'next';
import ShopsNav from '@/components/for-shops/ShopsNav';
import ShopsHero from '@/components/for-shops/ShopsHero';
import ShopsProduct from '@/components/for-shops/ShopsProduct';
import ShopsCustomers from '@/components/for-shops/ShopsCustomers';
import ShopsSteps from '@/components/for-shops/ShopsSteps';
import ShopsPricing from '@/components/for-shops/ShopsPricing';
import ShopsFaq from '@/components/for-shops/ShopsFaq';
import ShopsFooter from '@/components/for-shops/ShopsFooter';

export const metadata: Metadata = {
  title: 'Open a shop on SUTURA',
  description: 'Run your tailoring shop on SUTURA: appointments, measurements, job orders and payments in one record, with a free 14-day trial.',
};

/** Overview page for shop owners: what SUTURA does for a shop, how to start, and what it costs. */
export default function ForShopsPage() {
  return (
    <div id="top" className="flex min-h-dvh flex-col bg-canvas">
      <ShopsNav />
      <main className="flex-1">
        <ShopsHero />
        <ShopsProduct />
        <ShopsCustomers />
        <ShopsSteps />
        <ShopsPricing />
        <ShopsFaq />
      </main>
      <ShopsFooter />
    </div>
  );
}
