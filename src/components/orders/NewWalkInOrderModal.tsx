'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X, ShoppingBag, Loader2, User, CreditCard, MapPin, Upload,
  UserPlus, Banknote, Smartphone, Check, Ruler
} from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useBranch } from '@/context/BranchContext';
import { getMediaUrl } from '@/lib/media';
import SearchableCombobox, { ComboboxOption } from '@/components/shared/SearchableCombobox';
import QuickAddCustomerModal, { CreatedCustomer } from '@/components/customers/QuickAddCustomerModal';

interface NewWalkInOrderModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCreated: () => void;
}

interface CustomerOption {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
}

interface CatalogItemOption {
  id: number;
  name: string;
  price: string | number;
  category?: string | null;
  sizes?: string[] | null;
  images?: { id: number; image_url: string; is_primary?: boolean }[] | null;
}

const DEFAULT_GARMENT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Free Size'];

interface BranchOption {
  id: number;
  name: string;
}

export default function NewWalkInOrderModal({ isOpen, onClose, onCreated }: NewWalkInOrderModalProps) {
  const { store } = useAuthStore();
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
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [totalAmount, setTotalAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [branchId, setBranchId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash' | 'paymaya'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [quickAddCustomerOpen, setQuickAddCustomerOpen] = useState(false);

  useEffect(() => {
    if (!store || !isOpen) return;
    const load = async () => {
      setLoading(true);
      try {
        const [rc, ri, rb] = await Promise.all([
          api.get(`/stores/${store.id}/customers`),
          api.get(`/stores/${store.id}/catalog`),
          api.get(`/stores/${store.id}/branches`),
        ]);
        setCustomers(rc.data.data || []);
        setItems((ri.data.data || []).filter((i: { is_active?: boolean }) => i.is_active !== false));
        setBranches(rb.data.data || []);
      } finally {
        setLoading(false);
      }
    };
    void load();
    // Default to whichever branch is selected in the header — syncing from
    // that external selection, not a value this effect itself computes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBranchId(selectedBranchId !== null ? String(selectedBranchId) : '');
  }, [store, isOpen, selectedBranchId]);

  useEffect(() => {
    const applyItemPrice = () => {
      const item = items.find(i => String(i.id) === String(catalogItemId));
      setTotalAmount(item ? String(Number(item.price)) : '');
      setIsCustomSize(false);
      if (item?.sizes && Array.isArray(item.sizes) && item.sizes.length > 0) {
        setSelectedSize(item.sizes[0]);
      } else {
        setSelectedSize('M');
      }
    };
    if (catalogItemId) {
      applyItemPrice();
    }
  }, [catalogItemId, items]);

  useEffect(() => {
    const resetForm = () => {
      setCustomerId('');
      setCatalogItemId('');
      setSelectedSize('');
      setTotalAmount('');
      setPaymentStatus('pending');
      setBranchId('');
      setPaymentMethod('cash');
      setPaymentReference('');
      setReceiptUrl('');
    };
    if (!isOpen) resetForm();
  }, [isOpen]);

  const selectedItem = items.find(i => String(i.id) === String(catalogItemId));

  const availableSizes = useMemo(() => {
    if (selectedItem?.sizes && Array.isArray(selectedItem.sizes) && selectedItem.sizes.length > 0) {
      return selectedItem.sizes;
    }
    return DEFAULT_GARMENT_SIZES;
  }, [selectedItem]);

  // Transform Catalog Items into SearchableCombobox options with photo & price
  const catalogItemOptions: ComboboxOption[] = useMemo(() => {
    return items.map(item => {
      const primaryImg = item.images?.find(img => img.is_primary)?.image_url || item.images?.[0]?.image_url;
      const formattedPrice = item.price
        ? `₱${Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        : undefined;

      return {
        id: item.id,
        label: item.name,
        price: formattedPrice,
        sublabel: item.category ? item.category : undefined,
        badge: item.sizes && item.sizes.length > 0 ? `${item.sizes.length} sizes` : undefined,
        imageUrl: primaryImg ? getMediaUrl(primaryImg) : null,
        icon: ShoppingBag,
      };
    });
  }, [items]);

  // Transform Customers into SearchableCombobox options
  const customerOptions: ComboboxOption[] = useMemo(() => {
    return [
      {
        id: '',
        label: 'Guest / walk-in',
        sublabel: 'No customer profile linked',
        icon: User,
      },
      ...customers.map(c => ({
        id: c.id,
        label: c.name,
        sublabel: [c.phone, c.email].filter(Boolean).join(' • ') || 'Registered customer',
        icon: User,
      })),
    ];
  }, [customers]);

  // Transform Branches into SearchableCombobox options
  const branchOptions: ComboboxOption[] = useMemo(() => {
    return [
      { id: '', label: 'Not specified', icon: MapPin },
      ...branches.map(b => ({
        id: b.id,
        label: b.name,
        icon: MapPin,
      })),
    ];
  }, [branches]);

  const handleCustomerCreated = (newCustomer: CreatedCustomer) => {
    setCustomers(prev => [newCustomer, ...prev]);
    setCustomerId(String(newCustomer.id));
  };

  const handleReceiptUpload = async (file: File | undefined) => {
    if (!file || !store) return;
    setUploadingReceipt(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`/stores/${store.id}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReceiptUrl(res.data?.data?.url || res.data?.url || '');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to upload receipt screenshot.'));
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !catalogItemId || !totalAmount) return;
    setSaving(true);
    try {
      const res = await api.post(`/stores/${store.id}/catalog-orders`, {
        catalog_item_id: Number(catalogItemId),
        store_branch_id: branchId || null,
        customer_id: customerId || null,
        selected_size: selectedSize || null,
        total_amount: Number.parseFloat(totalAmount),
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        payment_reference: paymentMethod === 'cash' ? null : (paymentReference.trim() || null),
        payment_receipt_path: paymentMethod === 'cash' ? null : (receiptUrl || null),
      });

      toast.success('Walk-in order created.');
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
    <>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        onClick={e => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="absolute inset-0 bg-[#2D2A26]/70 backdrop-blur-xs" />

        <div className="relative bg-surface rounded-2xl w-full max-w-lg border border-line shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-taupe to-[#7A6560] px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingBag size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-sm sm:text-base">New Walk-in Order</h2>
                <p className="text-white/70 text-xs">Log an in-store catalog sale with instant search</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={15} className="text-white" />
            </button>
          </div>

          {/* Modal Body */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-ink-muted gap-2">
              <Loader2 size={26} className="animate-spin text-taupe" />
              <span className="text-xs font-semibold">Loading catalog & customers...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {/* Catalog Item (Searchable Combobox) */}
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                  <ShoppingBag size={11} /> Catalog Item <span className="text-danger">*</span>
                </label>
                <SearchableCombobox
                  items={catalogItemOptions}
                  value={catalogItemId}
                  onChange={val => setCatalogItemId(String(val))}
                  placeholder="Search or select catalog design..."
                  searchPlaceholder="Search design by name or price..."
                  emptyMessage="No catalog designs found"
                  required
                />
              </div>

              {/* Selected Catalog Item Price & Quick Preview Banner */}
              {selectedItem && (
                <div className="p-3 bg-canvas/70 border border-line rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-11 h-13 rounded-lg bg-surface border border-line overflow-hidden shrink-0 flex items-center justify-center">
                      {selectedItem.images?.[0]?.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={getMediaUrl(selectedItem.images[0].image_url)}
                          alt={selectedItem.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-ink-faint opacity-40" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-ink truncate" title={selectedItem.name}>
                        {selectedItem.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-ink-muted mt-0.5">
                        <span className="capitalize">{selectedItem.category || 'Ready-to-wear'}</span>
                        <span>•</span>
                        <span>{availableSizes.length} sizes available</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[9px] uppercase font-bold text-ink-faint block">
                      Catalog Price
                    </span>
                    <span className="font-mono font-black text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg inline-block shadow-2xs">
                      ₱{Number(selectedItem.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Garment Size Selection - Always interactive and visible once item is chosen */}
              {catalogItemId && (
                <div className="space-y-2 bg-canvas/35 border border-line p-3.5 rounded-xl">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                      <Ruler size={11} /> Garment Size <span className="text-danger">*</span>
                    </label>
                    <span className="text-[11px] text-ink-muted font-medium">
                      Selected: <strong className="text-ink font-bold">{selectedSize || 'None'}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {availableSizes.map(s => {
                      const isSelected = selectedSize === s && !isCustomSize;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setSelectedSize(s);
                            setIsCustomSize(false);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-taupe text-white border-taupe shadow-xs scale-105'
                              : 'bg-surface border-line text-ink-body hover:text-ink hover:border-taupe/60'
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomSize(true);
                        if (!isCustomSize) setSelectedSize('');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        isCustomSize
                          ? 'bg-taupe text-white border-taupe shadow-xs scale-105'
                          : 'bg-surface border-line text-ink-body hover:text-ink hover:border-taupe/60'
                      }`}
                    >
                      Custom Size...
                    </button>
                  </div>

                  {isCustomSize && (
                    <div className="pt-1.5">
                      <input
                        type="text"
                        autoFocus
                        value={selectedSize}
                        onChange={e => setSelectedSize(e.target.value)}
                        placeholder="Specify custom size or fit (e.g. 38R, 34-Waist, Petite)"
                        className="w-full bg-surface border border-line focus:border-taupe focus:ring-2 focus:ring-taupe/15 rounded-xl px-3.5 py-2 text-xs text-ink focus:outline-none transition-all"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Branch Selector (If store has multiple branches) */}
              {branches.length > 1 && (
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                    <MapPin size={11} /> Branch <span className="font-normal normal-case text-ink-faint">(optional)</span>
                  </label>
                  <SearchableCombobox
                    items={branchOptions}
                    value={branchId}
                    onChange={val => setBranchId(String(val))}
                    placeholder="Select branch..."
                    searchPlaceholder="Search branch..."
                    emptyMessage="No branches found"
                  />
                </div>
              )}

              {/* Customer Selector with + Add Customer button on the right */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                    <User size={11} /> Customer <span className="font-normal normal-case text-ink-faint">(optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setQuickAddCustomerOpen(true)}
                    className="flex items-center gap-1 text-[11px] font-bold text-taupe hover:text-taupe-hover hover:underline transition-colors cursor-pointer"
                  >
                    <UserPlus size={12} />
                    <span>+ Add Customer</span>
                  </button>
                </div>
                <SearchableCombobox
                  items={customerOptions}
                  value={customerId}
                  onChange={val => setCustomerId(String(val))}
                  placeholder="Search or select customer..."
                  searchPlaceholder="Search customer by name or phone..."
                  emptyMessage="No matching customers found"
                />
              </div>

              {/* Price & Payment Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                    <CreditCard size={11} /> Total Amount (₱) <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-bold">₱</span>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={totalAmount}
                      onChange={e => setTotalAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-canvas border border-line focus:border-taupe focus:ring-2 focus:ring-taupe/15 rounded-xl pl-7 pr-3 py-2.5 text-sm font-mono font-bold text-ink focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <p className="text-[10px] text-ink-muted mt-1">Single-piece or negotiated walk-in price.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                    Payment Status
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-canvas border border-line rounded-xl h-[42px] items-center">
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('pending')}
                      className={`h-full rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        paymentStatus === 'pending'
                          ? 'bg-surface text-ink shadow-xs border border-line'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('paid')}
                      className={`h-full rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        paymentStatus === 'paid'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      Paid in Full
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment Methods (Cash, GCash, PayMaya - NOT Bank Transfer) */}
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-2">
                  <CreditCard size={11} /> Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash' as const, label: 'Cash', icon: Banknote, desc: 'Counter settlement' },
                    { id: 'gcash' as const, label: 'GCash', icon: Smartphone, desc: 'E-Wallet Transfer' },
                    { id: 'paymaya' as const, label: 'PayMaya', icon: CreditCard, desc: 'Maya / Wallet' },
                  ].map(m => {
                    const active = paymentMethod === m.id;
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${
                          active
                            ? 'bg-taupe text-white border-taupe shadow-xs ring-2 ring-taupe/20'
                            : 'bg-canvas border-line text-ink-muted hover:text-ink hover:bg-surface'
                        }`}
                      >
                        <Icon size={16} className={`mb-1 ${active ? 'text-white' : 'text-taupe'}`} />
                        <span>{m.label}</span>
                        <span className={`text-[10px] font-normal mt-0.5 ${active ? 'text-white/80' : 'text-ink-faint'}`}>
                          {m.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* GCash / PayMaya Reference & Receipt Screenshot */}
              {paymentMethod !== 'cash' && (
                <div className="space-y-2.5 bg-canvas/50 border border-line rounded-xl p-3.5 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">
                      {paymentMethod === 'gcash' ? 'GCash Reference Number' : 'PayMaya Reference Number'}
                    </label>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={e => setPaymentReference(e.target.value)}
                      placeholder={
                        paymentMethod === 'gcash'
                          ? 'e.g. 9876543210'
                          : 'e.g. Maya Ref 1234567890'
                      }
                      className="w-full bg-surface border border-line focus:border-taupe focus:ring-2 focus:ring-taupe/15 rounded-xl px-3.5 py-2 text-xs font-mono text-ink focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">
                      Proof of Payment / Receipt Screenshot
                    </label>
                    {receiptUrl ? (
                      <div className="relative inline-block mt-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={receiptUrl}
                          alt="Receipt screenshot"
                          className="h-16 w-16 object-cover rounded-lg border border-line shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setReceiptUrl('')}
                          className="absolute -top-1.5 -right-1.5 bg-danger text-white rounded-full p-0.5 shadow-sm hover:scale-110 transition-transform cursor-pointer"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ) : (
                      <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-xs font-semibold text-taupe hover:text-taupe-hover bg-surface hover:bg-canvas border border-line px-3 py-2 rounded-xl transition-colors shadow-2xs">
                        {uploadingReceipt ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                        <span>{uploadingReceipt ? 'Uploading screenshot...' : 'Attach payment screenshot'}</span>
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
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving || !catalogItemId || !totalAmount}
                  className="w-full bg-taupe hover:bg-taupe-hover text-white py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <ShoppingBag size={16} />}
                  <span>{saving ? 'Creating Order...' : 'Complete Walk-in Order'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      <QuickAddCustomerModal
        isOpen={quickAddCustomerOpen}
        onClose={() => setQuickAddCustomerOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </>
  );
}
