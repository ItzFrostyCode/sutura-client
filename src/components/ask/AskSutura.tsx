'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, BadgeCheck, Clock, GraduationCap, LocateFixed, MapPin, RotateCcw,
  Scissors, SendHorizontal, Shirt, Sparkles, Spool, Wallet, type LucideIcon,
} from 'lucide-react';
import PublicNav from '@/components/shared/PublicNav';
import SuturaLogo from '@/components/brand/SuturaLogo';
import AskShopRow from './AskShopRow';
import { useAskSutura, type AskAnswer } from './useAskSutura';

const SUGGESTIONS: { text: string; icon: LucideIcon }[] = [
  { text: 'Barong near me', icon: Shirt },
  { text: 'Open now for alterations', icon: Scissors },
  { text: 'Best gown makers', icon: Sparkles },
  { text: 'School uniforms in Buhangin', icon: GraduationCap },
  { text: 'Custom tailoring under ₱2,000', icon: Wallet },
  { text: 'Track my order', icon: Spool },
];

/**
 * Ask SUTURA (adviser request, after tarakape.cc's "Ask Kape"): a customer
 * types what they need in their own words and gets verified Davao shops
 * back — open now, distance, rating. Answers come from SUTURA's own shop
 * data through lib/askSutura, not an AI service.
 */
export default function AskSutura() {
  const { messages, ask, busy, reset, location, locating, locateAndAsk } = useAskSutura();
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    void ask(text);
    setDraft('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex min-h-dvh flex-col bg-canvas selection:bg-taupe/25">
      <PublicNav featureNav />

      <main className="mx-auto w-full max-w-3xl flex-1 mobile-screen-margins pb-10 pt-8 sm:pt-12">
        {messages.length === 0 ? (
          <Welcome locationOn={!!location} onPick={send} />
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between gap-3">
              <h1 className="text-display text-2xl text-ink sm:text-3xl">Ask SUTURA</h1>
              <button
                type="button"
                onClick={() => { reset(); inputRef.current?.focus(); }}
                className="inline-flex min-h-10 items-center gap-1.5 px-2 text-sm font-medium text-ink-muted hover:text-ink cursor-pointer focus-visible:outline-2 focus-visible:outline-taupe"
              >
                <RotateCcw size={15} aria-hidden="true" /> Start over
              </button>
            </div>
            <ol className="space-y-5" aria-live="polite">
              {messages.map((m) =>
                m.from === 'customer' ? (
                  <li key={m.id} className="flex justify-end">
                    <p className="max-w-[85%] bg-ink px-4 py-2.5 text-sm leading-relaxed text-white">{m.text}</p>
                  </li>
                ) : (
                  <li key={m.id} className="flex items-start gap-3">
                    <SuturaMark size="sm" />
                    <div className="min-w-0 flex-1 pt-0.5">
                      <Answer answer={m.answer} onRetry={send} onLocate={locateAndAsk} locating={locating} />
                    </div>
                  </li>
                ),
              )}
            </ol>
            <div ref={endRef} />
          </>
        )}
      </main>

      <div className="sticky bottom-(--fnav-h) z-10 border-t border-line bg-canvas">
        <form
          onSubmit={(e) => { e.preventDefault(); send(draft); }}
          className="mx-auto flex w-full max-w-3xl items-center gap-2 mobile-screen-margins pt-3"
        >
          <label htmlFor="ask-sutura-input" className="sr-only">Ask SUTURA</label>
          <input
            id="ask-sutura-input"
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="What do you need sewn, mended or fitted?"
            autoComplete="off"
            maxLength={160}
            className="h-12 min-w-0 flex-1 border border-line bg-surface px-4 text-[15px] text-ink caret-taupe placeholder:text-ink-faint focus:border-taupe focus:outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim() || busy}
            aria-label="Send question"
            className="flex h-12 w-12 shrink-0 items-center justify-center bg-ink text-white transition-colors hover:bg-black disabled:bg-[#CDBFB4] disabled:cursor-not-allowed cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe"
          >
            <SendHorizontal size={19} aria-hidden="true" />
          </button>
        </form>
        <p className="mx-auto max-w-3xl mobile-screen-margins pb-3 pt-2 text-center text-xs text-ink-muted">
          Answers come from verified SUTURA shops in Davao City{location ? ', nearest to you first' : ''}.
        </p>
      </div>
    </div>
  );
}

function SuturaMark({ size }: { readonly size: 'sm' | 'lg' }) {
  const box = size === 'lg' ? 'h-20 w-20' : 'h-8 w-8';
  return (
    <span className={`relative flex shrink-0 items-center justify-center bg-[#EFE6DA] ${box}`} aria-hidden="true">
      <SuturaLogo variant="mark" title="" className={size === 'lg' ? 'h-14' : 'h-6'} />
    </span>
  );
}

