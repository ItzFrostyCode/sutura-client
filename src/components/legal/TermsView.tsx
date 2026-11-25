'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, BadgeCheck, CalendarCheck, ChevronDown, DoorOpen, Ruler, Scissors, Search, Wallet, X,
  type LucideIcon,
} from 'lucide-react';
import PublicNav from '@/components/shared/PublicNav';

type Audience = 'all' | 'customer' | 'shop';

/**
 * A block of section text. A list item may start with "**Lead.** " to bold
 * its first words. Kept as plain strings so the search box can match them.
 */
type Block = { p: string } | { ul: string[] };

interface TermsSection {
  readonly id: string;
  readonly heading: string;
  /** Who the section is for; 'all' shows under every filter. */
  readonly for: Audience;
  readonly body: readonly Block[];
}

export const TERMS_UPDATED = 'November 25, 2026';
export const TERMS_VERSION = '2026-11-25';

const SUMMARY: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Scissors, title: 'We make the software', text: 'Each shop does its own tailoring and sets its own prices and policies.' },
  { icon: Wallet, title: 'You pay the shop', text: 'SUTURA does not take payment from customers. Shops record what they receive.' },
  { icon: CalendarCheck, title: 'Honest and accurate', text: 'Give true information. Under 18? Use SUTURA with a parent or guardian.' },
  { icon: BadgeCheck, title: 'Shops are verified', text: 'Owners verify their identity and business first, and need an active plan or the free trial.' },
  { icon: Ruler, title: 'Measurements stay with you', text: 'A shop enters your measurements, and they are kept on your account.' },
  { icon: DoorOpen, title: 'Leaving is easy', text: 'To close an account, ask through Support or reply to any SUTURA email.' },
];

