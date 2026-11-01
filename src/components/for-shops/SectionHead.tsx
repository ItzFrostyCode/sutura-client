/** Overline + H2 (+ optional lede) used at the top of each landing section. */
export default function SectionHead({ id, overline, title, lede }: { readonly id: string; readonly overline: string; readonly title: string; readonly lede?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="mobile-overline text-taupe">{overline}</p>
      <h2 id={id} className="mt-2 text-2xl font-semibold leading-tight text-ink sm:text-[32px]">{title}</h2>
      {lede && <p className="mobile-body-md mt-3 text-ink-body sm:text-lg">{lede}</p>}
    </div>
  );
}
