import React, { useState, useRef } from 'react';
import { X, Loader2, ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { useBranch } from '@/context/BranchContext';

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
    shop_branch_id: string;
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
    shop_branch_id: string;
    is_branch_manager: boolean;
    bio: string;
    is_available: boolean;
  }>>;
}

const ROLE_OPTIONS = [
  { value: 'tailor', label: 'Tailor' },
  { value: 'head_tailor', label: 'Head Tailor' },
  { value: 'cutter', label: 'Cutter' },
  { value: 'seamstress', label: 'Seamstress' },
  { value: 'designer', label: 'Fashion Designer' },
  { value: 'pattern_maker', label: 'Pattern Maker' },
  { value: 'assistant', label: 'Assistant' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'quality_control', label: 'Quality Control' },
  { value: 'subcontractor', label: 'Subcontractor (Partner Shop)' },
  { value: 'sublimation_specialist', label: 'Sublimation Specialist' },
  { value: 'senior_designer', label: 'Senior Designer' },
  { value: 'cutter_sewer', label: 'Cutter/Sewer' },
];

export default function StaffFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingId,
  saving,
  formData,
  setFormData,
}: StaffFormModalProps) {
  const { branches } = useBranch();
  const [showPortalSection, setShowPortalSection] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Email + password are collapsed by default so the form reads as a roster
  // entry, not an account signup. They're still required server-side to
  // create a StaffProfile (no login = no record), so a first submit while
  // collapsed reveals the section — but a silent expand with no scroll or
  // focus reads as "nothing happened" to whoever clicked Submit, especially
  // if they'd already scrolled past it filling in Role/Hire Date below.
  // Scrolling the newly-revealed field into view and focusing it removes
  // that "did my click even register?" moment for exactly the kind of user
  // this form was already simplified for.
  const handleFormSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    if (!editingId && !showPortalSection) {
      e.preventDefault();
      setShowPortalSection(true);
      requestAnimationFrame(() => {
        emailInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        emailInputRef.current?.focus();
      });
      return;
    }
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface border border-line rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface shrink-0">
          <div>
            <span className="text-[10px] font-bold text-taupe uppercase tracking-wider block">Artisan Directory</span>
            <h2 className="text-lg sm:text-xl font-black text-ink tracking-tight">
              {editingId ? 'Edit Staff Profile' : 'Create Staff & Artisan Account'}
            </h2>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-canvas transition-colors cursor-pointer"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="staff-form" onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="staff_name" className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                id="staff_name"
                required
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Juan Dela Cruz"
                className="w-full px-3.5 py-2 bg-canvas border border-line rounded-xl text-ink font-semibold focus:outline-none focus:border-taupe text-xs shadow-2xs"
              />
            </div>
            <div>
              <label htmlFor="staff_phone" className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                id="staff_phone"
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g. +63 912 345 6789"
                className="w-full px-3.5 py-2 bg-canvas border border-line rounded-xl text-ink font-semibold focus:outline-none focus:border-taupe text-xs shadow-2xs"
              />
            </div>
          </div>

          {/* Portal Login Credentials Section */}
          <div className="border border-line rounded-xl overflow-hidden bg-canvas/30">
            <button
              type="button"
              onClick={() => setShowPortalSection(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3 bg-canvas/60 hover:bg-canvas transition-colors text-left cursor-pointer"
            >
              <span className="flex items-center gap-2 text-xs font-bold text-ink">
                <Lock size={14} className="text-taupe" />
                Portal Login Access
                {!editingId && <span className="text-[10px] font-normal text-ink-muted">(required for new accounts)</span>}
              </span>
              {showPortalSection ? <ChevronDown size={16} className="text-ink-muted" /> : <ChevronRight size={16} className="text-ink-muted" />}
            </button>

            {showPortalSection && (
              <div className="p-4 space-y-3.5 border-t border-line bg-surface animate-fade-in">
                <p className="text-xs text-ink-muted leading-relaxed">
                  These credentials allow this artisan to log into the SUTURA Staff Portal to view their assigned jobs and workroom schedule.
                </p>
                <div>
                  <label htmlFor="staff_email" className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                    Work Email <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="staff_email"
                    ref={emailInputRef}
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="staff@sutura.com"
                    className="w-full px-3.5 py-2 bg-canvas border border-line rounded-xl text-ink font-semibold focus:outline-none focus:border-taupe text-xs shadow-2xs"
                  />
                </div>

                <div>
                  <label htmlFor="staff_password" className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                    Password {editingId ? <span className="text-[11px] font-normal text-ink-muted">(Leave blank to keep unchanged)</span> : <span className="text-rose-600">*</span>}
                  </label>
                  <input
                    id="staff_password"
                    required={!editingId}
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={editingId ? '••••••••' : 'Enter temporary password'}
                    className="w-full px-3.5 py-2 bg-canvas border border-line rounded-xl text-ink font-semibold focus:outline-none focus:border-taupe text-xs shadow-2xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="staff_role" className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                Primary Craft Role <span className="text-rose-600">*</span>
              </label>
              <select
                id="staff_role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 bg-canvas border border-line rounded-xl text-ink font-semibold focus:outline-none focus:border-taupe text-xs shadow-2xs cursor-pointer"
              >
                {ROLE_OPTIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="staff_hired_at" className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                Hire Date <span className="text-rose-600">*</span>
              </label>
              <input
                id="staff_hired_at"
                required
                type="date"
                name="hired_at"
                value={formData.hired_at}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 bg-canvas border border-line rounded-xl text-ink font-semibold focus:outline-none focus:border-taupe text-xs shadow-2xs cursor-pointer"
              />
            </div>
          </div>

          {/* Additional Secondary Roles */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink uppercase tracking-wider">Secondary Cross-Trained Roles (Optional)</span>
              {formData.additional_roles.length < ROLE_OPTIONS.length - 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const next = ROLE_OPTIONS.find(r => r.value !== formData.role && !formData.additional_roles.includes(r.value));
                    if (next) setFormData(prev => ({ ...prev, additional_roles: [...prev.additional_roles, next.value] }));
                  }}
                  className="text-xs font-bold text-taupe hover:text-taupe-hover cursor-pointer transition-colors"
                >
                  + Add another role
                </button>
              )}
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              For artisans who cover multiple workroom stages (e.g. Head Tailor who also handles Sublimation & Finishing).
            </p>
            {formData.additional_roles.length === 0 ? (
              <p className="text-xs text-ink-faint italic bg-canvas/30 px-3 py-2 rounded-xl border border-line">No additional cross-trained roles.</p>
            ) : (
              <div className="space-y-2">
                {formData.additional_roles.map((role, idx) => (
                  <div key={`staff-role-${role}-${idx}`} className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-ink-muted w-14 shrink-0 font-mono">Rank {idx + 2}</span>
                    <select
                      value={role}
                      onChange={(e) => {
                        const next = [...formData.additional_roles];
                        next[idx] = e.target.value;
                        setFormData(prev => ({ ...prev, additional_roles: next }));
                      }}
                      className="flex-1 px-3.5 py-2 bg-canvas border border-line rounded-xl text-ink font-semibold focus:outline-none focus:border-taupe text-xs shadow-2xs cursor-pointer"
                    >
                      {ROLE_OPTIONS.filter(r => r.value === role || (r.value !== formData.role && !formData.additional_roles.includes(r.value))).map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, additional_roles: prev.additional_roles.filter((_, i) => i !== idx) }))}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-muted hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
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
            <label htmlFor="staff_specialization" className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
              Skills & Specializations
            </label>
            <input
              id="staff_specialization"
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleInputChange}
              placeholder="e.g. Bespoke Barong, Bridal Gowns, Pattern Drafting (comma-separated)"
              className="w-full px-3.5 py-2 bg-canvas border border-line rounded-xl text-ink font-semibold focus:outline-none focus:border-taupe text-xs shadow-2xs"
            />
          </div>

          <div>
            <label htmlFor="staff_bio" className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
              Internal Artisan Notes / Bio
            </label>
            <textarea
              id="staff_bio"
              name="bio"
              value={formData.bio}
              onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={2}
              placeholder="e.g. 15 years experience in formal menswear & Barong Tagalog..."
              maxLength={1000}
              className="w-full px-3.5 py-2 bg-canvas border border-line rounded-xl text-ink font-semibold focus:outline-none focus:border-taupe text-xs shadow-2xs resize-none"
            />
            <p className="text-[11px] text-ink-muted mt-1">Visible only to shop owner and management.</p>
          </div>

          {branches.length > 0 && (
            <div>
              <label htmlFor="staff_branch" className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                Assigned Atelier Branch
              </label>
              <select
                id="staff_branch"
                name="shop_branch_id"
                value={formData.shop_branch_id}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 bg-canvas border border-line rounded-xl text-ink font-semibold focus:outline-none focus:border-taupe text-xs shadow-2xs cursor-pointer"
              >
                <option value="">Unassigned (Artisan works across all branches)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}{b.is_main ? ' (Main Branch)' : ''}</option>
                ))}
              </select>
            </div>
          )}

          {/* Manager & Status Checkboxes */}
          <div className="space-y-3 pt-2 border-t border-line/70">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                id="staff_is_branch_manager"
                type="checkbox"
                checked={formData.is_branch_manager}
                onChange={e => setFormData(prev => ({ ...prev, is_branch_manager: e.target.checked }))}
                className="w-4 h-4 mt-0.5 rounded border-line text-taupe focus:ring-taupe accent-[#8A7063] cursor-pointer"
              />
              <span className="text-xs font-semibold text-ink leading-snug">
                <span>Grant Branch Manager Authority</span>
                <span className="block text-[11px] font-normal text-ink-muted mt-0.5">
                  Allows collecting customer payments, assigning workroom staff, and updating jobs for their branch.
                </span>
              </span>
            </label>

            {editingId && (
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  id="staff_is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 mt-0.5 rounded border-line text-taupe focus:ring-taupe accent-[#8A7063] cursor-pointer"
                />
                <span className="text-xs font-semibold text-ink leading-snug">
                  <span>Active Staff Member</span>
                  <span className="block text-[11px] font-normal text-ink-muted mt-0.5">
                    Uncheck to archive/deactivate this staff member (they won&apos;t appear in active stage assignment dropdowns).
                  </span>
                </span>
              </label>
            )}

            {editingId && (
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  id="staff_is_available"
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={e => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                  className="w-4 h-4 mt-0.5 rounded border-line text-taupe focus:ring-taupe accent-[#8A7063] cursor-pointer"
                />
                <span className="text-xs font-semibold text-ink leading-snug">
                  <span>Available for New Production Assignments</span>
                  <span className="block text-[11px] font-normal text-ink-muted mt-0.5">
                    Uncheck if currently out or on sick leave — displays as &quot;On Leave&quot; without breaking existing active jobs.
                  </span>
                </span>
              </label>
            )}
          </div>
        </form>

        {/* Sticky Footer with Save/Cancel */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-line bg-canvas/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-ink-muted hover:text-ink hover:bg-canvas border border-line transition-colors cursor-pointer shadow-2xs"
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
            <span>
              {(() => {
                if (saving) return 'Saving...';
                if (editingId) return 'Save Changes';
                return 'Create Account';
              })()}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