const SECTIONS: readonly TermsSection[] = [
  {
    id: 'what-sutura-is', heading: 'What SUTURA is', for: 'all',
    body: [
      { p: 'SUTURA is a web platform for tailoring shops and their customers in Davao City. Shop owners and their staff use the dashboard to manage branches, services, designs, staff, appointments, job orders and payment records. Customers use the SUTURA site to find verified shops, book fittings, place orders and follow an order from request to pickup.' },
      { p: 'SUTURA provides the software. The shop provides the tailoring. We are not a party to the work a shop does for its customers.' },
    ],
  },
  {
    id: 'your-account', heading: 'Your account', for: 'all',
    body: [
      { p: 'Give accurate information and keep your password safe. You are responsible for what happens under your account. If you are under 18, use SUTURA with a parent or guardian.' },
      { p: 'Shop owners are responsible for the staff and branch manager accounts they create, and for what those accounts do.' },
    ],
  },
  {
    id: 'shop-applications', heading: 'Shop owners: verification', for: 'shop',
    body: [
      { p: 'Everything you submit when applying to open a shop, including your documents, government ID and selfie, must be true and must belong to you or your business. We may reject an application, or suspend a shop later, if any of it turns out to be false, borrowed or edited.' },
      { p: 'Shop applications and branch locations are reviewed before they appear publicly. A branch whose address or map pin changes is reviewed again.' },
    ],
  },
  {
    // Billing's "Subscription Agreement" link and the cancel dialog point here.
    // The cancel dialog accepts terms version 2026-11-24 (SubscriptionController::CANCEL_TERMS_VERSION):
    // change this wording only together with that version.
    id: 'subscription-agreement', heading: 'Shop owners: plans and payment', for: 'shop',
    body: [
      { p: 'A shop plan (Basic, Pro or Premium) is paid with GCash for a monthly (30-day) or yearly (365-day) period. SUTURA never charges you automatically: a plan renews only when you pay for it again in Billing.' },
      {
        ul: [
          '**Changing plans.** An upgrade starts right away, and the days left on your current plan are added to the new one. A downgrade starts when your current period ends.',
          '**Free trial.** A new shop can start with a 14-day free trial, once per shop. Choose a plan before it ends.',
          '**Cancelling.** You can cancel at any time in Billing. You keep full access to your plan until its end date, and you can undo the cancellation until then. Days already paid for are not refunded.',
          '**When a plan ends** (cancelled, not renewed, or a trial that ran out), your shop is hidden from customers and becomes read-only: no new orders, appointments or edits, for you or your staff. Every record is kept and you can still view and export it. Billing and Support stay open, and paying for a plan restores everything.',
        ],
      },
    ],
  },
  {
    id: 'booking-and-orders', heading: 'Customers: booking and orders', for: 'customer',
    body: [
      { p: 'Orders, prices, deposits, fittings and pickup are agreed between you and the shop. SUTURA records them so both of you can follow the order, but the shop is responsible for the work it accepts.' },
      { p: 'A shop may accept, decline or reschedule a booking, and may ask for a fitting or a deposit before it starts. Each order shows its current stage, so you can see where it is without asking.' },
    ],
  },
  {
    id: 'payments-to-shops', heading: 'Customers: paying a shop', for: 'customer',
    body: [
      { p: 'SUTURA does not take or hold your money. You pay the shop directly, in person or by the GCash account the shop lists. When you upload a receipt, the payment stays pending until the shop checks it.' },
      { p: 'Refunds, deposits you want back and disagreements about the work are settled with the shop. SUTURA only keeps the record of what was paid.' },
    ],
  },
  {
    id: 'listings-and-reviews', heading: 'Listings and reviews', for: 'all',
    body: [
      { p: 'Shops must describe their services, designs and prices honestly and keep them up to date.' },
      { p: 'Reviews and ratings must be about a real experience with that shop or item. We may hide a listing or a review that is false, offensive or not the poster’s to share, and tell the shop why.' },
    ],
  },
  {
    id: 'acceptable-use', heading: 'What you must not do', for: 'all',
    body: [
      {
        ul: [
          'Upload content that is false, offensive or not yours to share.',
          'Try to access other people’s accounts or data, or disrupt the service.',
          'Use SUTURA to send spam or misleading messages.',
          'Copy, scrape or resell SUTURA’s listings or data.',
        ],
      },
    ],
  },
  {
    id: 'shop-data', heading: 'Data that shops put into SUTURA', for: 'shop',
    body: [
      { p: 'Your shop’s records (customers, measurements, orders, payments and staff) belong to your shop. Use customer information only to serve that customer, and keep it private, as the Philippine Data Privacy Act of 2012 requires.' },
      { p: 'We keep your records while your account exists, including after a plan ends, so you can still view and export them.' },
    ],
  },
  {
    id: 'suspension-and-closing', heading: 'Suspension and closing an account', for: 'all',
    body: [
      { p: 'We may suspend an account that breaks these terms. A suspended account is signed out and cannot sign in until it is reactivated.' },
      { p: 'To close your account, ask through Support in your account, or reply to any email you received from SUTURA.' },
    ],
  },
  {
    id: 'availability', heading: 'Availability and changes to the service', for: 'all',
    body: [
      { p: 'We try to keep SUTURA running, but it may sometimes be unavailable, for example during updates. SUTURA needs an internet connection; it does not work offline. We may add, change or remove features over time.' },
    ],
  },
  {
    id: 'our-responsibility', heading: 'Our responsibility to you', for: 'all',
    body: [
      { p: 'SUTURA is provided as it is. We are not responsible for the quality, fit, price or timing of a shop’s work, or for payments made between customers and shops. Nothing in these terms removes rights you have under Philippine law.' },
    ],
  },
  {
    id: 'governing-law', heading: 'Governing law', for: 'all',
    body: [{ p: 'These terms are governed by the laws of the Republic of the Philippines.' }],
  },
  {
    id: 'changes', heading: 'Changes to these terms', for: 'all',
    body: [{ p: 'We may update these terms. The date and version at the top show when they last changed. If you keep using SUTURA after a change, the new terms apply.' }],
  },
  {
    id: 'contact', heading: 'Contact', for: 'all',
    body: [{ p: 'Questions about these terms? Use Support in your account, or reply to any email you received from SUTURA. How we handle your information is described in our Privacy Policy.' }],
  },
];

const AUDIENCES: { id: Audience; label: string; hint: string }[] = [
  { id: 'all', label: 'Everything', hint: 'The full terms' },
  { id: 'customer', label: 'I’m a customer', hint: 'Booking and ordering' },
  { id: 'shop', label: 'I own a shop', hint: 'Running a shop on SUTURA' },
];

const NUMBER = new Map(SECTIONS.map((s, i) => [s.id, i + 1]));
const plainText = (s: TermsSection) =>
  [s.heading, ...s.body.flatMap((b) => ('p' in b ? [b.p] : b.ul))].join(' ').replace(/\*\*/g, '').toLowerCase();
