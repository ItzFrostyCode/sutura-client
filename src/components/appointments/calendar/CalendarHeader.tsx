import { ChevronLeft, ChevronRight } from 'lucide-react';

/** The month name with a Today chip on the left and the two arrows on the right. */
export default function CalendarHeader({ title, onToday, onPrev, onNext, prevLabel, nextLabel }: Readonly<{ title: string; onToday: () => void; onPrev: () => void; onNext: () => void; prevLabel: string; nextLabel: string }>) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
      <div className="flex min-w-0 items-center gap-3">
        <h2 className="truncate text-base font-semibold tracking-tight text-ink sm:text-xl">{title}</h2>
        <button type="button" onClick={onToday} className="shrink-0 cursor-pointer rounded-full bg-sunken px-3 py-1 text-xs font-medium text-ink-body hover:bg-line sm:rounded-md sm:border sm:border-line">Today</button>
      </div>
      <div className="flex shrink-0 items-center rounded-lg border border-line">
        <button type="button" onClick={onPrev} aria-label={prevLabel} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-l-lg text-ink-muted hover:bg-sunken hover:text-ink"><ChevronLeft size={17} /></button>
        <span className="h-4 w-px bg-line" />
        <button type="button" onClick={onNext} aria-label={nextLabel} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-r-lg text-ink-muted hover:bg-sunken hover:text-ink"><ChevronRight size={17} /></button>
      </div>
    </div>
  );
}
