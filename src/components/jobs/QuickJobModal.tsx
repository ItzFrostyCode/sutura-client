'use client';

import React, { useState, useEffect } from 'react';
import { X, Zap, Loader2, User, Scissors, CalendarDays, CreditCard, Check, AlertTriangle } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

interface QuickJobModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCreated: () => void;
}

interface CustomerOption { id: number; name: string; phone?: string | null; }
interface ServiceOption  { id: number; name: string; base_price: string | number; }

const DP_PRESETS = [
  { label: '50%', pct: 0.5 },
  { label: '75%', pct: 0.75 },
  { label: 'Full', pct: 1 },
];

export default function QuickJobModal({ isOpen, onClose, onCreated }: QuickJobModalProps) {
  const { shop } = useAuthStore();
  const toast = useToast();
  const router = useRouter();

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [services,  setServices]  = useState<ServiceOption[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);

  const [customerId,  setCustomerId]  = useState('');
  const [serviceId,   setServiceId]   = useState('');
  const [total,       setTotal]       = useState('');
  const [dp,          setDp]          = useState('');
  const [dueDate,     setDueDate]     = useState('');

  useEffect(() => {
    if (!shop || !isOpen) return;
    const load = async () => {
      setLoading(true);
      try {
        const [rc, rs] = await Promise.all([
          api.get(`/shops/${shop.id}/customers`),
          api.get(`/shops/${shop.id}/services`),
        ]);
        setCustomers(rc.data.data || []);
        setServices(rs.data.data  || []);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [shop, isOpen]);

  useEffect(() => {
    const applyServicePrice = () => {
      const svc = services.find(s => s.id.toString() === serviceId);
      if (svc) setTotal(Number(svc.base_price) > 0 ? String(Number(svc.base_price)) : '');
    };
    applyServicePrice();
  }, [serviceId, services]);

  useEffect(() => {
    const resetForm = () => {
      setCustomerId(''); setServiceId(''); setTotal(''); setDp(''); setDueDate('');
    };
    if (!isOpen) resetForm();
  }, [isOpen]);

  const totalNum = parseFloat(total)  || 0;
  const dpNum    = parseFloat(dp)     || 0;
  const balance  = totalNum - dpNum;
  const dpPct    = totalNum > 0 ? (dpNum / totalNum) * 100 : 0;
  const meetsDP  = dpNum >= totalNum * 0.5;

  const handlePreset = (pct: number) => {
    if (totalNum > 0) setDp((totalNum * pct).toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !customerId || !serviceId) return;
    setSaving(true);
    try {
      const res = await api.post(`/shops/${shop.id}/jobs`, {
        intake_channel: 'walk_in',
        fulfillment_type: 'pickup',
        customer_id: customerId,
        service_id:  serviceId,
        total_amount: totalNum,
        downpayment:  dpNum,
        balance:      balance,
        due_date:     dueDate || null,
        notes: '',
      });
      const newJobId = res.data?.data?.id;
      toast.success('Job created! Opening details...');
      onCreated();
      onClose();
      if (newJobId) router.push(`/dashboard/jobs/${newJobId}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Failed to create job.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-[#2D2A26]/40 backdrop-blur-sm" />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#EBE6E0] overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#9A8073] to-[#7A6560] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Quick Walk-in Entry</h2>
              <p className="text-white/70 text-[10px]">Essentials only — add measurements, staff & the rest later from the job's page</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <X size={14} className="text-white" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center text-[#A8A19A]">
            <Loader2 size={24} className="animate-spin mr-2" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {/* Customer */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#827A73] uppercase tracking-wider mb-1.5">
                <User size={11} /> Customer <span className="text-[#B26959]">*</span>
              </label>
              <select
                required
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl px-3.5 py-2.5 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
              >
                <option value="">Select customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ''}</option>
                ))}
              </select>
            </div>

            {/* Service */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#827A73] uppercase tracking-wider mb-1.5">
                <Scissors size={11} /> Type of Service <span className="text-[#B26959]">*</span>
              </label>
              <select
                required
                value={serviceId}
                onChange={e => setServiceId(e.target.value)}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl px-3.5 py-2.5 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
              >
                <option value="">Select service...</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Total + DP */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#827A73] uppercase tracking-wider mb-1.5">
                  <CreditCard size={11} /> Total (₱) <span className="text-[#B26959]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A] text-sm">₱</span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={total}
                    onChange={e => setTotal(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#827A73] uppercase tracking-wider mb-1.5">
                  Downpayment (₱)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A] text-sm">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={dp}
                    onChange={e => setDp(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
                  />
                </div>
              </div>
            </div>

            {/* DP Preset Buttons */}
            {totalNum > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#A8A19A] font-semibold uppercase tracking-wider shrink-0">Quick DP:</span>
                {DP_PRESETS.map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handlePreset(p.pct)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#EBE6E0] bg-[#FAF6F3] text-[#827A73] hover:border-taupe hover:text-taupe transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Balance preview */}
            {totalNum > 0 && (
              <div className={`rounded-xl border px-4 py-3 flex items-center justify-between text-sm ${meetsDP ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                <div>
                  <p className={`font-semibold ${meetsDP ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {meetsDP ? (
                      <span className="flex items-center gap-1"><Check size={12} /> DP Requirement Met</span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <AlertTriangle size={12} /> 50% DP = ₱{(totalNum * 0.5).toFixed(2)} required
                      </span>
                    )}
                  </p>
                  <p className={`text-xs mt-0.5 ${meetsDP ? 'text-emerald-600' : 'text-amber-600'}`}>
                    DP: ₱{dpNum.toFixed(2)} ({dpPct.toFixed(0)}%) · Balance: ₱{balance.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* Due Date */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#827A73] uppercase tracking-wider mb-1.5">
                <CalendarDays size={11} /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl px-3.5 py-2.5 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2 border-t border-[#EBE6E0]">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-[#EBE6E0] text-sm font-semibold text-[#524A44] hover:bg-[#FAF6F3] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !customerId || !serviceId || !total}
                className="flex-1 py-2.5 rounded-xl bg-[#9A8073] hover:bg-[#7A6560] text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                Create Job
              </button>
            </div>

            <p className="text-center text-[10px] text-[#A8A19A]">
              Add measurements, custom specs & fulfillment after creation.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
