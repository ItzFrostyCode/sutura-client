import React from 'react';
import { X, Loader2 } from 'lucide-react';

interface CustomerProfileEditModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly editName: string;
  readonly setEditName: (v: string) => void;
  readonly editEmail: string;
  readonly setEditEmail: (v: string) => void;
  readonly editPhone: string;
  readonly setEditPhone: (v: string) => void;
  readonly editNotes: string;
  readonly setEditNotes: (v: string) => void;
  readonly savingProfile: boolean;
  readonly onSubmit: (e: React.SyntheticEvent) => Promise<void>;
}

export default function CustomerProfileEditModal({
  isOpen,
  onClose,
  editName,
  setEditName,
  editEmail,
  setEditEmail,
  editPhone,
  setEditPhone,
  editNotes,
  setEditNotes,
  savingProfile,
  onSubmit,
}: CustomerProfileEditModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#2D2A26]/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-line rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center border-b border-line pb-3 mb-4">
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Edit Customer Profile</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-faint hover:text-ink cursor-pointer p-1"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="customer-edit-name" className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="customer-edit-name"
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-canvas border border-line rounded-xl text-xs text-ink font-semibold focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs"
            />
          </div>
          <div>
            <label htmlFor="customer-edit-email" className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Email Address <span className="text-[10px] text-ink-faint font-normal lowercase">(Optional for walk-ins)</span>
            </label>
            <input
              id="customer-edit-email"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-canvas border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs"
            />
          </div>
          <div>
            <label htmlFor="customer-edit-phone" className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              id="customer-edit-phone"
              type="text"
              required
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="e.g. +63 917 123 4567"
              className="w-full px-3.5 py-2.5 bg-canvas border border-line rounded-xl text-xs text-ink font-mono focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs"
            />
          </div>
          <div>
            <label htmlFor="customer-edit-notes" className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Private Store Notes <span className="text-[10px] text-ink-faint font-normal lowercase">(Internal atelier reference)</span>
            </label>
            <textarea
              id="customer-edit-notes"
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              maxLength={2000}
              placeholder="e.g. Prefers snug waist fit, allergic to synthetic wool, uses cocoon silk for barongs..."
              className="w-full px-3.5 py-2.5 bg-canvas border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe resize-none shadow-2xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-line rounded-xl text-xs font-semibold text-ink-muted hover:text-ink hover:bg-canvas cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 bg-taupe hover:bg-taupe-hover text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {savingProfile && <Loader2 size={14} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
