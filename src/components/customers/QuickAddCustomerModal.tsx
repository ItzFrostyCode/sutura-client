'use client';

import React, { useState } from 'react';
import { X, UserPlus, Loader2, Phone, Mail, FileText, User } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';

export interface CreatedCustomer {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
}

interface QuickAddCustomerModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCustomerCreated: (customer: CreatedCustomer) => void;
}

export default function QuickAddCustomerModal({
  isOpen,
  onClose,
  onCustomerCreated,
}: QuickAddCustomerModalProps) {
  const { shop } = useAuthStore();
  const toast = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !name.trim() || !phone.trim()) return;

    setSaving(true);
    try {
      const res = await api.post(`/shops/${shop.id}/customers`, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        notes: notes.trim() || null,
        suki_tag: 'walk_in_retail',
      });

      const customer = res.data?.data;
      toast.success(`Customer "${name}" added successfully.`);
      
      onCustomerCreated({
        id: customer?.id,
        name: customer?.name || name,
        email: customer?.email || email,
        phone: customer?.phone || phone,
      });

      // Reset
      setName('');
      setPhone('');
      setEmail('');
      setNotes('');
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to add customer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-[#2D2A26]/70 backdrop-blur-xs" />

      <div className="relative bg-surface rounded-2xl w-full max-w-sm border border-line shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-taupe to-[#7A6560] px-5 py-3.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <UserPlus size={15} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm">Add Walk-in Customer</h3>
              <p className="text-white/70 text-[10px]">Quickly create client profile</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">
              <User size={11} /> Full Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Maria Clara Santos"
              className="w-full bg-canvas border border-line focus:border-taupe focus:ring-2 focus:ring-taupe/15 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-ink focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">
              <Phone size={11} /> Phone / Mobile <span className="text-danger">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 0917 123 4567"
              className="w-full bg-canvas border border-line focus:border-taupe focus:ring-2 focus:ring-taupe/15 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-ink focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">
              <Mail size={11} /> Email <span className="text-ink-faint font-normal normal-case">(optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="client@example.com"
              className="w-full bg-canvas border border-line focus:border-taupe focus:ring-2 focus:ring-taupe/15 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-ink focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">
              <FileText size={11} /> Notes <span className="text-ink-faint font-normal normal-case">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Fitting preferences or remarks..."
              className="w-full bg-canvas border border-line focus:border-taupe focus:ring-2 focus:ring-taupe/15 rounded-xl px-3.5 py-2 text-xs text-ink focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-ink-muted hover:text-ink hover:bg-canvas transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !phone.trim()}
              className="px-5 py-2 rounded-xl bg-taupe hover:bg-taupe-hover text-white text-xs font-bold shadow-2xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
              <span>{saving ? 'Adding...' : 'Save Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
