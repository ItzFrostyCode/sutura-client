import React, { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import SettingsOperatingHours from '@/components/settings/SettingsOperatingHours';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';

interface EditOperatingHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: number;
  initialHours: Record<string, { is_open: boolean; open: string; close: string }>;
  onSaved: (hours: Record<string, { is_open: boolean; open: string; close: string }>) => void;
}

export default function EditOperatingHoursModal({ isOpen, onClose, storeId, initialHours, onSaved }: EditOperatingHoursModalProps) {
  const [hours, setHours] = useState(initialHours || {});
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setHours(initialHours || {});
    }
  }

  if (!isOpen) return null;

  const handleHoursChange = (day: string, field: 'is_open' | 'open' | 'close', value: string | boolean) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/stores/${storeId}`, { operating_hours: hours });
      toast.success('Operating hours updated successfully.');
      onSaved(hours);
      onClose();
    } catch {
      toast.error('Failed to update operating hours.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center p-0 min-[600px]:items-center min-[600px]:p-4 sm:p-6 bg-black/70">
      <div className="bg-surface w-full h-[100dvh] max-h-[100dvh] rounded-none border-0 min-[600px]:h-auto min-[600px]:max-h-[85vh] min-[600px]:rounded-2xl min-[600px]:max-w-2xl min-[600px]:border min-[600px]:border-line flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-line bg-surface shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-ink">Edit Standard Hours</h2>
          <button 
            type="button"
            onClick={onClose} 
            className="w-11 h-11 flex items-center justify-center hover:bg-canvas rounded-full transition-colors text-ink-muted hover:text-ink shrink-0 touch-target-44"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-surface">
          <SettingsOperatingHours operatingHours={hours} onHoursChange={handleHoursChange} />
        </div>

        <div 
          className="px-4 py-3 sm:px-6 sm:py-4 border-t border-line bg-surface flex items-center justify-end gap-3 shrink-0"
          style={{ paddingBottom: 'max(0.75rem, calc(0.75rem + env(safe-area-inset-bottom)))' }}
        >
          <button 
            type="button"
            onClick={onClose} 
            disabled={saving} 
            className="h-11 sm:h-12 px-5 text-sm sm:text-[15px] font-medium text-ink-body hover:bg-canvas rounded-xl transition-colors min-w-[80px]"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSave} 
            disabled={saving} 
            className="h-11 sm:h-12 flex items-center justify-center gap-2 px-6 bg-taupe text-white text-sm sm:text-[15px] font-semibold rounded-xl hover:bg-taupe transition-colors disabled:opacity-50 min-w-[140px]"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
