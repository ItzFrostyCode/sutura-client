/** Says why a button is still grey, right under it. Rendered only while the button is disabled. */
export default function DisabledHint({ id, children }: { readonly id: string; readonly children: React.ReactNode }) {
  return <p id={id} className="-mt-2 text-center text-xs text-ink-muted">{children}</p>;
}
