import React from 'react';
import Modal from '@/components/Modal';
import { Loader2 } from 'lucide-react';

interface CustomerAddEditModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly editingId: number | null;
  readonly formData: { name: string; email: string; phone: string };
  readonly setFormData: React.Dispatch<React.SetStateAction<{ name: string; email: string; phone: string }>>;
  readonly onSubmit: (e: React.SyntheticEvent) => Promise<void>;
  readonly isSubmitting: boolean;
  readonly error: string;
}

export default function CustomerAddEditModal({
  isOpen,
  onClose,
  editingId,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  error,
}: CustomerAddEditModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingId ? 'Edit Customer Info' : 'Register New Customer'}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="bg-danger/10 border border-danger/50 text-danger px-4 py-3 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
            Full Name <span className="text-danger">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2.5 text-xs text-ink font-semibold focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs"
            placeholder="e.g. Maria Clara"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
            Email Address <span className="text-[10px] text-ink-faint font-normal lowercase">(optional for walk-ins)</span>
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2.5 text-xs text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs"
            placeholder="e.g. maria.clara@gmail.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
            Phone Number <span className="text-danger">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2.5 text-xs text-ink font-mono focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs"
            placeholder="e.g. +63 917 123 4567"
          />
        </div>

        <div className="pt-3 flex justify-end gap-2 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-taupe hover:bg-taupe-hover text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {editingId ? 'Save Changes' : 'Create Customer Record'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
