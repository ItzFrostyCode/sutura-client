'use client';

import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Loader2, User, CreditCard } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';

interface NewWalkInOrderModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCreated: () => void;
}

interface CustomerOption { id: number; name: string; }
interface CatalogItemOption { id: number; name: string; price: string | number; sizes?: string[] | null; }

export default function NewWalkInOrderModal({ isOpen, onClose, onCreated }: NewWalkInOrderModalProps) {
  const { shop } = useAuthStore();
  const toast = useToast();

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [items, setItems] = useState<CatalogItemOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [catalogItemId, setCatalogItemId] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');

  useEffect(() => {
    if (!shop || !isOpen) return;
    setLoading(true);
    Promise.all([
      api.get(`/shops/${shop.id}/customers`),
      api.get(`/shops/${shop.id}/catalog`),
    ]).then(([rc, ri]) => {
      setCustomers(rc.data.data || []);
      setItems((ri.data.data || []).filter((i: { is_active?: boolean }) => i.is_active !== false));
    }).finally(() => setLoading(false));
  }, [shop, isOpen]);

  useEffect(() => {
    const item = items.find(i => i.id.toString() === catalogItemId);
    setTotalAmount(item ? String(Number(item.price)) : '');
    setSelectedSize('');
  }, [catalogItemId, items]);

  useEffect(() => {
    if (!isOpen) {
      setCustomerId(''); setCatalogItemId(''); setSelectedSize(''); setTotalAmount(''); setPaymentStatus('pending');
    }
  }, [isOpen]);

  const selectedItem = items.find(i => i.id.toString() === catalogItemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !catalogItemId || !totalAmount) return;
    setSaving(true);
    try {
      await api.post(`/shops/${shop.id}/catalog-orders`, {
        catalog_item_id: Number(catalogItemId),
        customer_id: customerId || null,
        selected_size: selectedSize || null,
        total_amount: Number.parseFloat(totalAmount),
        payment_status: paymentStatus,
      });
      toast.success('Walk-in order created.');
      onCreated();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create order.');
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
        <div className="bg-gradient-to-r from-[#9A8073] to-[#7A6560] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <ShoppingBag size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">New Walk-in Order</h2>
              <p className="text-white/70 text-[10px]">Log an in-store catalog sale</p>
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
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#827A73] uppercase tracking-wider mb-1.5">
                <ShoppingBag size={11} /> Catalog Item <span className="text-[#B26959]">*</span>
              </label>
              <select
                required
                value={catalogItemId}
                onChange={e => setCatalogItemId(e.target.value)}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl px-3.5 py-2.5 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
              >
                <option value="">Select item...</option>
                {items.map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>

            {selectedItem?.sizes && selectedItem.sizes.length > 0 && (
              <div>
                <label className="block text-[10px] font-bold text-[#827A73] uppercase tracking-wider mb-1.5">Size</label>
                <select
                  value={selectedSize}
                  onChange={e => setSelectedSize(e.target.value)}
                  className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl px-3.5 py-2.5 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
                >
                  <option value="">— Not applicable —</option>
                  {selectedItem.sizes.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#827A73] uppercase tracking-wider mb-1.5">
                <User size={11} /> Customer <span className="font-normal normal-case text-[#A8A19A]">(optional)</span>
              </label>
              <select
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl px-3.5 py-2.5 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
              >
                <option value="">Guest / walk-in</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

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
                    value={totalAmount}
                    onChange={e => setTotalAmount(e.target.value)}
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl pl-7 pr-3 py-2.5 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <p className="text-[10px] text-[#A8A19A] mt-1">Adjust for bulk vs. single-piece pricing.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#827A73] uppercase tracking-wider mb-1.5">Payment</label>
                <select
                  value={paymentStatus}
                  onChange={e => setPaymentStatus(e.target.value as 'pending' | 'paid')}
                  className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl px-3.5 py-2.5 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !catalogItemId || !totalAmount}
              className="w-full bg-taupe hover:bg-taupe/90 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <ShoppingBag size={16} />}
              {saving ? 'Creating...' : 'Create Order'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
