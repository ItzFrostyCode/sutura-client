import { Plus } from 'lucide-react';
import ShopsContainer from './ShopsContainer';
import SectionHead from './SectionHead';
import { FAQS } from './faqData';

/** Native <details>: keyboard and screen-reader friendly with no state to manage. */
export default function ShopsFaq() {
  return (
    <section id="faq" aria-labelledby="shops-faq-title" className="scroll-mt-16 bg-sunken py-12 sm:py-16 lg:py-20">
      <ShopsContainer className="grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
        <SectionHead id="shops-faq-title" overline="FAQ" title="Good to know before you start." />
        <div className="border-b border-line-strong">
          {FAQS.map((f) => (
            <details key={f.q} className="group border-t border-line-strong">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <Plus size={20} className="shrink-0 text-ink-muted transition-transform group-open:rotate-45" />
              </summary>
              <p className="mobile-body-md max-w-2xl pb-4 text-ink-body">{f.a}</p>
            </details>
          ))}
        </div>
      </ShopsContainer>
    </section>
  );
}
