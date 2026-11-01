export interface FeatureRow { readonly title: string; readonly body: string }

/** Hairline-separated rows with a small dot: the page's one list style. */
export default function FeatureRows({ rows, columns = false }: { readonly rows: readonly FeatureRow[]; readonly columns?: boolean }) {
  return (
    <ul className={columns ? 'grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3' : ''}>
      {rows.map((r) => (
        <li key={r.title} className="flex gap-3 border-t border-line py-4">
          <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
          <div className="min-w-0">
            <p className="text-base font-semibold text-ink">{r.title}</p>
            <p className="mobile-body-sm mt-1 text-ink-muted">{r.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
