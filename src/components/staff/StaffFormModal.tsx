import React, { useEffect, useState } from 'react';
import { X, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { useBranch } from '@/context/BranchContext';
import { useAuthStore } from '@/store/useAuthStore';

interface StaffFormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  readonly editingId: number | null;
  readonly saving: boolean;
  readonly formData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: string;
    additional_roles: string[];
    specialization: string;
    hired_at: string;
    is_active: boolean;
    store_branch_id: string;
    is_branch_manager: boolean;
    bio: string;
    is_available: boolean;
  };
  readonly setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    email: string;
    password: string;
    phone: string;
    role: string;
    additional_roles: string[];
    specialization: string;
    hired_at: string;
    is_active: boolean;
    store_branch_id: string;
    is_branch_manager: boolean;
    bio: string;
    is_available: boolean;
  }>>;
  // Only the store owner can promote someone to branch manager —
  // StaffController::staffManagerCrudDenied() 403s a branch_manager caller's
  // request outright if it sets is_branch_manager, even when everything else
  // about the edit is within their own branch. Defaults to false (hide it)
  // rather than true, so a missing prop fails closed, not open.
  readonly isStoreOwner?: boolean;
}

export const ROLE_OPTIONS = [
  { value: 'tailor', label: 'Tailor' },
  { value: 'head_tailor', label: 'Head Tailor' },
  { value: 'cutter', label: 'Cutter' },
  { value: 'seamstress', label: 'Seamstress' },
  { value: 'pattern_maker', label: 'Pattern Maker' },
  { value: 'assistant', label: 'Assistant' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'quality_control', label: 'Quality Checker' },
  { value: 'senior_designer', label: 'Designer' },
  { value: 'cutter_sewer', label: 'Cutter/Sewer' },
];

const LABEL = 'block text-xs font-bold text-ink uppercase tracking-wider mb-1.5';
const FIELD = 'admin-field w-full px-3.5 py-2 text-ink font-semibold focus:outline-none focus:border-taupe text-xs shadow-2xs';
const SECTION = 'text-sm font-black text-ink uppercase tracking-wide';
const REQ = <span className="text-rose-600">*</span>;

function CheckRow({ id, checked, onChange, title, hint }: Readonly<{
  id: string; checked: boolean; onChange: (v: boolean) => void; title: string; hint: string;
}>) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer select-none">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 mt-0.5 rounded border-[#DDD4C9] text-taupe focus:ring-taupe accent-[#8A7063] cursor-pointer"
      />
      <span className="text-xs font-semibold text-ink leading-snug">
        <span>{title}</span>
        <span className="block text-[11px] font-normal text-ink-muted mt-0.5">{hint}</span>
      </span>
    </label>
  );
}

/**
 * Add / edit a staff member. A wide two-column card on tablet and up (who
 * they are + how they sign in on the left, their work and permissions on the
 * right) so the whole form fits on one screen; one column on phones.
 */
