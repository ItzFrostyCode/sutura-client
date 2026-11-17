/**
 * Where a step-by-step flow is, on a phone (under 600px), where a row of every step's name does not fit: the current
 * step by name, how many there are, the next one, and one bar segment per step. Used by the online order, the walk-in
 * job order and the booking, so all three read the same; wider screens keep their full row of steps.
 */
export default function FlowProgress({ labels, current, className = '' }: Readonly<{ labels: readonly string[]; current: number; className?: string }>) {
  const total = labels.length;
  const index = Math.min(Math.max(current, 1), total);
  const next = labels[index];
  return (
    <div className={className} role="group" aria-label={`Step ${index} of ${total}: ${labels[index - 1]}`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-sm text-ink-muted">
          Step {index} of {total} · <span className="font-semibold text-ink">{labels[index - 1]}</span>
        </p>
        {next && <p className="shrink-0 text-sm text-ink-muted">Next: {next}</p>}
      </div>
      <div className="mt-2 flex gap-1" aria-hidden>
        {labels.map((label, i) => (
          <span key={label} className={`h-1 flex-1 rounded-full ${i < index ? 'bg-ink' : 'bg-line-strong/60'}`} />
        ))}
      </div>
    </div>
  );
}
