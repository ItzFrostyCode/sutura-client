import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { type LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service | SUTURA',
  description: 'The rules for using SUTURA as a customer or a tailoring shop.',
};

const SECTIONS: LegalSection[] = [
  {
    heading: 'Your account',
    body: (
      <p>
        Give accurate information and keep your password safe. You are responsible for what happens under your
        account. Shop owners are responsible for the staff accounts they create.
      </p>
    ),
  },
  {
    heading: 'Orders and payments',
    body: (
      <>
        <p>
          Orders, prices, deposits, fittings and pickup are agreed between you and the shop. SUTURA records them
          so both sides can track progress, but the shop is responsible for the work it accepts.
        </p>
        <p>
          SUTURA does not take or hold payments. Payments are made directly to the shop, and SUTURA only records
          the amounts and receipts you or the shop provide.
        </p>
      </>
    ),
  },
  {
    heading: 'Shops',
    body: (
      <p>
        Shops must describe their services and prices honestly, keep customer information private, and use it
        only to serve that customer. Shop applications and branch locations are reviewed before they appear
        publicly, and a subscription plan may be required for some features.
      </p>
    ),
  },
  {
    id: 'shop-applications',
    heading: 'Shop applications',
    body: (
      <p>
        Everything you submit when applying to open a shop, including your documents, government ID and selfie, must
        be true and must belong to you or your business. We may reject an application, or suspend a shop later, if
        any of it turns out to be false, borrowed or edited.
      </p>
    ),
  },
  {
    // Billing's "Subscription Agreement" link and the cancel dialog point here.
    id: 'subscription-agreement',
    heading: 'Subscription agreement',
    body: (
      <>
        <p>
          A shop plan (Basic, Pro or Premium) is paid with GCash for a monthly (30-day) or yearly (365-day) period.
          SUTURA never charges you automatically: a plan renews only when you pay for it again in Billing.
        </p>
        <ul>
          <li>
            <strong>Changing plans.</strong> An upgrade starts right away, and the days left on your current plan
            are added to the new one. A downgrade starts when your current period ends.
          </li>
          <li>
            <strong>Free trial.</strong> A new shop can start with a 14-day free trial, once per shop. Choose a plan
            before it ends.
          </li>
          <li>
            <strong>Cancelling.</strong> You can cancel at any time in Billing. You keep full access to your plan
            until its end date, and you can undo the cancellation until then. Days already paid for are not
            refunded.
          </li>
          <li>
            <strong>When a plan ends</strong> (cancelled, not renewed, or a trial that ran out), your shop is hidden
            from customers and becomes read-only: no new orders, appointments or edits, for you or your staff.
            Every record is kept and you can still view and export it. Billing and Support stay open, and paying
            for a plan restores everything.
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: 'Acceptable use',
    body: (
      <ul>
        <li>Don&apos;t upload content that is false, offensive or not yours to share.</li>
        <li>Don&apos;t try to access other people&apos;s accounts or data, or disrupt the service.</li>
        <li>Don&apos;t use SUTURA to send spam or misleading messages.</li>
      </ul>
    ),
  },
  {
    heading: 'Changes and availability',
    body: (
      <p>
        We may update SUTURA and these terms. We try to keep the service running, but it may sometimes be
        unavailable. We may suspend accounts that break these terms.
      </p>
    ),
  },
  {
    heading: 'Privacy',
    body: (
      <p>
        How we handle your information is described in our{' '}
        <Link href="/privacy" className="font-semibold text-taupe hover:text-taupe-hover">Privacy Policy</Link>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="November 24, 2026"
      intro={
        <p>
          These terms apply to everyone who uses SUTURA at suturaofficial.tech, whether you are ordering from a
          tailoring shop or running one. By creating an account, you agree to them.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
