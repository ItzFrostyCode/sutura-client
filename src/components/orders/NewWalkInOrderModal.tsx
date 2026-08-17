'use client';

import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Loader2, User, CreditCard, MapPin, Upload } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useBranch } from '@/context/BranchContext';

interface NewWalkInOrderModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCreated: () => void;
}

interface CustomerOption { id: number; name: string; }
interface CatalogItemOption { id: number; name: string; price: string | number; sizes?: string[] | null; }
interface BranchOption { id: number; name: string; }

export default function NewWalkInOrderModal({ isOpen, onClose, onCreated }: NewWalkInOrderModalProps) {
  const { shop } = useAuthStore();
  const { selectedBranchId } = useBranch();
  const toast = useToast();

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [items, setItems] = useState<CatalogItemOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [catalogItemId, setCatalogItemId] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [branchId, setBranchId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash' | 'bank_transfer'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  useEffect(() => {
    if (!shop || !isOpen) return;
    const load = async () => {
      setLoading(true);
      try {
        const [rc, ri, rb] = await Promise.all([
          api.get(`/shops/${shop.id}/customers`),
          api.get(`/shops/${shop.id}/catalog`),
          api.get(`/shops/${shop.id}/branches`),
        ]);
        setCustomers(rc.data.data || []);
        setItems((ri.data.data || []).filter((i: { is_active?: boolean }) => i.is_active !== false));
        setBranches(rb.data.data || []);
      } finally {
        setLoading(false);
      }
    };
    void load();
    // Default to whichever branch is selected in the header — same pattern
    // as AppointmentCreateModal — so the owner doesn't have to re-pick a
    // branch they'd already chosen just to open this modal.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBranchId(selectedBranchId !== null ? String(selectedBranchId) : '');
  }, [shop, isOpen, selectedBranchId]);

  useEffect(() => {
    const applyItemPrice = () => {
      const item = items.find(i => i.id.toString() === catalogItemId);
      setTotalAmount(item ? String(Number(item.price)) : '');
      setSelectedSize('');
    };
    applyItemPrice();
  }, [catalogItemId, items]);

  useEffect(() => {
    const resetForm = () => {
      setCustomerId(''); setCatalogItemId(''); setSelectedSize(''); setTotalAmount(''); setPaymentStatus('pending'); setBranchId('');
      setPaymentMethod('cash'); setPaymentReference(''); setReceiptUrl('');
    };
    if (!isOpen) resetForm();
  }, [isOpen]);

  const selectedItem = items.find(i => i.id.toString() === catalogItemId);

  const handleReceiptUpload = async (file: File | undefined) => {
    if (!file || !shop) return;
    setUploadingReceipt(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`/shops/${shop.id}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReceiptUrl(res.data?.data?.url || res.data?.url || '');
    } catch {
      toast.error('Failed to upload receipt screenshot.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !catalogItemId || !totalAmount) return;
    setSaving(true);
    try {
      const res = await api.post(`/shops/${shop.id}/catalog-orders`, {
        catalog_item_id: Number(catalogItemId),
        shop_branch_id: branchId || null,
        customer_id: customerId || null,
        selected_size: selectedSize || null,
        total_amount: Number.parseFloat(totalAmount),
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        payment_reference: paymentMethod === 'cash' ? null : (paymentReference.trim() || null),
        payment_receipt_path: paymentMethod === 'cash' ? null : (receiptUrl || null),
      });
      toast.success('Walk-in order created.');
      // Same reused-screenshot flag as the Job Order payment form — doesn't
      // block creation, just prompts a second look.
      if (res.data?.warning) {
        toast.info(res.data.warning);
      }
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
      <div className="absolute inset-0 bg-[#2D2A26]/60" />

      <div className="relative bg-white rounded-2xl w-full max-w-md border border-line overflow-hidden">
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
          <div className="py-16 flex items-center justify-center text-ink-faint">
            <Loader2 size={24} className="animate-spin mr-2" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                <ShoppingBag size={11} /> Catalog Item <span className="text-danger">*</span>
              </label>
              <select
                required
                value={catalogItemId}
                onChange={e => setCatalogItemId(e.target.value)}
                className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:border-taupe"
              >
                <option value="">Select item...</option>
                {items.map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>

            {selectedItem?.sizes && selectedItem.sizes.length > 0 && (
              <div>
                <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">Size</label>
                <select
                  value={selectedSize}
                  onChange={e => setSelectedSize(e.target.value)}
                  className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:border-taupe"
                >
                  <option value="">— Not applicable —</option>
                  {selectedItem.sizes.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {branches.length > 1 && (
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                  <MapPin size={11} /> Branch <span className="font-normal normal-case text-ink-faint">(optional)</span>
                </label>
                <select
                  value={branchId}
                  onChange={e => setBranchId(e.target.value)}
                  className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:border-taupe"
                >
                  <option value="">Not specified</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                <User size={11} /> Customer <span className="font-normal normal-case text-ink-faint">(optional)</span>
              </label>
              <select
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:border-taupe"
              >
                <option value="">Guest / walk-in</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                  <CreditCard size={11} /> Total (₱) <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint text-sm">₱</span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={totalAmount}
                    onChange={e => setTotalAmount(e.target.value)}
                    className="w-full bg-canvas border border-line rounded-xl pl-7 pr-3 py-2.5 text-sm text-ink focus:outline-none focus:border-taupe [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <p className="text-[10px] text-ink-faint mt-1">Adjust for bulk vs. single-piece pricing.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">Payment</label>
                <select
                  value={paymentStatus}
                  onChange={e => setPaymentStatus(e.target.value as 'pending' | 'paid')}
                  className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:border-taupe"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                <CreditCard size={11} /> Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as 'cash' | 'gcash' | 'bank_transfer')}
                className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:border-taupe"
              >
                <option value="cash">Cash</option>
                <option value="gcash">GCash</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            {/* GCash/Bank reference + receipt screenshot — this is exactly
                what the Payments page's "Receipts to Verify" queue expects
                (usePayments.ts checks payment_method !== 'cash') to surface
                this order for verification at all. */}
            {paymentMethod !== 'cash' && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={paymentReference}
                  onChange={e => setPaymentReference(e.target.value)}
                  placeholder={paymentMethod === 'gcash' ? 'GCash Reference # (e.g. 9876543210)' : 'Bank Transfer Reference #'}
                  className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2.5 text-xs text-ink focus:outline-none focus:border-taupe"
                />
                {receiptUrl ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={receiptUrl} alt="Receipt screenshot" className="h-16 w-16 object-cover rounded-lg border border-line" />
                    <button
                      type="button"
                      onClick={() => setReceiptUrl('')}
                      className="absolute -top-2 -right-2 bg-surface border border-line text-ink-muted hover:text-danger rounded-full p-1"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-xs font-semibold text-taupe hover:text-[#8A7063] bg-canvas hover:bg-sunken border border-line px-3 py-1.5 rounded-lg transition-colors">
                    {uploadingReceipt ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    <span>{uploadingReceipt ? 'Uploading...' : 'Attach receipt screenshot'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingReceipt}
                      onChange={e => handleReceiptUpload(e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>
            )}

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
