import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Info, Loader2, X, Lock, MapPin, CheckCircle2, ImagePlus } from 'lucide-react';
import PinTools from '@/components/shared/PinTools';
import Link from 'next/link';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import { DAVAO_DISTRICTS, BranchFormData, NEW_MANAGER } from '@/components/branches/branchHelpers';
import { ROLE_OPTIONS } from '@/components/staff/StaffFormModal';
import type { SavedLocation } from '@/lib/customerLocation';
import { getErrorMessage } from '@/lib/apiError';

const LocationPicker = dynamic(() => import('@/components/discovery/LocationPicker'), { ssr: false });

interface BranchFormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (e: React.SyntheticEvent) => void;
  readonly editingId: number | null;
  readonly isSubmitting: boolean;
  readonly errorMsg: string;
  readonly storeId?: number;
  readonly formData: BranchFormData;
  readonly setFormData: React.Dispatch<React.SetStateAction<BranchFormData>>;
}

export default function BranchFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingId,
  isSubmitting,
  errorMsg,
  storeId,
  formData,
  setFormData,
}: BranchFormModalProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadingLandmark, setUploadingLandmark] = useState(false);

  // Shared by the guide and landmark photos: upload, then keep its URL.
  const uploadImage = async (file: File, field: 'guide_image_url' | 'landmark_image_url', setBusy: (busy: boolean) => void) => {
    if (!storeId) return;
    setBusy(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`/stores/${storeId}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData(prev => ({ ...prev, [field]: res.data.data.url }));
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to upload image. File may be too large.'));
    } finally {
      setBusy(false);
    }
  };
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [staffList, setStaffList] = useState<Array<{ id: number; role: string; user?: { name: string; email: string } }>>([]);
  const [mapsLinkInput, setMapsLinkInput] = useState('');
  const [resolvingMapsLink, setResolvingMapsLink] = useState(false);
  const [mapsLinkError, setMapsLinkError] = useState('');
  const [mapsLinkResolved, setMapsLinkResolved] = useState(false);
  const [showManualCoords, setShowManualCoords] = useState(false);

  const handleResolveMapsLink = async () => {
    if (!storeId || !mapsLinkInput.trim()) return;
    setResolvingMapsLink(true);
    setMapsLinkError('');
    setMapsLinkResolved(false);
    try {
      const res = await api.post(`/stores/${storeId}/branches/resolve-maps-link`, { url: mapsLinkInput.trim() });
      const { latitude, longitude } = res.data.data;
      setFormData(prev => ({ ...prev, latitude: String(latitude), longitude: String(longitude) }));
      setMapsLinkResolved(true);
    } catch (err) {
      setMapsLinkError(getErrorMessage(err, "Couldn't read a location from that link."));
    } finally {
      setResolvingMapsLink(false);
    }
  };

  const parsedLat = parseFloat(formData.latitude);
  const parsedLng = parseFloat(formData.longitude);
  const pickerInitial: SavedLocation | null = (!Number.isNaN(parsedLat) && !Number.isNaN(parsedLng))
    ? { lat: parsedLat, lng: parsedLng, address: formData.address, district: formData.district ?? '' }
    : null;

  React.useEffect(() => {
    if (isOpen && storeId) {
      api.get(`/stores/${storeId}/staff`)
        .then(res => {
          setStaffList(Array.isArray(res.data?.data) ? res.data.data : []);
        })
        .catch(err => console.error('Failed to load staff for manager selection:', err));
    }
  }, [isOpen, storeId]);
  return (
    <>
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
            Street Address <span className="text-red-400">*</span> <span className="text-ink-faint font-normal">(house / building / street)</span>
          </label>
          <input
            id="branch-address"
            required
            type="text"
            placeholder="e.g. Jasmin St"
            value={formData.address}
            onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
            className="w-full px-4 py-2 bg-canvas border border-line rounded-lg text-ink focus:outline-none focus:border-taupe text-sm"
          />
        </div>

        {/* Barangay */}
        <div>
          <label htmlFor="branch-barangay" className="block text-sm font-medium text-ink-body mb-1">
            Barangay <span className="text-ink-faint font-normal">(optional — customers can search by it)</span>
          </label>
          <input
            id="branch-barangay"
            type="text"
            placeholder="e.g. Ubalde"
            value={formData.barangay ?? ''}
            onChange={e => setFormData(prev => ({ ...prev, barangay: e.target.value }))}
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
          {/* Landmark photo: helps customers spot it on the way. */}
          {formData.landmark_image_url ? (
            <div className="relative mt-2 aspect-video max-w-xs overflow-hidden rounded-lg border border-line bg-canvas">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={formData.landmark_image_url} alt="Landmark" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, landmark_image_url: '' }))}
                aria-label="Remove landmark photo"
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/85"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className={`mt-2 inline-flex min-h-10 items-center gap-2 rounded-lg border border-dashed border-line px-3 text-xs font-medium text-ink-muted ${uploadingLandmark ? 'cursor-wait' : 'cursor-pointer hover:border-taupe hover:text-ink'}`}>
              {uploadingLandmark ? <Loader2 size={14} className="animate-spin text-taupe" /> : <ImagePlus size={14} />}
              {uploadingLandmark ? 'Uploading photo…' : 'Add a landmark photo (optional)'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploadingLandmark}
                onChange={e => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) void uploadImage(file, 'landmark_image_url', setUploadingLandmark);
                }}
              />
            </label>
          )}
        </div>

        {/* City & District */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="branch-city" className="block text-sm font-medium text-ink-body mb-1">
              City <span className="text-red-400">*</span>
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
            <label htmlFor="branch-district" className="block text-sm font-medium text-ink-body mb-1">
              District <span className="text-ink-faint font-normal">(for customer search)</span>
            </label>
            <select
              id="branch-district"
              value={formData.district ?? ''}
              onChange={e => setFormData(prev => ({ ...prev, district: e.target.value }))}
              className="w-full px-4 py-2 bg-canvas border border-line rounded-lg text-ink focus:outline-none focus:border-taupe text-sm"
            >
              <option value="">Not set</option>
              {DAVAO_DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Contact */}
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

        {/* Map Location */}
        <div>
          <label htmlFor="branch-maps-link" className="block text-sm font-medium text-ink-body mb-1">
            Branch Location{' '}
            <span className="text-ink-faint font-normal ml-1">(required for map discovery)</span>
          </label>
          <p className="text-xs text-ink-muted mb-2">
            Open Google Maps, find your branch, tap <strong>Share</strong>, then paste the link here.
          </p>
          <div className="flex gap-2">
            <input
              id="branch-maps-link"
              type="text"
              placeholder="Paste Google Maps link (e.g. https://maps.app.goo.gl/...)"
              value={mapsLinkInput}
              onChange={e => { setMapsLinkInput(e.target.value); setMapsLinkResolved(false); setMapsLinkError(''); }}
              className="w-full px-4 py-2 bg-canvas border border-line rounded-lg text-ink text-sm focus:outline-none focus:border-taupe"
            />
            <button
              type="button"
              onClick={handleResolveMapsLink}
              disabled={resolvingMapsLink || !mapsLinkInput.trim()}
              className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-taupe hover:bg-taupe/90 disabled:opacity-50 text-white text-sm font-semibold"
            >
              {resolvingMapsLink ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
              Use Link
            </button>
          </div>
          {mapsLinkError && (
            <p className="text-xs text-danger mt-1.5">{mapsLinkError}</p>
          )}
          {mapsLinkResolved && !mapsLinkError && (
            <p className="text-xs text-emerald-700 mt-1.5 flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Location set from your link.
            </p>
          )}

          <p className="text-xs text-ink-muted mt-3 mb-2">Or, if you&apos;re at the branch now, use your location — or pick it on the map.</p>
          <PinTools
            current={pickerInitial}
            onPickOnMap={() => setShowLocationPicker(true)}
            onPin={(pin) => {
              setMapsLinkResolved(false);
              setFormData(prev => ({ ...prev, latitude: String(pin.lat), longitude: String(pin.lng) }));
            }}
          />

          <button
            type="button"
            onClick={() => setShowManualCoords(v => !v)}
            className="text-xs text-ink-faint hover:text-ink-muted underline mt-2"
          >
            {showManualCoords ? 'Hide manual coordinate entry' : 'Have exact coordinates already? Enter them manually'}
          </button>
          {showManualCoords && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <input
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
          )}
          <p className="text-xs text-ink-faint mt-1.5 flex items-start gap-1.5">
            <Info size={13} className="mt-0.5 shrink-0" />
            <span>The location pin is required — without it the branch can&apos;t appear on the map. The Maps link, your current location or the map above are easier than typing coordinates.</span>
          </p>
        </div>

        {/* Designated Branch Manager */}
        <div>
          <label htmlFor="branch-manager" className="block text-sm font-medium text-ink-body mb-1">
            Designated Branch Manager
          </label>
          <select
            id="branch-manager"
            value={formData.manager_id ?? ''}
            onChange={e => {
              const v = e.target.value;
              setFormData(prev => ({ ...prev, manager_id: v === NEW_MANAGER ? NEW_MANAGER : v ? Number(v) : '' }));
            }}
            className="w-full px-4 py-2 bg-canvas border border-line rounded-lg text-ink focus:outline-none focus:border-taupe text-sm"
          >
            <option value="">-- No Branch Manager Assigned --</option>
            {staffList.map(member => (
              <option key={member.id} value={member.id}>
                {member.user?.name || `Staff #${member.id}`} ({member.role?.replace(/_/g, ' ')})
              </option>
            ))}
            {!editingId && <option value={NEW_MANAGER}>+ Create new staff for this branch</option>}
          </select>
          <p className="text-[11px] text-ink-muted mt-1">
            Assigning a manager establishes supervisory accountability and links staff to this branch.
          </p>

          {formData.manager_id === NEW_MANAGER && (
            <div className="mt-3 space-y-3 rounded-lg border border-line bg-canvas/60 p-3">
              <p className="text-xs text-ink-muted">
                SUTURA makes their login and a temporary password when you add the branch, and shows them to you once.
              </p>
              <div>
                <label htmlFor="new-manager-name" className="block text-sm font-medium text-ink-body mb-1">
                  Full name <span className="text-red-400">*</span>
                </label>
                <input
                  id="new-manager-name"
                  required
                  type="text"
                  maxLength={191}
                  placeholder="e.g. Maria Santos"
                  value={formData.new_manager_name}
                  onChange={e => setFormData(prev => ({ ...prev, new_manager_name: e.target.value }))}
                  className="w-full px-4 py-2 bg-surface border border-line rounded-lg text-ink focus:outline-none focus:border-taupe text-sm"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="new-manager-role" className="block text-sm font-medium text-ink-body mb-1">Role</label>
                  <select
                    id="new-manager-role"
                    value={formData.new_manager_role}
                    onChange={e => setFormData(prev => ({ ...prev, new_manager_role: e.target.value }))}
                    className="w-full px-4 py-2 bg-surface border border-line rounded-lg text-ink focus:outline-none focus:border-taupe text-sm"
                  >
                    {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="new-manager-phone" className="block text-sm font-medium text-ink-body mb-1">
                    Phone <span className="text-ink-faint font-normal">(optional)</span>
                  </label>
                  <input
                    id="new-manager-phone"
                    type="tel"
                    maxLength={20}
                    placeholder="e.g. 09123456789"
                    value={formData.new_manager_phone}
                    onChange={e => setFormData(prev => ({ ...prev, new_manager_phone: e.target.value }))}
                    className="w-full px-4 py-2 bg-surface border border-line rounded-lg text-ink focus:outline-none focus:border-taupe text-sm"
                  />
                </div>
              </div>
            </div>
          )}
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
            Upload an image of your building or shop front (ideally with arrows/pointers to help customers find you).
          </span>
          {formData.guide_image_url ? (
            <div className="relative aspect-video max-w-sm bg-canvas border border-line rounded-lg overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={formData.guide_image_url} alt="Shop Profile Guide" className="w-full h-full object-cover" />
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
                    if (file && storeId) {
                      setUploading(true);
                      const fd = new FormData();
                      fd.append('file', file);
                      try {
                        const res = await api.post(`/stores/${storeId}/upload`, fd, {
                          headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        setFormData(prev => ({ ...prev, guide_image_url: res.data.data.url }));
                      } catch (err) {
                        console.error('Guide image upload failed', err);
                        alert(getErrorMessage(err, 'Failed to upload image. File may be too large.'));
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

    {showLocationPicker && (
      <LocationPicker
        initial={pickerInitial}
        confirmLabel="Confirm Branch Location"
        onClose={() => setShowLocationPicker(false)}
        onConfirm={(loc) => {
          setFormData(prev => ({ ...prev, latitude: String(loc.lat), longitude: String(loc.lng) }));
          setShowLocationPicker(false);
        }}
      />
    )}
    </>
  );
}
