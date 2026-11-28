'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, BarChart3, Check, ChevronDown, GitBranch, MapPin, PackageSearch,
  Shirt, ShieldCheck, Star, Users, CalendarCheck, Smartphone, type LucideIcon,
} from 'lucide-react';
import api from '@/lib/axios';
import SuturaLogo from '@/components/brand/SuturaLogo';
import { formatPeso, type PublicPlan } from '@/components/store-application/applicationTypes';
import { CustomerPhones, JobBoardCard, OrderRecordCard } from './ForShopsMockups';

type Cycle = 'monthly' | 'yearly';
type Plan = PublicPlan & { max_staff?: number; max_branches?: number };

const TRIAL_DAYS = 14;
const APPLY = '/register/store';
const SHOP_LOGIN = '/login?as=store';

const PRIMARY = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#2E1C14] px-5 text-sm font-semibold text-[#FBF4EA] transition-colors hover:bg-[#45291D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe';
const SECONDARY = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[#DDD4C9] bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-ink-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe';
const H2 = 'text-display text-2xl sm:text-[32px] font-semibold leading-tight text-ink text-balance';

const DESK: { title: string; text: string }[] = [
  { title: 'Appointments and fittings', text: 'Customers book online or you add walk-ins. Approve, reschedule or decline in one place, and see who arrived early.' },
  { title: 'Measurements', text: 'Type the measurements in, or attach a photo of the paper sheet. They’re saved to the customer’s profile and fill in their next order.' },
  { title: 'Job orders', text: 'Online orders and walk-ins land on one board. You approve them, and your staff move each one through Production, Quality Check, fitting and Ready for Pickup.' },
  { title: 'Payments, tracked', text: 'Record cash and GCash payments, verify the receipts customers send, and see what’s still owed. Customers pay you directly.' },
];

const ALSO: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Users, title: 'Roles for your team', text: 'Accounts for branch managers and staff. Each person sees only what their job needs.' },
  { icon: GitBranch, title: 'Branches', text: 'Run more than one branch, with orders, staff and reports kept per branch.' },
  { icon: Shirt, title: 'Your services, designs and packages', text: 'Post what you make with its price, and bundle services into combo packages customers can order.' },
  { icon: BarChart3, title: 'Reports', text: 'Sales, orders and staff output for any period, ready to print.' },
  { icon: PackageSearch, title: 'Order tracking', text: 'Give customers a code to follow their order without signing in.' },
  { icon: ShieldCheck, title: 'Verified listing', text: 'Only shops checked by the SUTURA team are listed and appear on the map.' },
];

const CUSTOMER_SIDE: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: MapPin, title: 'Found on the map', text: 'Customers search by garment and district and open your branch’s page.' },
  { icon: CalendarCheck, title: 'Ordered or booked in a few taps', text: 'They place an order or book a fitting at your branch. It lands in your orders or appointments for you to approve.' },
  { icon: Smartphone, title: 'Order status, without asking', text: 'Customers follow each stage and see what’s paid on their own, instead of messaging for updates.' },
  { icon: Star, title: 'Ratings that build your listing', text: 'Reviews from real customers appear on your shop, services and designs.' },
];

const STEPS: { title: string; text: string; when: string }[] = [
  { title: 'Apply', text: 'Tell us about you and your shop, pin its location and upload your DTI registration, barangay clearance and a government ID.', when: 'Today' },
  { title: 'We check your documents', text: 'The SUTURA team reviews the application. Nothing is public until they approve it.', when: 'Review' },
  { title: 'Get your shop login', text: 'On approval we email your shop login and a temporary password. You set your own on first sign-in.', when: 'Approved' },
  { title: 'Set up and start your trial', text: 'Add your services, branches and staff, and take your first booking.', when: `${TRIAL_DAYS} days free` },
];

const peso = (v: string | number) => formatPeso(v).replace(/\.00$/, '');

