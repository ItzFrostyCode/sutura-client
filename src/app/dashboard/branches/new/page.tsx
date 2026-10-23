'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Info, Loader2, Lock } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useBranch } from '@/context/BranchContext';
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier';
import ApplePage, { AppleBar } from '@/components/jobs/ui/ApplePage';
import { BTN_PRIMARY, BTN, PLAIN_FIELD, PLAIN_LABEL } from '@/components/shared/plainForm';
import BranchPlaceFields from '@/components/branches/BranchPlaceFields';
import PinPaste from '@/components/shared/PinPaste';
import BranchManagerSection from '@/components/branches/BranchManagerSection';
import { EMPTY_FORM } from '@/components/branches/branchHelpers';
import { meetsPasswordRules } from '@/lib/passwordRules';
import type { AccountValues } from '@/components/auth/AccountFields';
import type { Staff } from '@/components/staff/staffHelpers';
import type { SavedLocation } from '@/lib/customerLocation';
import { getErrorMessage } from '@/lib/apiError';
import { noticeDialog } from '@/store/useConfirmStore';

const LocationPicker = dynamic(() => import('@/components/discovery/LocationPicker'), { ssr: false });

const EMPTY_MANAGER: AccountValues = { name: '', gender: '', email: '', password: '', password_confirmation: '' };

