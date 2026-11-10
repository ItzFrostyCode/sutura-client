'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useWizardGate } from './useWizardGate';
import { SERVICE_STEPS } from '@/components/services/detail/serviceSteps';

// Only ever return to a dashboard page — never an arbitrary URL.
const safeReturn = (v: string | null) => (v?.startsWith('/dashboard/') && !v.startsWith('//') ? v : null);

/**
 * Create New: just the name. It saves a Draft (Services decision S2) and opens the service page in guided mode, where
 * the shop fills in the same sections the customer will see, one after another, in the customer's reading order.
 */
function NewService() {
  const allowed = useWizardGate();
  const router = useRouter();
  const toast = useToast();
  const { store } = useAuthStore();
  const returnTo = safeReturn(useSearchParams().get('return'));
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  if (!allowed) return null;

  const start = async (e: FormEvent) => {
    e.preventDefault();
    if (!store?.id || !name.trim()) return;
    setSaving(true);
    try {
      const res = await api.post(`/stores/${store.id}/services`, { name: name.trim(), status: 'draft' });
      router.replace(`/dashboard/services/${res.data.data.id}?guide=1${returnTo ? `&return=${encodeURIComponent(returnTo)}` : ''}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not start this service.'));
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[599px] min-[600px]:max-w-[680px] mx-auto max-[599px]:pb-24 pb-4">
      <form onSubmit={start} className="pt-2 pb-6 space-y-5 px-4 min-[375px]:px-6 min-[600px]:px-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">New service</p>
        <div>
          <h1 className="text-[28px] min-[600px]:text-[32px] leading-[1.2] font-bold text-ink">What is the service called?</h1>
          <p className="text-base text-ink-body mt-2 leading-relaxed">
            Next you fill in your service page section by section, in the same order customers read it. It stays a draft until you publish.
          </p>
        </div>
        <label className="block">
          <span className="block text-sm font-medium text-ink mb-1.5">Service name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={191} placeholder="e.g. Barong Tagalog Tailoring"
            className="w-full h-12 border border-line bg-white px-4 text-base text-ink focus:border-taupe focus:outline-none" />
        </label>
        <ol className="border border-line bg-white divide-y divide-line">
          {SERVICE_STEPS.map((s, i) => (
            <li key={s.section} className="flex items-center gap-3 px-4 min-h-12 text-sm">
              <span className="w-6 h-6 rounded-full bg-sunken text-ink-muted text-[11px] font-semibold flex items-center justify-center shrink-0">{i + 1}</span>
              <span className="text-ink">{s.title}</span>
              <span className="ml-auto text-[12px] text-ink-muted">{s.where === 'booking' ? 'when they book' : 'service page'}{s.optional ? ' · optional' : ''}</span>
            </li>
          ))}
        </ol>
        <div className="flex gap-3">
          <button type="button" onClick={() => router.push(returnTo ?? '/dashboard/services')} className="min-h-[52px] flex-1 border border-line text-base font-medium text-ink hover:bg-sunken cursor-pointer">Cancel</button>
          <button type="submit" disabled={saving || !name.trim()} className="min-h-[52px] flex-[2] bg-espresso text-white text-base font-semibold hover:bg-espresso/90 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
            {saving && <Loader2 size={18} className="animate-spin" />} Start
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewServicePage() {
  return <Suspense><NewService /></Suspense>;
}