export default function StaffFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingId,
  saving,
  formData,
  setFormData,
  isStoreOwner = false,
}: StaffFormModalProps) {
  const { branches } = useBranch();
  const { staffProfile } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  // Only the owner picks a branch. A branch manager can only add or edit
  // staff in their own branch (the API refuses any other), so the field is
  // fixed to it.
  const lockedBranchId = !isStoreOwner && staffProfile?.store_branch_id ? String(staffProfile.store_branch_id) : null;
  const lockedBranch = lockedBranchId ? branches.find(b => String(b.id) === lockedBranchId) : undefined;

  useEffect(() => {
    if (isOpen && lockedBranchId && formData.store_branch_id !== lockedBranchId) {
      setFormData(prev => ({ ...prev, store_branch_id: lockedBranchId }));
    }
  }, [isOpen, lockedBranchId, formData.store_branch_id, setFormData]);

  useEffect(() => { if (!isOpen) setShowPassword(false); }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const canAddRole = formData.additional_roles.length < ROLE_OPTIONS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-form-title"
        className="admin-card rounded-2xl w-full max-w-xl md:max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#EAE3D9] bg-surface shrink-0">
          <div>
            <span className="text-[10px] font-bold text-taupe uppercase tracking-wider block">Staff Directory</span>
            <h2 id="staff-form-title" className="text-lg sm:text-xl font-black text-ink tracking-tight">
              {editingId ? 'Edit Staff Profile' : 'Add Staff Member'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-canvas transition-colors cursor-pointer"
            aria-label="Close"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body: two columns from md up. Scrolls only if the screen is too short. */}
        <form
          id="staff-form"
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-0"
        >
          {/* ── Left: personal + login ── */}
          <div className="md:pr-6">
            <section className="rounded-2xl border-[1.5px] border-[#DDD4C9] bg-canvas/50 p-4 sm:p-5 space-y-4">
              <h3 className={SECTION}>Personal &amp; Account Details</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="staff_name" className={LABEL}>Full Name {REQ}</label>
                  <input id="staff_name" required type="text" name="name" value={formData.name}
                    onChange={handleInputChange} placeholder="e.g. Juan Dela Cruz" className={FIELD} />
                </div>
                <div>
                  <label htmlFor="staff_phone" className={LABEL}>Phone Number</label>
                  <input id="staff_phone" type="text" name="phone" value={formData.phone}
                    onChange={handleInputChange} placeholder="e.g. +63 912 345 6789" className={FIELD} />
                </div>
              </div>

              <div className="admin-card p-4 space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-black text-ink uppercase tracking-wide">
                  <Lock size={14} className="text-taupe" aria-hidden="true" /> Portal Login Access
                </h4>
                <div>
                  <label htmlFor="staff_email" className={LABEL}>Work Email {REQ}</label>
                  <input id="staff_email" required type="email" name="email" value={formData.email}
                    onChange={handleInputChange} placeholder="firstname.lastname@sutura.com" className={FIELD} />
                </div>
                <div>
                  <label htmlFor="staff_password" className={LABEL}>
                    {editingId ? 'Password' : 'Temporary Password'}{' '}
                    {editingId ? <span className="text-[11px] font-normal normal-case tracking-normal text-ink-muted">(leave blank to keep unchanged)</span> : REQ}
                  </label>
                  <div className="relative">
                    <input
                      id="staff_password"
                      required={!editingId}
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder={editingId ? '••••••••' : 'Enter temporary password'}
                      autoComplete="new-password"
                      className={`${FIELD} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-sunken transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {editingId && (
                <div className="space-y-3 pt-1">
                  <CheckRow
                    id="staff_is_active"
                    checked={formData.is_active}
                    onChange={v => setFormData(prev => ({ ...prev, is_active: v }))}
                    title="Active Staff Member"
                    hint="Uncheck to archive/deactivate this staff member (they won't appear in active stage assignment dropdowns)."
                  />
                  <CheckRow
                    id="staff_is_available"
                    checked={formData.is_available}
                    onChange={v => setFormData(prev => ({ ...prev, is_available: v }))}
                    title="Available for New Production Assignments"
                    hint='Uncheck if currently out or on sick leave — displays as "On Leave" without breaking existing active jobs.'
                  />
                </div>
              )}
            </section>
          </div>

          {/* ── Right: work + permissions ── */}
          <div className="space-y-3.5 md:pl-6 md:border-l md:border-[#EAE3D9]">
            <h3 className={SECTION}>Work &amp; Permissions</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="staff_role" className={LABEL}>Tailoring Staff Role {REQ}</label>
                <select id="staff_role" name="role" value={formData.role} onChange={handleInputChange} className={`${FIELD} cursor-pointer`}>
                  {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="staff_hired_at" className={LABEL}>Hire Date {REQ}</label>
                <input id="staff_hired_at" required type="date" name="hired_at" value={formData.hired_at}
                  onChange={handleInputChange} className={`${FIELD} cursor-pointer`} />
              </div>
            </div>

            {/* Secondary roles */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className="text-xs font-bold text-ink uppercase tracking-wider"
                  title="For staff who cover multiple workroom stages (e.g. Head Tailor who also handles Sublimation & Finishing)."
                >
                  Secondary Cross-Trained Roles (Optional)
                </span>
                {canAddRole && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = ROLE_OPTIONS.find(r => r.value !== formData.role && !formData.additional_roles.includes(r.value));
                      if (next) setFormData(prev => ({ ...prev, additional_roles: [...prev.additional_roles, next.value] }));
                    }}
                    className="shrink-0 text-[11px] font-bold text-taupe hover:text-taupe-hover cursor-pointer transition-colors"
                  >
                    + Add another role
                  </button>
                )}
              </div>
              {formData.additional_roles.length === 0 ? (
                <p className="admin-field text-xs text-ink-faint italic bg-canvas/50! px-3.5 py-2">No additional cross-trained roles.</p>
              ) : (
                <div className="space-y-2">
                  {formData.additional_roles.map((role, idx) => (
                    <div key={`staff-role-${role}-${idx}`} className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-ink-muted w-14 shrink-0 font-mono">Rank {idx + 2}</span>
                      <select
                        value={role}
                        aria-label={`Secondary role ${idx + 1}`}
                        onChange={(e) => {
                          const next = [...formData.additional_roles];
                          next[idx] = e.target.value;
                          setFormData(prev => ({ ...prev, additional_roles: next }));
                        }}
                        className={`${FIELD} flex-1 cursor-pointer`}
                      >
                        {ROLE_OPTIONS.filter(r => r.value === role || (r.value !== formData.role && !formData.additional_roles.includes(r.value))).map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, additional_roles: prev.additional_roles.filter((_, i) => i !== idx) }))}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-muted hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        aria-label="Remove this role"
                        title="Remove this role"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="staff_specialization" className={LABEL}>Skills &amp; Specializations (Optional)</label>
              <input id="staff_specialization" type="text" name="specialization" value={formData.specialization}
                onChange={handleInputChange} placeholder="e.g. Bespoke Barong, Bridal Gowns, Pattern Drafting" className={FIELD} />
            </div>

            {lockedBranchId ? (
              <div>
                <p className={LABEL}>Assigned Atelier Branch</p>
                <div className="flex items-center justify-between gap-2 admin-field bg-sunken! px-3.5 py-2 text-xs font-semibold text-ink">
                  <span className="truncate">{lockedBranch?.name ?? 'Your branch'}</span>
                  <Lock size={13} className="text-ink-muted shrink-0" aria-hidden="true" />
                </div>
                <p className="text-[11px] text-ink-muted mt-1">Staff you add join your branch. Only the shop owner can assign other branches.</p>
              </div>
            ) : branches.length > 0 && (
              <div>
                <label htmlFor="staff_branch" className={LABEL}>
                  Assigned Atelier Branch {formData.is_branch_manager && REQ}
                </label>
                <select
                  id="staff_branch"
                  name="store_branch_id"
                  required={formData.is_branch_manager}
                  value={formData.store_branch_id}
                  onChange={handleInputChange}
                  className={`${FIELD} cursor-pointer`}
                >
                  <option value="" disabled={formData.is_branch_manager}>
                    {formData.is_branch_manager ? 'Select a branch…' : 'Unassigned (Works across all branches)'}
                  </option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}{b.is_main ? ' (Main Branch)' : ''}</option>
                  ))}
                </select>
                {formData.is_branch_manager && !formData.store_branch_id && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    A Branch Manager must be assigned to one branch — &quot;Unassigned&quot; would give them access across the whole store.
                  </p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="staff_bio" className={LABEL}>Internal Staff Notes / Bio (Optional)</label>
              <textarea
                id="staff_bio"
                name="bio"
                value={formData.bio}
                onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={2}
                placeholder="e.g. 15 years experience in formal menswear & Barong Tagalog..."
                maxLength={1000}
                className={`${FIELD} resize-none`}
              />
              <p className="text-[11px] text-ink-muted mt-1">Visible only to shop owner and management.</p>
            </div>

            {isStoreOwner && (
              <CheckRow
                id="staff_is_branch_manager"
                checked={formData.is_branch_manager}
                onChange={v => setFormData(prev => ({ ...prev, is_branch_manager: v }))}
                title="Grant Branch Manager Authority"
                hint="Allows collecting customer payments, assigning workroom staff, and updating jobs for their branch."
              />
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-[#EAE3D9] bg-canvas/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="admin-field px-4 py-2 text-xs font-bold text-ink-muted hover:text-ink hover:bg-canvas transition-colors cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="staff-form"
            disabled={saving}
            className="bg-taupe hover:bg-taupe-hover text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 shadow-2xs active:scale-95 cursor-pointer"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Account'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
