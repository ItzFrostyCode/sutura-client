'use client';

import { useEffect, useRef } from 'react';
import { BadgeCheck, Clock, Loader2, MapPin, RotateCcw, type LucideIcon } from 'lucide-react';
import PublicNav from '@/components/shared/PublicNav';
import { useAuthStore } from '@/store/useAuthStore';
import AskBadge from './AskBadge';
import AskAnswer from './AskAnswer';
import AskMenu from './AskMenu';
import AskSignIn from './AskSignIn';
import { MENUS } from './askQuestions';
import { useAskSutura } from './useAskSutura';

/**
 * Ask SUTURA (adviser request, after tarakape.cc's "Ask Kape"; polished 2026-10-14): the customer taps a numbered
 * question and gets an answer from SUTURA's own live data — verified shops (open now, distance, rating), their orders
 * and their appointments. No typing and no AI service, so nothing goes unanswered. Signed-in users only.
 */
export default function AskSutura() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const signedIn = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="flex min-h-dvh flex-col bg-canvas selection:bg-taupe/25">
      <PublicNav />
      <main className="mx-auto w-full max-w-3xl flex-1 mobile-screen-margins pb-10 pt-8 sm:pt-12">
        {!hydrated ? (
          <div className="flex justify-center py-24"><Loader2 size={28} className="animate-spin text-ink-faint" aria-label="Loading" /></div>
        ) : signedIn ? (
          <Conversation />
        ) : (
          <AskSignIn />
        )}
      </main>
    </div>
  );
}

function Conversation() {
  const firstName = useAuthStore((s) => s.user?.name?.split(' ')[0] ?? '');
  const { messages, menu, choose, busy, reset, location, locating, locateAndAsk } = useAskSutura();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const choices = <AskMenu options={MENUS[menu]} withBack={menu !== 'main'} disabled={busy} onChoose={(id) => void choose(id)} />;

  if (messages.length === 0) {
    return (
      <>
        <Welcome firstName={firstName} locationOn={!!location} />
        <div className="mt-8">{choices}</div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-display text-2xl text-ink sm:text-3xl">Ask SUTURA</h1>
        <button type="button" onClick={reset} className="inline-flex min-h-10 items-center gap-1.5 px-2 text-sm font-medium text-ink-muted hover:text-ink cursor-pointer focus-visible:outline-2 focus-visible:outline-taupe">
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
              <AskBadge size="sm" />
              <div className="min-w-0 flex-1 pt-0.5">
                <AskAnswer answer={m.answer} onRetry={(id) => void choose(id)} onLocate={locateAndAsk} locating={locating} />
              </div>
            </li>
          ),
        )}
      </ol>
      {!busy && <div className="mt-8 border-t border-line pt-6">{choices}</div>}
      <div ref={endRef} />
    </>
  );
}

function Welcome({ firstName, locationOn }: { readonly firstName: string; readonly locationOn: boolean }) {
  const facts: { icon: LucideIcon; text: string }[] = [
    { icon: BadgeCheck, text: 'Verified shops only' },
    { icon: Clock, text: 'Knows who’s open now' },
    { icon: MapPin, text: locationOn ? 'Nearest to you first' : 'Uses your location when on' },
  ];
  return (
    <section className="relative border border-line bg-surface px-5 py-10 text-center sm:px-10 sm:py-12">
      {/* A tailor's basting stitch around the panel — the one ornament. */}
      <span className="pointer-events-none absolute inset-2.5 border border-dashed border-taupe/35" aria-hidden="true" />
      <div className="relative">
        <div className="mx-auto mb-5 w-fit"><AskBadge size="lg" /></div>
        <h1 className="text-display text-3xl text-ink sm:text-4xl">Ask SUTURA</h1>
        <p className="mx-auto mt-3 max-w-[52ch] text-[15px] leading-relaxed text-ink-body">
          {firstName ? `Hi, ${firstName}! ` : ''}Tap a question below. I answer from SUTURA&rsquo;s live data: the verified Davao shops that can do the work, who&rsquo;s open and how far they are, and where your own orders and appointments stand.
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
  );
}