export default function NewBranchPage() {
  const router = useRouter();
  const toast = useToast();
  const { store, user } = useAuthStore();
  const { branches, refreshBranches } = useBranch();
  const { maxBranches, loading: tierLoading } = useSubscriptionTier();

  const isOwner = user?.roles?.some((r: { name: string }) => r.name === 'store_owner') ?? false;

  const [form, setForm] = useState(EMPTY_FORM);
  const [managerMode, setManagerMode] = useState<'new' | 'pick' | 'none'>('none');
  const [managerAccount, setManagerAccount] = useState<AccountValues>(EMPTY_MANAGER);
  const [pickedStaffId, setPickedStaffId] = useState('');
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const branchCount = branches?.length ?? 0;
  const addLocked = !tierLoading && maxBranches !== -1 && branchCount >= maxBranches;

  // Load staff for the "pick existing" option (non-managers only)
  const fetchStaff = useCallback(() => {
    if (!store?.id) return;
    api.get(`/stores/${store.id}/staff`).then(res => {
      const raw: Staff[] = Array.isArray(res.data?.data) ? res.data.data : [];
      setAvailableStaff(raw.filter(s => s.is_active && !s.is_branch_manager));
    }).catch(() => setAvailableStaff([]));
  }, [store?.id]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  if (!isOwner) {
    return (
      <ApplePage>
        <AppleBar>
          <Link href="/dashboard/branches" aria-label="Back"><ArrowLeft size={20} /></Link>
          <h1 className="text-base font-semibold text-ink">Add Branch</h1>
        </AppleBar>
        <div className="px-4 py-12 text-center text-sm text-ink-muted">
          Only the shop owner can add a branch.
        </div>
      </ApplePage>
    );
  }

  const parsedLat = parseFloat(form.latitude);
  const parsedLng = parseFloat(form.longitude);
  const pickerInitial: SavedLocation | null = !Number.isNaN(parsedLat) && !Number.isNaN(parsedLng)
    ? { lat: parsedLat, lng: parsedLng, address: form.address, district: form.district }
    : null;

  const resolveMapsLink = async (url: string) => {
    const res = await api.post(`/stores/${store!.id}/branches/resolve-maps-link`, { url });
    return { lat: Number(res.data.data.latitude), lng: Number(res.data.data.longitude) };
  };

  const canSubmit = (() => {
    if (!form.name || !form.address || !form.city) return false;
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return false;
    if (managerMode === 'new') {
      return !!(
        managerAccount.name && managerAccount.email && managerAccount.password &&
        meetsPasswordRules(managerAccount.password) &&
        managerAccount.password === managerAccount.password_confirmation
      );
    }
    if (managerMode === 'pick') return !!pickedStaffId;
    return true;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !canSubmit) return;
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      setError('Set the branch location first: paste a Google Maps link or pick the spot on the map.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { manager_current: _mc, manager_mode: _mm, manager_staff_id: _msi,
        manager_name: _mn, manager_email: _me, manager_phone: _mph,
        manager_password: _mp, manager_password_confirmation: _mpc, ...branchFields } = form;

      const payload: Record<string, unknown> = { ...branchFields };
      if (managerMode === 'new') {
        payload.manager = {
          name: managerAccount.name,
          email: managerAccount.email,
          password: managerAccount.password,
          password_confirmation: managerAccount.password_confirmation,
          gender: managerAccount.gender || null,
        };
      } else if (managerMode === 'pick' && pickedStaffId) {
        payload.manager_id = Number(pickedStaffId);
      }

      const res = await api.post(`/stores/${store.id}/branches`, payload);
      const created = res.data?.data;
      toast.success('New branch registered successfully.');
      refreshBranches();
      router.push(created?.id ? `/dashboard/branches` : '/dashboard/branches');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to save branch.'));
    } finally {
      setSaving(false);
    }
  };

  if (addLocked) {
    return (
      <ApplePage>
        <AppleBar>
          <Link href="/dashboard/branches" aria-label="Back"><ArrowLeft size={20} /></Link>
          <h1 className="text-base font-semibold text-ink">Add Branch</h1>
        </AppleBar>
        <div className="mx-auto max-w-xl px-4 py-12 text-center space-y-4">
          <Lock size={40} className="mx-auto text-ink-muted" />
          <p className="text-sm text-ink-muted">
            Your plan allows {maxBranches === 1 ? '1 branch' : `up to ${maxBranches} branches`}. Upgrade to add more.
          </p>
          <Link href="/dashboard/billing" className={BTN_PRIMARY}>Upgrade plan</Link>
        </div>
      </ApplePage>
    );
  }

  return (
    <>
      <ApplePage>
        <AppleBar stuck>
          <Link href="/dashboard/branches" className="mr-2 text-ink-muted hover:text-ink" aria-label="Back to branches">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="flex-1 text-base font-semibold text-ink">Add New Branch</h1>
          <button type="submit" form="new-branch-form" disabled={saving || !canSubmit} className={BTN_PRIMARY}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? 'Saving…' : 'Add branch'}
          </button>
        </AppleBar>

        <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form id="new-branch-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Branch Name */}
            <div>
              <label htmlFor="nb-name" className={PLAIN_LABEL}>
                Branch Name <span className="text-danger">*</span>
              </label>
              <input
                id="nb-name"
                required
                type="text"
                placeholder="e.g. Matina Branch"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className={PLAIN_FIELD}
              />
            </div>

            {/* Street Address */}
            <div>
              <label htmlFor="nb-address" className={PLAIN_LABEL}>
                Street Address <span className="text-danger">*</span>{' '}
                <span className="text-xs font-normal text-ink-faint">(house / building / street)</span>
              </label>
              <input
                id="nb-address"
                required
                type="text"
                placeholder="e.g. Jasmin St"
                value={form.address}
                onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                className={PLAIN_FIELD}
              />
            </div>

            {/* Barangay / District */}
            <BranchPlaceFields formData={form} setFormData={setForm} />

            {/* Landmark */}
            <div>
              <label htmlFor="nb-landmark" className={PLAIN_LABEL}>
                Landmark <span className="text-xs font-normal text-ink-faint">(nearby reference)</span>
              </label>
              <input
                id="nb-landmark"
                type="text"
                placeholder="e.g. Beside Jollibee"
                value={form.landmark}
                onChange={e => setForm(p => ({ ...p, landmark: e.target.value }))}
                className={PLAIN_FIELD}
              />
            </div>

            {/* City */}
            <div>
              <label htmlFor="nb-city" className={PLAIN_LABEL}>
                City <span className="text-danger">*</span>
              </label>
              <input
                id="nb-city"
                required
                type="text"
                placeholder="e.g. Davao City"
                value={form.city}
                onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                className={PLAIN_FIELD}
              />
            </div>

            {/* Contact */}
            <div>
              <label htmlFor="nb-contact" className={PLAIN_LABEL}>Contact Number</label>
              <input
                id="nb-contact"
                type="text"
                placeholder="e.g. 09123456789"
                value={form.contact_number}
                onChange={e => setForm(p => ({ ...p, contact_number: e.target.value }))}
                className={PLAIN_FIELD}
              />
            </div>

            {/* Hours */}
            <div>
              <label htmlFor="nb-hours" className={PLAIN_LABEL}>Operating Hours</label>
              <input
                id="nb-hours"
                type="text"
                placeholder="e.g. Mon–Sat 8:00 AM – 6:00 PM"
                value={form.operating_hours}
                onChange={e => setForm(p => ({ ...p, operating_hours: e.target.value }))}
                className={PLAIN_FIELD}
              />
            </div>

            {/* Map pin */}
            <div>
              <p className={`${PLAIN_LABEL} mb-2`}>
                Branch Location{' '}
                <span className="text-xs font-normal text-ink-faint">(required for map discovery)</span>
              </p>
              <PinPaste
                current={pickerInitial ? { lat: pickerInitial.lat, lng: pickerInitial.lng } : null}
                onPin={pin => setForm(p => ({ ...p, latitude: String(pin.lat), longitude: String(pin.lng) }))}
                onPickOnMap={() => setShowLocationPicker(true)}
                resolveLink={store?.id ? resolveMapsLink : undefined}
              />
              <p className="mt-2 text-xs text-ink-faint flex items-start gap-1.5">
                <Info size={13} className="mt-0.5 shrink-0" />
                <span>Without a pin the branch can&apos;t appear on the map. A new pin is checked by SUTURA before the branch shows in map search.</span>
              </p>
            </div>

            {/* Guide image */}
            <div>
              <label htmlFor="nb-guide" className={PLAIN_LABEL}>
                Storefront / Direction Guide Image{' '}
                <span className="text-xs font-normal text-ink-faint">(optional)</span>
              </label>
              {form.guide_image_url ? (
                <div className="relative aspect-video max-w-sm bg-canvas border border-line rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.guide_image_url} alt="Guide" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, guide_image_url: '' }))}
                    className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1"
                  >×</button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-line rounded-xl p-4 max-w-sm bg-canvas/50">
                  {uploading ? (
                    <div className="flex items-center gap-2 text-xs text-ink-muted">
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
                    </div>
                  ) : (
                    <input
                      id="nb-guide"
                      type="file"
                      accept="image/*"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (file && store?.id) {
                          setUploading(true);
                          const fd = new FormData();
                          fd.append('file', file);
                          try {
                            const res = await api.post(`/stores/${store.id}/upload`, fd, {
                              headers: { 'Content-Type': 'multipart/form-data' },
                            });
                            setForm(p => ({ ...p, guide_image_url: res.data.data.url }));
                          } catch (err) {
                            void noticeDialog(getErrorMessage(err, 'Failed to upload image.'));
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

            {/* Branch manager section */}
            <BranchManagerSection
              mode={managerMode}
              onMode={setManagerMode}
              newAccount={managerAccount}
              onNewAccount={delta => setManagerAccount(prev => ({ ...prev, ...delta }))}
              availableStaff={availableStaff}
              pickedStaffId={pickedStaffId}
              onPickedStaffId={setPickedStaffId}
              idPrefix="nb-mgr"
            />

            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/branches" className={BTN}>Cancel</Link>
              <button type="submit" disabled={saving || !canSubmit} className={BTN_PRIMARY}>
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? 'Saving…' : 'Add branch'}
              </button>
            </div>
          </form>
        </div>
      </ApplePage>

      {showLocationPicker && (
        <LocationPicker
          initial={pickerInitial}
          confirmLabel="Confirm Branch Location"
          onClose={() => setShowLocationPicker(false)}
          onConfirm={loc => {
            setForm(p => ({ ...p, latitude: String(loc.lat), longitude: String(loc.lng) }));
            setShowLocationPicker(false);
          }}
        />
      )}
    </>
  );
}
