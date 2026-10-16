import { Check, Ban, PauseCircle, ArrowRight } from 'lucide-react';
import type { OrderProgress } from './orderProgress';

/**
 * Where the order is, in five steps, with one plain sentence under it. The same view for a signed-in
 * customer and a guest with a tracking code.
 */
export default function OrderProgressView({ progress }: Readonly<{ progress: OrderProgress }>) {
  if (progress.closed) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-danger">
        <Ban size={20} className="mt-0.5 shrink-0" />
        <p className="mobile-body-md font-semibold">{progress.headline}</p>
      </div>
    );
  }

  return (
    <div>
      <ol className="grid grid-cols-5 gap-1" aria-label="Order progress">
        {progress.stages.map((stage, i) => {
          const done = stage.state === 'done';
          const current = stage.state === 'current';
          return (
            <li key={stage.key} className="flex flex-col items-center text-center" aria-current={current ? 'step' : undefined}>
              <div className="flex w-full items-center">
                <span className={`h-0.5 flex-1 ${i === 0 ? 'opacity-0' : done || current ? 'bg-sage' : 'bg-line'}`} />
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    done ? 'bg-sage text-white' : current ? 'bg-taupe text-white ring-4 ring-taupe/15' : 'bg-sunken text-ink-faint'
                  }`}
                >
                  {done ? <Check size={15} strokeWidth={2.6} /> : i + 1}
                </span>
                <span className={`h-0.5 flex-1 ${i === progress.stages.length - 1 ? 'opacity-0' : done ? 'bg-sage' : 'bg-line'}`} />
              </div>
              <span className={`mobile-caption mt-1.5 leading-tight ${current ? 'font-semibold text-ink' : done ? 'text-sage' : 'text-ink-faint'}`}>{stage.label}</span>
              <span className="sr-only">{done ? ' — done' : current ? ' — now' : ''}</span>
            </li>
          );
        })}
      </ol>

      <div className="mt-4">
        {progress.on_hold && (
          <p className="mobile-caption mb-2 inline-flex items-center gap-1.5 rounded-full bg-sunken px-2.5 py-1 font-semibold text-ink-muted">
            <PauseCircle size={13} /> On hold
          </p>
        )}
        <p className="mobile-h4 text-ink">{progress.headline}</p>
        {progress.detail && <p className="mobile-body-sm mt-1 font-normal text-ink-body">{progress.detail}</p>}
        {progress.action && (
          <p className="mobile-body-sm mt-3 inline-flex items-center gap-1.5 font-semibold text-taupe">
            <ArrowRight size={15} /> {progress.action.label}
          </p>
        )}
      </div>
    </div>
  );
}
