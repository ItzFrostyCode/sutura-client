import { ImagePlus, X, Loader2 } from 'lucide-react';
import type { useOrderRequest } from './useOrderRequest';

const field = 'mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 text-base text-ink focus:border-taupe focus:outline-none';

/** The request form: what you want made, how many, your own fabric, and photos. Nothing is paid here. */
export default function OrderRequestForm({ form }: Readonly<{ form: ReturnType<typeof useOrderRequest> }>) {
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="req-service" className="mobile-body-md font-semibold text-ink">Which service?</label>
        <select id="req-service" value={form.serviceId} onChange={(e) => form.setServiceId(e.target.value)} className={`${field} h-[52px]`}>
          <option value="">Choose one</option>
          {form.services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="req-what" className="mobile-body-md font-semibold text-ink">What do you want made?</label>
        <textarea id="req-what" value={form.description} onChange={(e) => form.setDescription(e.target.value)} rows={4} maxLength={1000} placeholder="Example: A barong for my wedding in December, white, long sleeves." className={`${field} resize-none py-3`} />
      </div>

      <div className="flex items-end gap-4">
        <div className="w-28">
          <label htmlFor="req-qty" className="mobile-body-md font-semibold text-ink">How many?</label>
          <input id="req-qty" type="number" min={1} max={50} value={form.quantity} onChange={(e) => form.setQuantity(Math.max(1, Number(e.target.value) || 1))} className={`${field} h-[52px]`} />
        </div>
        <label className="flex min-h-[52px] flex-1 cursor-pointer items-center gap-3">
          <input type="checkbox" checked={form.ownFabric} onChange={(e) => form.setOwnFabric(e.target.checked)} className="h-5 w-5 accent-taupe" />
          <span className="mobile-body-sm font-normal text-ink">I will bring my own fabric</span>
        </label>
      </div>

      <div>
        <label htmlFor="req-measure" className="mobile-body-md font-semibold text-ink">Your measurements <span className="font-normal text-ink-muted">(optional)</span></label>
        <textarea id="req-measure" value={form.measurements} onChange={(e) => form.setMeasurements(e.target.value)} rows={2} maxLength={1000} placeholder="If you have them. The shop can also measure you." className={`${field} resize-none py-3`} />
      </div>

      <div>
        <p className="mobile-body-md font-semibold text-ink">Photos <span className="font-normal text-ink-muted">(optional, up to 5)</span></p>
        <div className="mt-2 flex flex-wrap gap-2">
          {form.images.map((url) => (
            <div key={url} className="relative h-20 w-20 overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Reference" className="h-full w-full object-cover" />
              <button type="button" aria-label="Remove photo" onClick={() => form.setImages((prev) => prev.filter((u) => u !== url))} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"><X size={12} /></button>
            </div>
          ))}
          {form.images.length < 5 && (
            <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-line-strong text-ink-faint">
              {form.uploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={22} />}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void form.upload(f); e.target.value = ''; }} />
            </label>
          )}
        </div>
      </div>

      {form.error && <p role="alert" className="mobile-body-sm font-normal text-danger">{form.error}</p>}

      <button type="button" disabled={!form.canSend} onClick={form.send} className="h-[52px] w-full rounded-full bg-ink text-base font-semibold text-white disabled:opacity-50">
        {form.submitting ? 'Sending…' : 'Send request'}
      </button>
      <p className="mobile-caption text-center text-ink-muted">You do not pay anything now. The shop will send you a price to approve.</p>
    </div>
  );
}
