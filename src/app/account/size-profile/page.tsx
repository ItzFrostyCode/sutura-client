'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/lib/axios';
import AccountHeader from '@/components/account/AccountHeader';

interface OtherMetrics {
  shoulder: string;
  bust: string;
  under_bust: string;
  waist: string;
  hip: string;
  thigh: string;
  ball_girth: string;
  foot_length: string;
}

const EMPTY_METRICS: OtherMetrics = {
  shoulder: '', bust: '', under_bust: '', waist: '', hip: '', thigh: '', ball_girth: '', foot_length: '',
};

const METRIC_FIELDS: { key: keyof OtherMetrics; label: string; hint: string }[] = [
  { key: 'shoulder', label: 'Shoulder', hint: 'From one shoulder to the other' },
  { key: 'bust', label: 'Bust', hint: 'Widest part of chest/bust' },
  { key: 'under_bust', label: 'Under Bust', hint: 'Under bust or chest area' },
  { key: 'waist', label: 'Waist', hint: 'Smallest part of the torso' },
  { key: 'hip', label: 'Hip', hint: 'Widest part of hips' },
  { key: 'thigh', label: 'Thigh', hint: 'Circumference of thigh' },
  { key: 'ball_girth', label: 'Ball Girth', hint: "Foot's widest circumference" },
  { key: 'foot_length', label: 'Foot Length', hint: 'Heel to longest toe' },
];

export default function SizeProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [metrics, setMetrics] = useState<OtherMetrics>(EMPTY_METRICS);
  const [showOther, setShowOther] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.get('/my-size-profile')
      .then(res => {
        const data = res.data.data;
        if (data) {
          setHeightCm(data.height_cm != null ? String(data.height_cm) : '');
          setWeightKg(data.weight_kg != null ? String(data.weight_kg) : '');
          setMetrics({ ...EMPTY_METRICS, ...(data.metrics ?? {}) });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // The button reverts to its normal "Save" state on its own after a beat —
  // a success confirmation that never goes away just reads as broken.
  useEffect(() => {
    if (saveMessage?.type !== 'success') return;
    const t = setTimeout(() => setSaveMessage(null), 2000);
    return () => clearTimeout(t);
  }, [saveMessage]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      // Only send metric keys that actually have a value — an empty string
      // isn't a real measurement, and the backend validates numeric|nullable.
      const cleanedMetrics = Object.fromEntries(
        Object.entries(metrics).filter(([, v]) => v.trim() !== '')
      );
      const res = await api.put('/my-size-profile', {
        height_cm: heightCm.trim() ? Number(heightCm) : null,
        weight_kg: weightKg.trim() ? Number(weightKg) : null,
        metrics: Object.keys(cleanedMetrics).length ? cleanedMetrics : null,
      });
      // Reflect back exactly what the server actually stored — if it
      // silently dropped/rejected something, this is what would expose it,
      // instead of just trusting the values already sitting in the form.
      const saved = res.data.data;
      setHeightCm(saved?.height_cm != null ? String(saved.height_cm) : '');
      setWeightKg(saved?.weight_kg != null ? String(saved.weight_kg) : '');
      setMetrics({ ...EMPTY_METRICS, ...(saved?.metrics ?? {}) });
      setSaveMessage({ type: 'success', text: 'Saved!' });
    } catch (err) {
      console.error(err);
      setSaveMessage({ type: 'error', text: 'Failed to save your size profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Height/Weight were never actually required by the recommendation
  // matching logic (it only ever compares against whatever body metric a
  // size chart's own columns happen to name) — gating the whole Save on
  // BOTH being filled silently blocked saving Other Measurements alone,
  // which is exactly the bug this replaces. Any single filled-in value is
  // enough to save.
  const canSave = heightCm.trim() !== '' || weightKg.trim() !== '' || Object.values(metrics).some(v => v.trim() !== '');

  if (loading) {
    return (
      <div>
        <AccountHeader title="Size Profile" backHref="/account" />
        <div className="text-center py-16 text-sm text-ink-muted">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full">
      <AccountHeader title="Size Profile" backHref="/account" />

      <div className="space-y-3 pb-8 flex-1">
        <div className="bg-surface border border-line rounded-2xl p-4">
          <h3 className="text-sm font-bold text-ink mb-3">Base Measurements</h3>
          <div className="grid grid-cols-2 gap-[5px]">
            <div>
              <label htmlFor="height-cm" className="text-xs font-medium text-ink-body block mb-1">Model Height</label>
              <div className="relative">
                <input
                  id="height-cm"
                  type="number"
                  inputMode="decimal"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="–"
                  className="w-full bg-canvas border border-line rounded-lg pl-3 pr-9 py-2 text-sm text-ink focus:outline-none focus:border-taupe"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint">cm</span>
              </div>
            </div>
            <div>
              <label htmlFor="weight-kg" className="text-xs font-medium text-ink-body block mb-1">Model Weight</label>
              <div className="relative">
                <input
                  id="weight-kg"
                  type="number"
                  inputMode="decimal"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="–"
                  className="w-full bg-canvas border border-line rounded-lg pl-3 pr-9 py-2 text-sm text-ink focus:outline-none focus:border-taupe"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint">kg</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-line rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowOther(v => !v)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <h3 className="text-sm font-bold text-ink">Other Measurements</h3>
            {showOther ? <ChevronUp size={16} className="text-ink-faint" /> : <ChevronDown size={16} className="text-ink-faint" />}
          </button>
          {showOther && (
            <div className="px-4 pb-4 pt-1 border-t border-line space-y-3">
              {METRIC_FIELDS.map(f => (
                <div key={f.key}>
                  <label htmlFor={`metric-${f.key}`} className="text-xs font-medium text-ink-body block mb-1">{f.label}</label>
                  <div className="relative">
                    <input
                      id={`metric-${f.key}`}
                      type="number"
                      inputMode="decimal"
                      value={metrics[f.key]}
                      onChange={(e) => setMetrics(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder="–"
                      className="w-full bg-canvas border border-line rounded-lg pl-3 pr-9 py-2 text-sm text-ink focus:outline-none focus:border-taupe"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint">cm</span>
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-line">
                <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">How to measure your body</h4>
                <div className="relative w-full max-w-[220px] mx-auto aspect-[280/610]">
                  <Image src="/measurement-guide.png" alt="Body measurement guide" fill unoptimized className="object-contain" />
                </div>
                <div className="space-y-1.5 mt-3">
                  {METRIC_FIELDS.map(f => (
                    <p key={f.key} className="text-xs text-ink-body">
                      <span className="font-semibold text-ink">{f.label}:</span> {f.hint}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className="sticky bottom-0 -mx-[10px] -mb-[10px] z-40 bg-surface border-t border-line p-3 mt-auto shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-md mx-auto">
          {saveMessage?.type === 'error' && (
            <p className="text-xs text-danger text-center mb-2">{saveMessage.text}</p>
          )}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!canSave || saving}
            className={`w-full font-medium py-2.5 transition-colors flex items-center justify-center rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              saveMessage?.type === 'success' ? 'bg-sage text-white' : 'bg-ink hover:bg-taupe text-white'
            }`}
          >
            {saving ? 'Saving…' : saveMessage?.type === 'success' ? 'Saved ✓' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
