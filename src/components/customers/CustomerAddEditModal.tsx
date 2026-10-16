import React from 'react';
import Modal from '@/components/Modal';
import { Loader2 } from 'lucide-react';
import { type Gender } from '@/components/shared/GenderPicker';
import CustomerFields from './CustomerFields';

interface CustomerAddEditModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly editingId: number | null;
  readonly formData: { name: string; email: string; phone: string; gender: Gender | '' };
  readonly setFormData: React.Dispatch<React.SetStateAction<{ name: string; email: string; phone: string; gender: Gender | '' }>>;
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

        <CustomerFields value={formData} onChange={setFormData} showEmail={editingId !== null} />

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
