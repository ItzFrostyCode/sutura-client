import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Loader2 } from 'lucide-react';
import { customerEmail, toPhMobileInput, PH_MOBILE_PATTERN, PH_MOBILE_ERROR, PH_MOBILE_INPUT_PROPS } from './customerHelpers';
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
  // No "Client Type" (suki tag) here anymore; editing never sends it, so an existing tag is left as is.
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    if (editingCustomer && isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: editingCustomer.name,
        email: customerEmail(editingCustomer),
        phone: toPhMobileInput(editingCustomer.phone || ''),
      });
    } else {
      setFormData({ name: '', email: '', phone: '' });
    }
  }, [editingCustomer, isOpen]);

  const [phoneTouched, setPhoneTouched] = useState(false);
  useEffect(() => { if (isOpen) setPhoneTouched(false); }, [isOpen]); // eslint-disable-line react-hooks/set-state-in-effect
  const phoneInvalid = !PH_MOBILE_PATTERN.test(formData.phone);
  const showPhoneError = phoneTouched && formData.phone !== '' && phoneInvalid;

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (phoneInvalid) { setPhoneTouched(true); return; }
    const payload = {
      name: formData.name,
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
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
            {...PH_MOBILE_INPUT_PROPS}
            required
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: toPhMobileInput(e.target.value)})}
            onBlur={() => setPhoneTouched(true)}
            aria-invalid={showPhoneError}
            aria-describedby="phone-hint"
            className={`w-full bg-canvas border rounded-lg px-4 py-2 text-ink tabular-nums focus:outline-none ${showPhoneError ? 'border-danger focus:border-danger' : 'border-line focus:border-taupe'}`}
          />
          <p id="phone-hint" className={`mt-1 text-xs ${showPhoneError ? 'text-danger' : 'text-ink-muted'}`}>
            {showPhoneError ? PH_MOBILE_ERROR : '11 digits, starting with 09.'}
          </p>
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
            disabled={isSubmitting || phoneInvalid}
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
