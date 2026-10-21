'use client';

import React, { useState } from 'react';
import { X, ImagePlus, Loader2, Link as LinkIcon, AlertCircle } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { getMediaUrl } from '@/lib/media';
import { useToast } from '@/context/ToastContext';
import { CustomizationInstruction } from '../../jobTypes';

interface JobCustomizationInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (instruction: CustomizationInstruction) => void;
  editingInstruction?: CustomizationInstruction | null;
  storeId?: number;
}

export default function JobCustomizationInstructionModal({
  isOpen,
  onClose,
  onSave,
  editingInstruction,
  storeId,
}: JobCustomizationInstructionModalProps) {
  const toast = useToast();
  const [label, setLabel] = useState(editingInstruction?.label || '');
  const [details, setDetails] = useState(editingInstruction?.details || '');
  const [referenceLink, setReferenceLink] = useState(editingInstruction?.reference_link || '');
  const [referenceImage, setReferenceImage] = useState(editingInstruction?.reference_image || '');
  const [scope, setScope] = useState(editingInstruction?.scope || 'entire_job');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUploadImage = async (file: File | undefined) => {
    if (!file || !storeId) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`/stores/${storeId}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url || res.data?.url;
      if (url) {
        setReferenceImage(url);
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to upload reference image.'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError('Instruction label is required (e.g. Logo Placement, Collar Style).');
      return;
    }
    if (!details.trim()) {
      setError('Instruction details or description is required.');
      return;
    }

    onSave({
      id: editingInstruction?.id || `inst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      label: label.trim(),
      details: details.trim(),
      reference_link: referenceLink.trim() || null,
      reference_image: referenceImage || null,
      scope: scope.trim() || 'entire_job',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-espresso/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface border border-line rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-canvas">
          <h3 className="text-sm font-bold text-ink">
            {editingInstruction ? 'Edit Customization Instruction' : 'Add Customization Instruction'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="inst-label" className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
              Instruction Label *
            </label>
            <input
              id="inst-label"
              type="text"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Logo Placement, Name & Number Printing, Collar Style"
              className="w-full bg-canvas border border-line focus:border-taupe rounded-xl px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="inst-details" className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
              Details & Instructions *
            </label>
            <textarea
              id="inst-details"
              value={details}
              onChange={(e) => {
                setDetails(e.target.value);
                setError(null);
              }}
              rows={3}
              placeholder="e.g. Place company embroidery logo at upper back, 3 inches wide. Use silver thread..."
              className="w-full bg-canvas border border-line focus:border-taupe rounded-xl px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label htmlFor="inst-scope" className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                Scope / Applicability
              </label>
              <select
                id="inst-scope"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full bg-canvas border border-line focus:border-taupe rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
              >
                <option value="entire_job">Entire Job Order (Global)</option>
                <option value="custom_pieces">Specific Garments Only</option>
                <option value="sample_mockup">Sample / Proofing Only</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="inst-link" className="text-xs font-semibold text-ink-muted uppercase tracking-wider block flex items-center gap-1">
                <LinkIcon size={11} className="text-taupe" />
                <span>Reference Link (Optional)</span>
              </label>
              <input
                id="inst-link"
                type="url"
                value={referenceLink}
                onChange={(e) => setReferenceLink(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full bg-canvas border border-line focus:border-taupe rounded-xl px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:outline-none"
              />
            </div>
          </div>

          {/* Reference Image */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
              Reference Image or Mockup (Optional)
            </label>
            {referenceImage ? (
              <div className="relative w-36 aspect-video rounded-xl overflow-hidden border border-line group bg-canvas">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getMediaUrl(referenceImage)}
                  alt="Reference preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setReferenceImage('')}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-espresso/70 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="border border-dashed border-line hover:border-taupe rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer bg-canvas/40 hover:bg-canvas transition-colors">
                {uploading ? (
                  <Loader2 size={16} className="animate-spin text-taupe" />
                ) : (
                  <ImagePlus size={16} className="text-taupe" />
                )}
                <span className="text-xs font-medium text-ink-muted">
                  {uploading ? 'Uploading image…' : 'Attach reference sketch or mockup'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => handleUploadImage(e.target.files?.[0])}
                />
              </label>
            )}
          </div>

          <div className="pt-4 border-t border-line flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-ink-body hover:bg-canvas rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-espresso hover:bg-espresso/90 text-white rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              {editingInstruction ? 'Save Instruction' : 'Add Instruction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
