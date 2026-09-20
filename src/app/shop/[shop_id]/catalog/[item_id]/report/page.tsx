'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Copyright, ShieldAlert, Scale, MoreHorizontal, CheckCircle2 } from 'lucide-react';
import api from '@/lib/axios';

type Reason = 'copyright' | 'offensive' | 'illegal' | 'other';

const REASONS: { value: Reason; label: string; Icon: typeof Copyright }[] = [
  { value: 'copyright', label: 'Copyright', Icon: Copyright },
  { value: 'offensive', label: 'Offensive', Icon: ShieldAlert },
  { value: 'illegal', label: 'Illegal', Icon: Scale },
  { value: 'other', label: 'Others', Icon: MoreHorizontal },
];

const REASON_LABEL: Record<Reason, string> = {
  copyright: 'Copyright', offensive: 'Offensive', illegal: 'Illegal', other: 'Others',
};

// Two-step flow inside one page/route: "next page" in the main panel, not a
// new URL — back on step 2 returns to reason selection (step 1) before it
// ever leaves this route, back on step 1 is a real back to the product.
export default function ReportProductPage({ params }: Readonly<{ params: Promise<{ shop_id: string; item_id: string }> }>) {
  const { shop_id: shopId, item_id: itemId } = use(params);
  const router = useRouter();
  const [reason, setReason] = useState<Reason | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const step: 'reason' | 'description' = reason ? 'description' : 'reason';

  const handleBack = () => {
    if (step === 'description' && !submitted) {
      setReason(null);
      return;
    }
    router.back();
  };

  const handleSubmit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/shops/${shopId}/catalog/${itemId}/report`, {
        reason,
        description: description.trim() || undefined,
      });
      setSubmitted(true);
    } catch {
      setError('Something went wrong sending your report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-canvas">
      <div className="sticky top-0 z-50 bg-surface border-b border-line px-4 h-10 flex items-center justify-center relative">
        <button type="button" onClick={handleBack} aria-label="Back" className="absolute left-4 p-1 text-ink-muted">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-sm font-bold text-ink">Report this product</h1>
      </div>

      {submitted ? (
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-sage/10 flex items-center justify-center mb-4">
            <CheckCircle2 size={26} className="text-sage" />
          </div>
          <p className="text-sm font-bold text-ink mb-1.5">Report submitted</p>
          <p className="text-xs text-ink-muted leading-relaxed max-w-[260px] mb-6">
            Thanks — we&apos;ve received your report and will look into it. You can follow up anytime from My Support Tickets.
          </p>
          <button
            type="button"
            onClick={() => router.push(`/shop/${shopId}/catalog/${itemId}`)}
            className="px-5 py-2.5 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Back to Catalog
          </button>
        </main>
      ) : step === 'reason' ? (
        <main className="flex-1 px-[10px] py-[14px]">
          <h2 className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-2 px-0.5">Select Reason</h2>
          <div className="bg-surface border border-line rounded-2xl overflow-hidden divide-y divide-line">
            {REASONS.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setReason(value)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-canvas transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-sunken flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-taupe" />
                </div>
                <p className="flex-1 text-sm font-semibold text-ink">{label}</p>
                <ChevronRight size={16} className="text-ink-faint shrink-0" />
              </button>
            ))}
          </div>
        </main>
      ) : (
        <main className="flex-1 flex flex-col px-[10px] py-[14px]">
          <div className="flex items-center gap-2 bg-sunken rounded-lg px-3.5 py-2.5 mb-4">
            <span className="text-xs font-semibold text-ink-muted">Reason:</span>
            <span className="text-xs font-bold text-ink">{reason ? REASON_LABEL[reason] : ''}</span>
          </div>

          <label htmlFor="report-description" className="text-sm font-semibold text-ink mb-2">
            Report Description
          </label>
          <textarea
            id="report-description"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            maxLength={500}
            rows={7}
            placeholder="Tell us more about this issue (optional)…"
            className="w-full resize-none px-3.5 py-3 rounded-xl bg-surface border border-line text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors placeholder:text-ink-faint"
          />
          <p className="text-[11px] text-ink-faint text-right mt-1.5">{description.length}/500</p>

          {error && <p className="text-xs text-danger mt-2">{error}</p>}

          <div className="flex-1" />

          <div className="mt-6 mb-[10px]">
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-taupe hover:bg-taupe-hover disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {submitting ? 'Submitting…' : 'Report'}
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
