/**
 * Loading shapes that match the real Appointments screens one to one (same paddings, columns and cards), so nothing
 * jumps when the data arrives. They only show on the very first load: after that the page keeps what it has and
 * refreshes quietly (see useAppointments).
 */
const BAR = 'rounded bg-line/80';
const SOFT = 'rounded bg-sunken';

export function TableRowsSkeleton({ rows = 8 }: Readonly<{ rows?: number }>) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-3 py-4 xl:px-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-full bg-sunken" />
              <div className="min-w-0 flex-1 space-y-1.5"><div className={`${BAR} h-2.5 w-16`} /><div className={`${BAR} h-3.5 w-32`} /><div className={`${SOFT} h-2.5 w-40`} /></div>
            </div>
          </td>
          <td className="px-3 py-4 xl:px-5"><div className="space-y-1.5"><div className="h-5 w-24 rounded bg-sunken" /><div className={`${SOFT} h-2.5 w-32`} /></div></td>
          <td className="px-3 py-4 xl:px-5"><div className="space-y-1.5"><div className={`${BAR} h-3 w-28`} /><div className={`${SOFT} h-2.5 w-20`} /></div></td>
          <td className="px-3 py-4 xl:px-5"><div className={`${SOFT} h-3 w-20`} /></td>
          <td className="px-3 py-4 xl:px-5"><div className="h-6 w-20 rounded-full bg-sunken" /></td>
          <td className="px-3 py-4 xl:px-5"><div className="ml-auto flex justify-end gap-1.5"><div className="h-8 w-16 rounded-lg bg-sunken" /><div className="h-8 w-14 rounded-lg bg-line/70" /></div></td>
        </tr>
      ))}
    </>
  );
}

/** The appointment card (phone list, cards view, calendar day). */
export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-sunken" />
          <div className="space-y-1.5"><div className={`${BAR} h-3.5 w-32`} /><div className={`${SOFT} h-2.5 w-40`} /></div>
        </div>
        <div className="h-6 w-20 shrink-0 rounded-full bg-sunken" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3">
        <div className="space-y-1.5"><div className={`${SOFT} h-2 w-12`} /><div className="h-5 w-24 rounded bg-sunken" /></div>
        <div className="space-y-1.5"><div className={`${SOFT} h-2 w-14`} /><div className={`${BAR} h-3 w-28`} /><div className={`${SOFT} h-2.5 w-16`} /></div>
      </div>
      <div className="mt-3 space-y-3 border-t border-line pt-3">
        <div className={`${SOFT} h-2.5 w-24`} />
        <div className="flex gap-1.5"><div className="h-10 flex-1 rounded-lg bg-line/70" /><div className="h-10 flex-1 rounded-lg bg-sunken" /></div>
      </div>
    </div>
  );
}

export function CardsSkeleton({ count = 6, grid = false }: Readonly<{ count?: number; grid?: boolean }>) {
  return (
    <div className={grid ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}

/** The calendar: the compact month and a day card on a phone, the month board from 768px. */
export function CalendarSkeleton() {
  return (
    <>
      <div className="space-y-4 md:hidden">
        <div className="animate-pulse rounded-xl border border-line bg-white p-4">
          <div className="flex items-center justify-between border-b border-line pb-3"><div className={`${BAR} h-4 w-32`} /><div className="h-10 w-20 rounded-lg bg-sunken" /></div>
          <div className="mt-3 grid grid-cols-7 gap-y-2">
            {Array.from({ length: 35 }).map((_, i) => <div key={i} className="mx-auto h-7 w-7 rounded-full bg-sunken" />)}
          </div>
        </div>
        <CardSkeleton />
      </div>
      <div className="hidden animate-pulse rounded-2xl border border-line bg-white p-5 md:block">
        <div className="flex items-center justify-between border-b border-line pb-3"><div className={`${BAR} h-5 w-40`} /><div className="h-10 w-20 rounded-lg bg-sunken" /></div>
        <div className="mt-4 overflow-hidden rounded-xl border border-line">
          <div className="h-9 border-b border-line bg-sunken/50" />
          <div className="grid grid-cols-7 divide-x divide-y divide-line/70">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="min-h-[104px] space-y-2 p-2">
                <div className={`${SOFT} h-3 w-4`} />
                {i % 5 === 2 && <div className="h-4 w-full rounded bg-sunken" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
