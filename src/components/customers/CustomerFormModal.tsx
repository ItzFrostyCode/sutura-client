import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Loader2 } from 'lucide-react';
import { isWalkInEmail } from './customerHelpers';
import { CustomerData } from './customerTypes';

interface CustomerFormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly editingCustomer: CustomerData | null;
  readonly onSubmit: (payload: Record<string, string | null>) => Promise<void>;
  readonly isSubmitting: boolean;
  readonly error: string;
}

export default function CustomerFormModal({
  isOpen,
  onClose,
  editingCustomer,
  onSubmit,
  isSubmitting,
  error,
}: CustomerFormModalProps) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', suki_tag: '' });

  useEffect(() => {
    if (editingCustomer && isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: editingCustomer.name,
        email: isWalkInEmail(editingCustomer.email) ? '' : editingCustomer.email,
        phone: editingCustomer.phone || '',
        suki_tag: editingCustomer.suki_tag || '',
      });
    } else {
      setFormData({ name: '', email: '', phone: '', suki_tag: '' });
    }
  }, [editingCustomer, isOpen]);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      suki_tag: formData.suki_tag || null,
    };
    onSubmit(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingCustomer ? "Edit Customer" : "Add New Customer"}>
      <form onSubmit={handleSubmit} className="space-y-4 text-ink">
        {error && (
          <div className="bg-danger/10 border border-danger/50 text-danger px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink-body mb-1">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input 
            id="name"
            type="text" 
            required
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full bg-canvas border border-line rounded-lg px-4 py-2 text-ink focus:outline-none focus:border-taupe"
            placeholder="Juan Dela Cruz"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink-body mb-1">
            Email Address <span className="text-xs text-ink-muted font-normal">(Optional)</span>
          </label>
          <input 
            id="email"
            type="email" 
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            className="w-full bg-canvas border border-line rounded-lg px-4 py-2 text-ink focus:outline-none focus:border-taupe"
            placeholder="juan@example.com"
          />
        </div>
        
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-ink-body mb-1">
            Phone Number <span className="text-rose-500">*</span>
          </label>
          <input 
            id="phone"
            type="tel" 
            required
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
            className="w-full bg-canvas border border-line rounded-lg px-4 py-2 text-ink focus:outline-none focus:border-taupe"
            placeholder="+63 900 000 0000"
          />
        </div>

        {/* Suki Tag */}
        <div>
          <label htmlFor="suki_tag" className="block text-sm font-medium text-ink-body mb-1">
            Client Type <span className="text-xs text-ink-muted font-normal">(Suki Classification)</span>
          </label>
          <select
            id="suki_tag"
            value={formData.suki_tag}
            onChange={e => setFormData({...formData, suki_tag: e.target.value})}
            className="w-full bg-canvas border border-line rounded-lg px-4 py-2 text-ink focus:outline-none focus:border-taupe text-sm"
          >
            <option value="">Select client type...</option>
            <option value="walk_in_retail">Walk-in Retail</option>
            <option value="b2b_suki">B2B Suki (Bulk / Corporate)</option>
            <option value="reseller">Reseller (Palengke / Wholesale)</option>
          </select>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-ink-body hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {editingCustomer ? "Save Changes" : "Save Customer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
