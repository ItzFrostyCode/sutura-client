import React, { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import SettingsOperatingHours from '@/components/settings/SettingsOperatingHours';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';

interface EditOperatingHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: number;
  initialHours: Record<string, { is_open: boolean; open: string; close: string }>;
  onSaved: (hours: Record<string, { is_open: boolean; open: string; close: string }>) => void;
}

export default function EditOperatingHoursModal({ isOpen, onClose, shopId, initialHours, onSaved }: EditOperatingHoursModalProps) {
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
      await api.put(`/shops/${shopId}`, { operating_hours: hours });
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-[#EBE6E0]">
          <h2 className="text-xl font-extrabold text-[#2D2A26]">Edit Standard Hours</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#FAF6F3] rounded-full transition-colors group">
            <X size={20} className="text-[#827A73] group-hover:text-[#2D2A26]" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 bg-[#FAF6F3]">
          <SettingsOperatingHours operatingHours={hours} onHoursChange={handleHoursChange} />
        </div>

        <div className="p-6 border-t border-[#EBE6E0] bg-white rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} disabled={saving} className="px-5 py-2.5 text-[15px] font-semibold text-[#524A44] hover:bg-[#FAF6F3] rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-[#9A8073] text-white text-[15px] font-semibold rounded-xl hover:bg-[#8A7063] transition-colors disabled:opacity-50 shadow-sm">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