const appliesTo = (s: TermsSection, a: Audience) => a === 'all' || s.for === 'all' || s.for === a;

function Rich({ text }: Readonly<{ text: string }>) {
  const m = /^\*\*(.+?)\*\*\s*(.*)$/.exec(text);
  return m ? <><strong className="font-semibold text-ink">{m[1]}</strong> {m[2]}</> : <>{text}</>;
}

export default function TermsView() {
  const [audience, setAudience] = useState<Audience>('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Set<string>>(() => new Set([SECTIONS[0].id]));
  const [active, setActive] = useState(SECTIONS[0].id);
  const refs = useRef<Record<string, HTMLElement | null>>({});

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () => SECTIONS.filter((s) => appliesTo(s, audience) && (!q || plainText(s).includes(q))),
    [audience, q],
  );
  const counts = useMemo(
    () => Object.fromEntries(AUDIENCES.map((a) => [a.id, SECTIONS.filter((s) => appliesTo(s, a.id)).length])) as Record<Audience, number>,
    [],
  );

  const openAndScroll = useCallback((id: string) => {
    setOpen((prev) => new Set(prev).add(id));
    requestAnimationFrame(() => refs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, []);

  // ?for=shop|customer picks the filter; a #section link (Billing → #subscription-agreement) opens it.
  useEffect(() => {
    const forParam = new URLSearchParams(window.location.search).get('for');
    if (forParam === 'shop' || forParam === 'customer') setAudience(forParam);
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (hash && NUMBER.has(hash)) {
      const target = SECTIONS.find((s) => s.id === hash);
      if (target && forParam && !appliesTo(target, forParam as Audience)) setAudience('all');
      setTimeout(() => openAndScroll(hash), 50);
    }
    // A #section link followed while already on the page.
    const onHash = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      if (NUMBER.has(h)) openAndScroll(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [openAndScroll]);

  // Contents highlight follows the reader.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: '-90px 0px -65% 0px' },
    );
    visible.forEach((s) => { const el = refs.current[s.id]; if (el) io.observe(el); });
    return () => io.disconnect();
  }, [visible]);

  const toggle = (id: string) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const allOpen = visible.length > 0 && visible.every((s) => open.has(s.id));

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <PublicNav featureNav />

      <main className="flex-1 mobile-screen-margins py-10 sm:py-14">
        <div className="mx-auto w-full max-w-5xl">
          {/* Title */}
          <h1 className="mobile-h1 sm:tablet-h1 text-ink">Terms of Service</h1>
          <p className="mt-2 text-xs text-ink-muted">Last updated {TERMS_UPDATED} · Version {TERMS_VERSION}</p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-body">
            These terms are the agreement between you and SUTURA (&ldquo;we&rdquo;, &ldquo;us&rdquo;) for using the
            SUTURA website at suturaofficial.tech. By creating an account or using SUTURA, you agree to them. If you do
            not agree, please do not use SUTURA.
          </p>

          {/* Plain-words summary */}
          <section aria-labelledby="terms-summary" className="mt-12">
            <h2 id="terms-summary" className="text-base font-semibold text-ink">In plain words</h2>
            <ul className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {SUMMARY.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sunken text-ink-body">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">{title}</span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-ink-muted">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[11px] text-ink-faint">This summary is not a substitute for the full text below.</p>
          </section>

          {/* Audience + search */}
          <section aria-labelledby="terms-for" className="mt-12">
            <h2 id="terms-for" className="text-lg font-semibold text-ink">Read what applies to you</h2>
            <div role="radiogroup" aria-label="Show terms for" className="mt-4 grid gap-3 sm:grid-cols-3">
              {AUDIENCES.map((a) => {
                const on = audience === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setAudience(a.id)}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe ${
                      on ? 'border-[#4A3428] bg-[#4A3428] text-white' : 'border-line-strong/70 bg-surface text-ink hover:border-ink-faint'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{a.label}</span>
                      <span className={`block text-[11px] ${on ? 'text-[#D8C6B2]' : 'text-ink-muted'}`}>{a.hint}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${on ? 'bg-white/15 text-white' : 'bg-sunken text-ink-muted'}`}>
                      {counts[a.id]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search these terms</span>
                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search these terms"
                  className="h-11 w-full rounded-xl border border-line-strong/70 bg-surface pl-10 pr-10 text-sm text-ink placeholder:text-ink-faint focus:border-taupe focus:outline-none"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} aria-label="Clear search"
                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted hover:bg-sunken hover:text-ink cursor-pointer">
                    <X size={15} />
                  </button>
                )}
              </label>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-ink-muted tabular-nums" aria-live="polite">
                  {visible.length} {visible.length === 1 ? 'section' : 'sections'}
                </span>
                <button type="button" onClick={() => setOpen(new Set(visible.map((s) => s.id)))} disabled={allOpen}
                  className="font-semibold text-taupe-dark hover:text-ink disabled:opacity-40 cursor-pointer disabled:cursor-default">Expand all</button>
                <button type="button" onClick={() => setOpen(new Set())} disabled={open.size === 0}
                  className="font-semibold text-taupe-dark hover:text-ink disabled:opacity-40 cursor-pointer disabled:cursor-default">Collapse</button>
              </div>
            </div>
          </section>

          {/* Contents + sections */}
          <div className="mt-8 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
            <nav aria-label="Contents" className="hidden lg:block">
              <div className="sticky top-24">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Contents</p>
                <ol className="border-l border-line">
                  {visible.map((s) => {
                    const on = active === s.id;
                    return (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          onClick={(e) => { e.preventDefault(); history.replaceState(null, '', `#${s.id}`); openAndScroll(s.id); }}
                          aria-current={on ? 'true' : undefined}
                          className={`-ml-px flex gap-3 border-l-2 py-1.5 pl-3.5 pr-2 text-[13px] leading-snug transition-colors ${
                            on ? 'border-ink font-semibold text-ink' : 'border-transparent text-ink-muted hover:text-ink'
                          }`}
                        >
                          <span className="w-5 shrink-0 tabular-nums">{NUMBER.get(s.id)}</span>
                          <span>{s.heading}</span>
                        </a>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </nav>

            <div className="min-w-0">
              {visible.length === 0 ? (
                <div className="rounded-xl border border-line bg-surface px-5 py-10 text-center">
                  <p className="font-semibold text-ink">Nothing matches &ldquo;{query}&rdquo;</p>
                  <p className="mt-1 text-sm text-ink-muted">Try another word, or switch to Everything.</p>
                </div>
              ) : (
                <div className="border-t border-line">
                  {visible.map((s) => {
                    const isOpen = open.has(s.id) || q.length > 0;
                    const panelId = `${s.id}-panel`;
                    return (
                      <section key={s.id} id={s.id} ref={(el) => { refs.current[s.id] = el; }} className="scroll-mt-24 border-b border-line">
                        <h2>
                          <button
                            type="button"
                            onClick={() => toggle(s.id)}
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                            className="flex w-full items-center gap-4 py-4 text-left cursor-pointer group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe"
                          >
                            <span className="w-7 shrink-0 text-base font-semibold tabular-nums text-[#B4672A]">{NUMBER.get(s.id)}</span>
                            <span className="flex-1 text-base sm:text-[17px] font-semibold text-ink group-hover:text-taupe-dark transition-colors">{s.heading}</span>
                            <ChevronDown size={18} className={`shrink-0 text-ink-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                          </button>
                        </h2>
                        {isOpen && (
                          <div id={panelId} className="space-y-3 pb-6 pl-11 pr-2 text-[15px] leading-relaxed text-ink-body">
                            {s.body.map((b, i) => ('p' in b ? (
                              <p key={i}><Rich text={b.p} /></p>
                            ) : (
                              <ul key={i} className="list-disc space-y-2 pl-5 marker:text-ink-faint">
                                {b.ul.map((li) => <li key={li}><Rich text={li} /></li>)}
                              </ul>
                            )))}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              )}

              <p className="mt-10 text-sm text-ink-muted">Questions? Use Support in your account, or reply to any email you received from SUTURA.</p>
              <Link href="/privacy" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-taupe-dark hover:text-ink">
                Privacy Policy <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 mobile-screen-margins py-5 text-xs text-ink-muted">
          <span>© {new Date().getFullYear()} SUTURA</span>
          <span>
            <Link href="/terms" className="underline underline-offset-2 hover:text-ink">Terms of Service</Link>
            {' · '}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">Privacy Policy</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