function PlanCard({ plan, cycle, featured }: Readonly<{ plan: Plan; cycle: Cycle; featured: boolean }>) {
  const price = cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
  const lines = plan.display_features ?? plan.features ?? [];
  return (
    <div className={`flex flex-col rounded-2xl p-6 ${featured ? 'bg-[#4A3428] text-white shadow-[0_20px_40px_-20px_rgba(46,28,20,0.6)]' : 'border border-[#DDD4C9] bg-white text-ink'}`}>
      <h3 className="text-lg font-semibold">{plan.name}</h3>
      {plan.description && <p className={`mt-1 text-sm ${featured ? 'text-[#D8C6B2]' : 'text-ink-muted'}`}>{plan.description}</p>}
      <p className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-bold tabular-nums">{peso(price)}</span>
        <span className={`text-sm ${featured ? 'text-[#D8C6B2]' : 'text-ink-muted'}`}>/ {cycle === 'yearly' ? 'year' : 'month'}</span>
      </p>
      <Link
        href={`${APPLY}?plan=${plan.slug}&cycle=${cycle}`}
        className={`mt-5 inline-flex min-h-11 items-center justify-center rounded-xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe ${
          featured ? 'bg-[#E9C46A] text-[#2E1C14] hover:bg-[#F0D07E]' : 'border border-[#DDD4C9] bg-white text-ink hover:border-ink-faint'
        }`}
      >
        Choose {plan.name}
      </Link>
      <ul className="mt-6 space-y-2.5 text-sm">
        {lines.map((l) => (
          <li key={l} className="flex gap-2">
            <Check size={15} className={`mt-0.5 shrink-0 ${featured ? 'text-[#E9C46A]' : 'text-[#4A3428]'}`} aria-hidden="true" />
            <span className={featured ? 'text-[#F3E8DA]' : 'text-ink-body'}>{l}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Faq({ items }: Readonly<{ items: { q: string; a: string }[] }>) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <ul className="divide-y divide-[#E2D8CC] border-y border-[#E2D8CC]">
      {items.map((it, i) => {
        const on = open === i;
        return (
          <li key={it.q}>
            <h3>
              <button type="button" onClick={() => setOpen(on ? null : i)} aria-expanded={on} aria-controls={`faq-${i}`}
                className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm sm:text-base font-semibold text-ink cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe">
                {it.q}
                <ChevronDown size={18} className={`shrink-0 text-ink-muted transition-transform duration-200 ${on ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
            </h3>
            {on && <p id={`faq-${i}`} className="pb-5 pr-8 text-sm leading-relaxed text-ink-body">{it.a}</p>}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * /for-shops: the pitch to tailoring shop owners. Plans and limits are read
 * from GET /public/subscription-plans (the same list the application uses),
 * so prices on this page can't drift from what a shop is charged. All
 * screens are labelled samples.
 */
export default function ForShopsView() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansError, setPlansError] = useState(false);
  const [cycle, setCycle] = useState<Cycle>('monthly');

  useEffect(() => {
    api.get('/public/subscription-plans')
      .then((res) => setPlans(res.data.data ?? []))
      .catch(() => setPlansError(true));
  }, []);

  const staffLimits = plans.filter((p) => p.max_staff).map((p) => `${p.name} ${p.max_staff}`).join(', ');
  const branchPlans = plans.filter((p) => (p.max_branches ?? 0) > 0);
  const faq = [
    { q: 'What does the free trial include?', a: `The plan you pick, with all its features, free for ${TRIAL_DAYS} days from the day your shop is approved. One trial per shop, and nothing to pay to apply.` },
    { q: 'What do I need to apply?', a: 'Your shop’s name, address and map pin, your DTI Business Name Registration and Barangay Business Clearance, a government ID and a selfie holding it. A TIN or BIR Form 2303 and a Mayor’s permit are optional but help us approve you faster.' },
    { q: 'Can my staff have their own accounts?', a: `Yes. You create accounts for staff and branch managers, and each sees only what their role needs.${staffLimits ? ` Staff accounts per plan: ${staffLimits}.` : ''}` },
    { q: 'How many branches can I run?', a: branchPlans.length ? `Every plan includes your main shop. ${branchPlans.map((p) => `${p.name} adds up to ${p.max_branches} branch ${p.max_branches === 1 ? 'shop' : 'shops'}`).join('; ')}.` : 'Every plan includes your main shop; extra branches come with the higher plan.' },
    { q: 'How do customers order or book?', a: 'They find you on SUTURA or the map, open your branch and either place an order for a service, design or package, or book a fitting. Orders arrive on your Production Orders board and bookings in your appointments, for you to approve.' },
    { q: 'Does SUTURA take payments for my orders?', a: 'No. Customers pay you directly, in person or by your GCash. SUTURA records deposits and balances, and lets you check GCash receipts customers upload.' },
    { q: 'How do I pay for my plan?', a: 'With GCash in Billing, monthly or yearly. SUTURA never charges you automatically: a plan renews only when you pay for it again.' },
    { q: 'What happens when my trial ends?', a: 'If you haven’t chosen a plan, your shop is hidden from customers and becomes read-only. Every record is kept, and paying for a plan restores everything.' },
  ];

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#EAE3D9] bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between mobile-screen-margins">
          <Link href="/" aria-label="SUTURA home" className="shrink-0"><SuturaLogo className="h-7 sm:h-8" title="" /></Link>
          <nav aria-label="For shops" className="flex items-center gap-2 whitespace-nowrap sm:gap-4">
            <a href="#plans" className="hidden sm:inline text-sm font-medium text-ink-body hover:text-ink">Plans</a>
            <a href="#faq" className="hidden sm:inline text-sm font-medium text-ink-body hover:text-ink">FAQ</a>
            <Link href={SHOP_LOGIN} className="px-2 text-sm font-semibold text-ink hover:text-taupe-dark">Sign in</Link>
            <Link href={APPLY} className={`${PRIMARY} min-h-10 px-3.5 sm:px-4`}>Start free trial</Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Back to the customer landing page */}
        <div className="mx-auto max-w-6xl mobile-screen-margins pt-5 sm:pt-6">
          <Link href="/"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#DDD4C9] bg-white px-3.5 text-sm font-semibold text-ink shadow-2xs transition-colors hover:border-ink-faint hover:bg-[#FBF8F4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe">
            <ArrowLeft size={16} strokeWidth={2.25} aria-hidden="true" />
            Back to SUTURA
          </Link>
        </div>

        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 mobile-screen-margins pt-8 pb-14 sm:pt-10 sm:pb-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1 className="text-display text-[38px] sm:text-5xl lg:text-[56px] font-semibold leading-[1.05] text-ink text-balance">
              From the first fitting to the final handover.
            </h1>
            <p className="mt-5 max-w-lg text-base sm:text-lg leading-relaxed text-ink-body">
              SUTURA keeps every order in one record: the booking, the measurements, each production stage and every
              payment. Your shop is listed for customers across Davao City.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={APPLY} className={PRIMARY}>Start free trial <ArrowRight size={16} aria-hidden="true" /></Link>
              <a href="#plans" className={SECONDARY}>See plans</a>
            </div>
            <p className="mt-4 text-xs text-ink-muted">Free for {TRIAL_DAYS} days once your shop is approved. Nothing to pay to apply.</p>
          </div>
          <OrderRecordCard />
        </section>

        {/* The desk */}
        <section aria-labelledby="desk-title" className="bg-[#F1EAE2] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl mobile-screen-margins">
            <h2 id="desk-title" className={`${H2} max-w-xl`}>The desk, the board and the money, in one place.</h2>
            <p className="mt-3 max-w-xl text-ink-body">Each part of your shop has its own screen, and every screen reads the same order.</p>
            <div className="mt-10 grid items-start gap-10 lg:grid-cols-2">
              <ul className="space-y-6">
                {DESK.map((d) => (
                  <li key={d.title} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9822D]" aria-hidden="true" />
                    <span>
                      <span className="block font-semibold text-ink">{d.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-ink-body">{d.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <JobBoardCard />
            </div>

            <h3 className="mt-16 text-lg font-semibold text-ink">Also in SUTURA</h3>
            <ul className="mt-6 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
              {ALSO.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <Icon size={18} className="mt-0.5 shrink-0 text-[#4A3428]" aria-hidden="true" />
                  <span>
                    <span className="block font-semibold text-ink">{title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-ink-body">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* For your customers */}
        <section aria-labelledby="customers-title" className="mx-auto grid max-w-6xl items-center gap-12 mobile-screen-margins py-16 sm:py-24 lg:grid-cols-2">
          <div className="order-2 lg:order-1"><CustomerPhones /></div>
          <div className="order-1 lg:order-2">
            <h2 id="customers-title" className={H2}>Your shop, on your customers&rsquo; phones.</h2>
            <p className="mt-3 text-ink-body">Every approved shop is listed on SUTURA, with its services, designs and reviews. Customers find you, book and come back.</p>
            <ul className="mt-8 space-y-5">
              {CUSTOMER_SIDE.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <Icon size={18} className="mt-0.5 shrink-0 text-[#C9822D]" aria-hidden="true" />
                  <span>
                    <span className="block font-semibold text-ink">{title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-ink-body">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it starts */}
        <section aria-labelledby="steps-title" className="border-t border-[#EAE3D9] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl mobile-screen-margins">
            <h2 id="steps-title" className={H2}>From application to your first booking.</h2>
            <ol className="mt-10 divide-y divide-[#E2D8CC] border-y border-[#E2D8CC]">
              {STEPS.map((s, i) => (
                <li key={s.title} className="grid gap-2 py-5 sm:grid-cols-[2.5rem_1fr_2fr_7rem] sm:items-baseline sm:gap-6">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F1EAE2] text-xs font-semibold text-[#4A3428] tabular-nums">{i + 1}</span>
                  <span className="font-semibold text-ink">{s.title}</span>
                  <span className="text-sm leading-relaxed text-ink-body">{s.text}</span>
                  <span className="text-xs font-semibold text-[#9A6A2E] sm:text-right">{s.when}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={APPLY} className={PRIMARY}>Apply now <ArrowRight size={16} aria-hidden="true" /></Link>
              <Link href="/terms?for=shop" className={SECONDARY}>Read the shop terms</Link>
            </div>
          </div>
        </section>

        {/* Plans */}
        <section id="plans" aria-labelledby="plans-title" className="scroll-mt-20 bg-[#F1EAE2] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl mobile-screen-margins">
            <h2 id="plans-title" className={H2}>Plans for one shop or a whole chain.</h2>
            <p className="mt-3 text-ink-body">Start with {TRIAL_DAYS} free days, then choose a plan whenever you are ready.</p>

            <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-[#E9C46A] bg-[#FFFBEF] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                  Free trial
                  <span className="rounded-full bg-[#E9C46A] px-2 py-0.5 text-[11px] font-semibold text-[#2E1C14]">₱0 for {TRIAL_DAYS} days</span>
                </p>
                <p className="mt-1 text-sm text-ink-body">Your chosen plan&rsquo;s features, free for {TRIAL_DAYS} days once your shop is approved. Nothing to pay to apply.</p>
              </div>
              <Link href={APPLY} className={`${PRIMARY} shrink-0`}>Start free trial</Link>
            </div>

            <div role="radiogroup" aria-label="Billing period" className="mx-auto mt-10 flex w-fit rounded-xl bg-white p-1 shadow-2xs ring-1 ring-[#DDD4C9]">
              {(['monthly', 'yearly'] as Cycle[]).map((c) => (
                <button key={c} type="button" role="radio" aria-checked={cycle === c} onClick={() => setCycle(c)}
                  className={`min-h-9 rounded-lg px-5 text-sm font-semibold transition-colors cursor-pointer ${cycle === c ? 'bg-[#2E1C14] text-white' : 'text-ink-muted hover:text-ink'}`}>
                  {c === 'monthly' ? 'Monthly' : 'Yearly'}
                </button>
              ))}
            </div>

            {plansError ? (
              <p className="mt-8 text-center text-sm text-ink-muted">Plans could not be loaded. They are also shown when you apply.</p>
            ) : plans.length === 0 ? (
              <div className="mt-8 grid gap-5 lg:grid-cols-3" aria-hidden="true">
                {[0, 1, 2].map((i) => <div key={i} className="h-96 animate-pulse rounded-2xl bg-white/70" />)}
              </div>
            ) : (
              <div className="mt-8 grid items-start gap-5 lg:grid-cols-3">
                {plans.map((p, i) => <PlanCard key={p.id} plan={p} cycle={cycle} featured={plans.length === 3 && i === 1} />)}
              </div>
            )}
            <p className="mt-6 text-center text-xs text-ink-muted">Paid with GCash. No automatic charges: a plan renews only when you pay again.</p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 mx-auto grid max-w-6xl gap-10 mobile-screen-margins py-16 sm:py-20 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <h2 id="faq-title" className={H2}>Good to know before you start.</h2>
            <p className="mt-3 text-sm text-ink-body">
              The full rules are in the <Link href="/terms?for=shop" className="font-semibold text-taupe-dark underline underline-offset-2 hover:text-ink">Terms of Service</Link>.
            </p>
          </div>
          <Faq items={faq} />
        </section>

        {/* Closing CTA */}
        <section className="bg-[#4A3428] py-16 text-white">
          <div className="mx-auto max-w-6xl mobile-screen-margins">
            <h2 className="text-display text-3xl sm:text-4xl font-semibold">Ready when your shop is.</h2>
            <p className="mt-3 max-w-md text-[#D8C6B2]">Apply today. Once the team verifies your documents, the first {TRIAL_DAYS} days are free.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={APPLY} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#E9C46A] px-5 text-sm font-semibold text-[#2E1C14] transition-colors hover:bg-[#F0D07E]">
                Start free trial <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href={SHOP_LOGIN} className="inline-flex min-h-11 items-center rounded-xl border border-white/30 px-5 text-sm font-semibold text-white transition-colors hover:border-white/60">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#2E1C14] text-white/70">
        <div className="mx-auto grid max-w-6xl gap-8 mobile-screen-margins py-10 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <SuturaLogo tone="dark" className="h-8" title="" />
            <p className="mt-2 text-xs">A web-based tailoring shop tracker for Davao City.</p>
          </div>
          {[
            ['On this page', [['Plans', '#plans'], ['FAQ', '#faq']]],
            ['Account', [['Open a shop', APPLY], ['Shop sign-in', SHOP_LOGIN]]],
            ['For customers', [['Discover shops', '/'], ['Terms of Service', '/terms'], ['Privacy Policy', '/privacy']]],
          ].map(([title, links]) => (
            <div key={title as string}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white">{title as string}</p>
              <ul className="space-y-1.5 text-sm">
                {(links as string[][]).map(([l, h]) => (
                  <li key={l}>{h.startsWith('#') ? <a href={h} className="hover:text-white">{l}</a> : <Link href={h} className="hover:text-white">{l}</Link>}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto max-w-6xl border-t border-white/10 mobile-screen-margins py-4 text-xs text-white/50">
          © {new Date().getFullYear()} SUTURA. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
