import React, { useState } from 'react';
import { Info, Loader2, X, Lock } from 'lucide-react';
import Link from 'next/link';
import Modal from '@/components/Modal';
import api from '@/lib/axios';

interface BranchFormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (e: React.SyntheticEvent) => void;
  readonly editingId: number | null;
  readonly isSubmitting: boolean;
  readonly errorMsg: string;
  readonly shopId?: number;
  readonly formData: {
    name: string;
    address: string;
    landmark?: string;
    city: string;
    contact_number: string;
    latitude: string;
    longitude: string;
    operating_hours: string;
    status: string;
    guide_image_url?: string;
  };
  readonly setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    address: string;
    landmark: string;
    city: string;
    contact_number: string;
    latitude: string;
    longitude: string;
    operating_hours: string;
    status: string;
    guide_image_url: string;
  }>>;
}

export default function BranchFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingId,
  isSubmitting,
  errorMsg,
  shopId,
  formData,
  setFormData,
}: BranchFormModalProps) {
  const [uploading, setUploading] = useState(false);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingId ? 'Edit Branch' : 'Add New Branch'}>
      <form onSubmit={onSubmit} className="space-y-4">
        {errorMsg && (
          errorMsg.toLowerCase().includes('upgrade') ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between gap-3">
              <p className="text-sm text-amber-700">{errorMsg}</p>
              <Link
                href="/dashboard/billing"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <Lock size={12} /> Upgrade
              </Link>
            </div>
          ) : (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )
        )}

        {/* Branch Name */}
        <div>
          <label htmlFor="branch-name" className="block text-sm font-medium text-ink-body mb-1">
            Branch Name <span className="text-red-400">*</span>
          </label>
          <input
            id="branch-name"
            required
            type="text"
            placeholder="e.g. Matina Branch"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2 bg-canvas border border-line rounded-lg text-ink focus:outline-none focus:border-taupe text-sm"
          />
        </div>

        {/* Address */}
        <div>
          <label htmlFor="branch-address" className="block text-sm font-medium text-ink-body mb-1">
            Street Address <span className="text-red-400">*</span>
          </label>
          <input
            id="branch-address"
            required
            type="text"
            placeholder="e.g. 123 JP Laurel Avenue"
            value={formData.address}
            onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
            className="w-full px-4 py-2 bg-canvas border border-line rounded-lg text-ink focus:outline-none focus:border-taupe text-sm"
          />
        </div>

        {/* Landmark */}
        <div>
          <label htmlFor="branch-landmark" className="block text-sm font-medium text-ink-body mb-1">
            Landmark <span className="text-ink-faint font-normal">(nearby reference)</span>
          </label>
          <input
            id="branch-landmark"
            type="text"
            placeholder="e.g. Beside Jollibee, across the church"
            value={formData.landmark ?? ''}
            onChange={e => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
            className="w-full px-4 py-2 bg-canvas border border-line rounded-lg text-ink focus:outline-none focus:border-taupe text-sm"
          />
        </div>

        {/* City & Contact */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="branch-city" className="block text-sm font-medium text-ink-body mb-1">
              City / District <span className="text-red-400">*</span>
            </label>
            <input
              id="branch-city"
              required
              type="text"
              placeholder="e.g. Davao City"
              value={formData.city}
              onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
              className="w-full px-4 py-2 bg-canvas border border-line rounded-lg text-ink focus:outline-none focus:border-taupe text-sm"
            />
          </div>
          <div>
            <label htmlFor="branch-contact" className="block text-sm font-medium text-ink-body mb-1">Contact Number</label>
            <input
              id="branch-contact"
              type="text"
              placeholder="e.g. 09123456789"
              value={formData.contact_number}
              onChange={e => setFormData(prev => ({ ...prev, contact_number: e.target.value }))}
              className="w-full px-4 py-2 bg-canvas border border-line rounded-lg text-ink focus:outline-none focus:border-taupe text-sm"
            />
          </div>
        </div>

        {/* Operating Hours */}
        <div>
          <label htmlFor="branch-hours" className="block text-sm font-medium text-ink-body mb-1">Operating Hours</label>
          <input
            id="branch-hours"
            type="text"
            placeholder="e.g. Mon–Sat 8:00 AM – 6:00 PM"
            value={formData.operating_hours}
            onChange={e => setFormData(prev => ({ ...prev, operating_hours: e.target.value }))}
            className="w-full px-4 py-2 bg-canvas border border-line rounded-lg text-ink focus:outline-none focus:border-taupe text-sm"
          />
        </div>

        {/* Map Coordinates */}
        <div>
          <label htmlFor="branch-lat" className="block text-sm font-medium text-ink-body mb-1">
            Map Coordinates{' '}
            <span className="text-ink-faint font-normal ml-1">(required for map discovery)</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              id="branch-lat"
              type="text"
              placeholder="Latitude (e.g. 7.1907)"
              value={formData.latitude}
              onChange={e => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
              className="w-full px-4 py-2 bg-canvas border border-line rounded-lg text-ink text-sm focus:outline-none focus:border-taupe"
            />
            <input
              type="text"
              placeholder="Longitude (e.g. 125.4553)"
              value={formData.longitude}
              onChange={e => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
              className="w-full px-4 py-2 bg-canvas border border-line rounded-lg text-ink text-sm focus:outline-none focus:border-taupe"
            />
          </div>
          <p className="text-xs text-ink-faint mt-1.5 flex items-start gap-1.5">
            <Info size={13} className="mt-0.5 shrink-0" />
            <span>Tip: Open Google Maps, right-click your shop location, and copy the coordinates.</span>
          </p>
        </div>

        {/* Status (only for edit) */}
        {editingId && (
          <div>
            <label htmlFor="branch-status" className="block text-sm font-medium text-ink-body mb-1">Branch Status</label>
            <select
              id="branch-status"
              value={formData.status}
              onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-4 py-2 bg-canvas border border-line rounded-lg text-ink focus:outline-none focus:border-taupe text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        )}
        {/* Branch Guide Image */}
        <div>
          <label htmlFor="branch-guide-image" className="block text-sm font-medium text-ink-body mb-1">
            Storefront / Direction Guide Image (Optional)
          </label>
          <span className="block text-[11px] text-ink-muted mb-2">
            Upload an image of your building or storefront (ideally with arrows/pointers to help customers find you).
          </span>
          {formData.guide_image_url ? (
            <div className="relative aspect-video max-w-sm bg-canvas border border-line rounded-lg overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={formData.guide_image_url} alt="Storefront Guide" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, guide_image_url: '' }))}
                className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-line rounded-lg p-4 text-center max-w-sm bg-canvas/50">
              {uploading ? (
                <div className="flex items-center justify-center gap-2 text-xs text-ink-muted">
                  <Loader2 className="w-4 h-4 animate-spin text-taupe" />
                  <span>Uploading guide image...</span>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (file && shopId) {
                      setUploading(true);
                      const fd = new FormData();
                      fd.append('file', file);
                      try {
                        const res = await api.post(`/shops/${shopId}/upload`, fd, {
                          headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        setFormData(prev => ({ ...prev, guide_image_url: res.data.data.url }));
                      } catch (err) {
                        console.error('Guide image upload failed', err);
                        alert('Failed to upload image. File may be too large.');
                      } finally {
                        setUploading(false);
                      }
                    }
                  }}
                  className="text-xs text-ink-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-sunken file:text-taupe hover:file:bg-line cursor-pointer"
                />
              )}
            </div>
          )}
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-ink-muted hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-taupe hover:bg-taupe/90 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {editingId ? 'Save Changes' : 'Add Branch'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
