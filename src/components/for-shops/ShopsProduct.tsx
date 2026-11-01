import ShopsContainer from './ShopsContainer';
import SectionHead from './SectionHead';
import FeatureRows, { type FeatureRow } from './FeatureRows';
import JobBoardMock from './JobBoardMock';

const MAIN: readonly FeatureRow[] = [
  { title: 'Appointments and fittings', body: 'Customers book a time; your front desk sees it, confirms it and checks them in.' },
  { title: 'Measurements', body: 'Typed in by your staff and kept on the customer, ready for the next order.' },
  { title: 'Job orders', body: 'A quote the customer approves, then each stage on one board, moved with one button.' },
  { title: 'Payments, tracked', body: 'Record deposits and balances, verify the proof, and see what is still owed.' },
];

const ALSO: readonly FeatureRow[] = [
  { title: 'Roles for your team', body: 'Accounts for branch managers and staff, each seeing only what their job needs.' },
  { title: 'Branches', body: 'Run more than one branch, with orders, staff and reports filtered per branch.' },
  { title: 'Your designs and services', body: 'Publish what you make, with prices or a quote, for customers to browse.' },
  { title: 'Reports', body: 'Sales, orders and staff output for one branch or all, ready to print.' },
  { title: 'Order tracking', body: 'Give customers a code to follow their order without signing in.' },
  { title: 'Verified listing', body: 'Only shops and branches the SUTURA team has checked appear on the map.' },
];

export default function ShopsProduct() {
  return (
    <section id="product" aria-labelledby="shops-product-title" className="scroll-mt-16 bg-sunken py-12 sm:py-16 lg:py-20">
      <ShopsContainer>
        <SectionHead id="shops-product-title" overline="Product" title="The desk, the board and the money, in one place." lede="Each part of your shop has its own screen, and every screen reads the same order." />
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
          <FeatureRows rows={MAIN} />
          <JobBoardMock />
        </div>
        <h3 className="mt-14 text-xl font-semibold text-ink">Also in SUTURA</h3>
        <div className="mt-4"><FeatureRows rows={ALSO} columns /></div>
      </ShopsContainer>
    </section>
  );
}