function Welcome({ locationOn, onPick }: { readonly locationOn: boolean; readonly onPick: (text: string) => void }) {
  const facts: { icon: LucideIcon; text: string }[] = [
    { icon: BadgeCheck, text: 'Verified shops only' },
    { icon: Clock, text: 'Knows who’s open now' },
    { icon: MapPin, text: locationOn ? 'Nearest to you first' : 'Uses your location when on' },
  ];

  return (
    <>
      <section className="relative border border-line bg-surface px-5 py-10 text-center sm:px-10 sm:py-12">
        {/* A tailor's basting stitch around the panel — the one ornament. */}
        <span className="pointer-events-none absolute inset-2.5 border border-dashed border-taupe/35" aria-hidden="true" />
        <div className="relative">
          <div className="mx-auto mb-5 w-fit"><SuturaMark size="lg" /></div>
          <h1 className="text-display text-3xl text-ink sm:text-4xl">Ask SUTURA</h1>
          <p className="mx-auto mt-3 max-w-[52ch] text-[15px] leading-relaxed text-ink-body">
            Tell us what you need sewn, mended or fitted, in your own words. We&rsquo;ll find the verified Davao shops that can do it, and show who&rsquo;s open, how far they are, and how customers rate them.
          </p>
          <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-ink-muted">
            {facts.map(({ icon: Icon, text }) => (
              <li key={text} className="inline-flex items-center gap-1.5">
                <Icon size={15} className="text-taupe" aria-hidden="true" /> {text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="mt-8 text-sm text-ink-muted">Not sure how to ask? Start with one of these:</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map(({ text, icon: Icon }) => (
          <li key={text}>
            <button
              type="button"
              onClick={() => onPick(text)}
              className="inline-flex min-h-11 items-center gap-2 border border-line bg-surface px-3.5 text-sm font-medium text-ink transition-colors hover:border-ink cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe"
            >
              <Icon size={16} className="text-taupe" aria-hidden="true" /> {text}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function Answer({ answer, onRetry, onLocate, locating }: {
  readonly answer: AskAnswer;
  readonly onRetry: (q: string) => void;
  readonly onLocate: (q: string) => void;
  readonly locating: boolean;
}) {
  const say = 'text-[15px] leading-relaxed text-ink-body';
  const action = 'inline-flex min-h-10 items-center gap-1.5 border border-line-strong bg-surface px-3.5 text-sm font-semibold text-ink hover:border-ink cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe disabled:opacity-60';

  switch (answer.kind) {
    case 'loading':
      return (
        <p className={`${say} inline-flex items-center gap-2 text-ink-muted`}>
          <Spool size={16} className="animate-spin text-taupe [animation-duration:1.6s]" aria-hidden="true" />
          Looking through the shops…
        </p>
      );
    case 'error':
      return (
        <div className="space-y-3">
          <p className={say}>I couldn&rsquo;t reach the shop list just now. Check your connection, then try again.</p>
          <button type="button" onClick={() => onRetry(answer.question)} className={action}>
            <RotateCcw size={15} aria-hidden="true" /> Try again
          </button>
        </div>
      );
    case 'unclear':
      return (
        <p className={say}>
          Tell me a garment, a service or a place, like &ldquo;barong in Talomo&rdquo;, &ldquo;alterations open now&rdquo; or &ldquo;school uniforms under ₱1,500&rdquo;.
        </p>
      );
    case 'link':
      return (
        <div className="space-y-3">
          <p className={say}>{answer.reply}</p>
          <Link href={answer.href} className={action}>
            {answer.cta} <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      );
    case 'shops': {
      const { shops, total, terms, dropped } = answer;
      const filters = terms.filter((t) => !dropped.some((d) => d.key === t.key));
      return (
        <div className="space-y-3">
          {total === 0 ? (
            <>
              <p className={say}>
                No verified shop on SUTURA matches that yet. Try another garment or a nearby district, or look around the map.
              </p>
              <Link href="/map" className={action}>
                <MapPin size={15} aria-hidden="true" /> Open the map
              </Link>
            </>
          ) : (
            <>
              <p className={say}>
                {total === 1 ? 'I found 1 shop' : `I found ${total} shops`}
                {filters.length > 0 && ' for '}
                {filters.map((t, i) => (
                  <span key={t.key}>
                    {i > 0 && (i === filters.length - 1 ? ' and ' : ', ')}
                    <strong className="font-semibold text-ink">{t.label}</strong>
                  </span>
                ))}
                .
                {dropped.length > 0 && ` Nothing matched everything, so I left out ${dropped.map((d) => d.label).join(' and ')}.`}
              </p>
              <ul className="divide-y divide-line border border-line bg-surface">
                {shops.map((s) => <AskShopRow key={s.id} shop={s} />)}
              </ul>
              {total > shops.length && (
                <Link href={answer.seeAllHref} className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-taupe underline-offset-4 hover:underline">
                  See all {total} shops <ArrowRight size={15} aria-hidden="true" />
                </Link>
              )}
            </>
          )}
          {answer.needsLocation && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <p className="text-sm text-ink-muted">Turn on your location to see the shops closest to you.</p>
              <button type="button" onClick={() => onLocate(answer.question)} disabled={locating} className={action}>
                <LocateFixed size={15} aria-hidden="true" /> {locating ? 'Locating…' : 'Use my location'}
              </button>
            </div>
          )}
        </div>
      );
    }
  }
}
