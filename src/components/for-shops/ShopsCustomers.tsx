import ShopsContainer from './ShopsContainer';
import SectionHead from './SectionHead';
import FeatureRows, { type FeatureRow } from './FeatureRows';
import CustomerPhones from './CustomerPhones';

const ROWS: readonly FeatureRow[] = [
  { title: 'Found on the map', body: 'Customers search by garment and location and open your branch’s page.' },
  { title: 'Booked in a few taps', body: 'A service, a date and a time, straight onto your appointments.' },
  { title: 'Their order, without asking', body: 'Customers follow each stage and see what is paid, instead of messaging “sa na po?”.' },
  { title: 'Ratings that build your listing', body: 'Reviews from real orders appear on your shop and your designs.' },
];

export default function ShopsCustomers() {
  return (
    <section id="customers" aria-labelledby="shops-customers-title" className="scroll-mt-16 py-12 sm:py-16 lg:py-20">
      <ShopsContainer className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 lg:order-1"><CustomerPhones /></div>
        <div className="order-1 lg:order-2">
          <SectionHead id="shops-customers-title" overline="For your customers" title="Your shop, on your customers’ phones." lede="Every approved shop is listed on SUTURA, with its services, designs and reviews. Customers find you, book and come back." />
          <div className="mt-6"><FeatureRows rows={ROWS} /></div>
          <p className="mobile-caption mt-3 text-ink-muted">Shop names and prices on the phones are illustrative.</p>
        </div>
      </ShopsContainer>
    </section>
  );
}
