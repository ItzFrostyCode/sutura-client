import Link from 'next/link';
import { ArrowRight, LocateFixed, MapPin, RotateCcw, Spool } from 'lucide-react';
import { HOW_IT_WORKS } from '@/components/home/homeTypes';
import AskShopRow from './AskShopRow';
import AskOrderRow from './AskOrderRow';
import AskAppointmentRow from './AskAppointmentRow';
import type { AskAnswer as Answer } from './useAskSutura';

interface AskAnswerProps {
  readonly answer: Answer;
  readonly onRetry: (optionId: string) => void;
  readonly onLocate: (optionId: string) => void;
  readonly locating: boolean;
}

const say = 'text-[15px] leading-relaxed text-ink-body';
const action = 'inline-flex min-h-10 items-center gap-1.5 border border-line-strong bg-surface px-3.5 text-sm font-semibold text-ink hover:border-ink cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe disabled:opacity-60';
const list = 'divide-y divide-line border border-line bg-surface';
const more = 'inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-taupe underline-offset-4 hover:underline';

/** SUTURA's reply to one choice, read from live data. */
export default function AskAnswer({ answer, onRetry, onLocate, locating }: AskAnswerProps) {
  switch (answer.kind) {
    case 'loading':
      return (
        <p className={`${say} inline-flex items-center gap-2 text-ink-muted`}>
          <Spool size={16} className="animate-spin text-taupe [animation-duration:1.6s]" aria-hidden="true" />
          Looking it up…
        </p>
      );
    case 'error':
      return (
        <div className="space-y-3">
          <p className={say}>I couldn&rsquo;t reach SUTURA just now. Check your connection, then try again.</p>
          <button type="button" onClick={() => onRetry(answer.optionId)} className={action}>
            <RotateCcw size={15} aria-hidden="true" /> Try again
          </button>
        </div>
      );
    case 'text':
      return <p className={say}>{answer.text}</p>;
    case 'steps':
      return (
        <div className="space-y-3">
          <p className={say}>Ordering on SUTURA goes in five steps:</p>
          <ol className="space-y-2.5">
            {HOW_IT_WORKS.map((s) => (
              <li key={s.step} className="flex gap-3">
                <span className="w-6 shrink-0 text-sm font-semibold text-taupe">{s.step}</span>
                <p className={say}><strong className="font-semibold text-ink">{s.title}.</strong> {s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      );
    case 'orders':
      return answer.total === 0 ? (
        <div className="space-y-3">
          <p className={say}>You have no orders in progress right now.</p>
          <Link href="/account/orders" className={action}>See my past orders <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
      ) : (
        <div className="space-y-3">
          <p className={say}>{answer.total === 1 ? 'You have 1 order in progress:' : `You have ${answer.total} orders in progress:`}</p>
          <ul className={list}>{answer.orders.map((o) => <AskOrderRow key={o.id} order={o} />)}</ul>
          <Link href="/account/orders" className={more}>All my orders <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
      );
    case 'appointments':
      return answer.total === 0 ? (
        <div className="space-y-3">
          <p className={say}>You have no upcoming appointments.</p>
          <Link href="/search" className={action}><MapPin size={15} aria-hidden="true" /> Find a shop to book</Link>
        </div>
      ) : (
        <div className="space-y-3">
          <p className={say}>{answer.total === 1 ? 'Your next appointment:' : `You have ${answer.total} upcoming appointments. The next ones:`}</p>
          <ul className={list}>{answer.appointments.map((a) => <AskAppointmentRow key={a.id} appointment={a} />)}</ul>
          <Link href="/account/appointments" className={more}>All my appointments <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
      );
    case 'shops': {
      const { shops, total } = answer;
      return (
        <div className="space-y-3">
          {total === 0 ? (
            <>
              <p className={say}>{answer.empty}</p>
              <Link href="/search" className={action}><MapPin size={15} aria-hidden="true" /> Open the map</Link>
            </>
          ) : (
            <>
              <p className={say}>
                {total === 1 ? 'I found 1 shop' : `I found ${total} shops`}{' '}
                {answer.needsLocation ? 'in Davao City' : answer.about}.
              </p>
              <ul className={list}>{shops.map((s) => <AskShopRow key={s.id} shop={s} />)}</ul>
              {total > shops.length && (
                <Link href={answer.seeAllHref} className={more}>See all {total} shops <ArrowRight size={15} aria-hidden="true" /></Link>
              )}
            </>
          )}
          {answer.needsLocation && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <p className="text-sm text-ink-muted">Turn on your location to see the shops closest to you.</p>
              <button type="button" onClick={() => onLocate(answer.optionId)} disabled={locating} className={action}>
                <LocateFixed size={15} aria-hidden="true" /> {locating ? 'Locating…' : 'Use my location'}
              </button>
            </div>
          )}
        </div>
      );
    }
  }
}
