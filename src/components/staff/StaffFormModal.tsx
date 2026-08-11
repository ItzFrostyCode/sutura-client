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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white border border-[#EBE6E0] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#EBE6E0]">
          <h2 className="text-xl font-bold text-[#2D2A26]">
            {editingId ? 'Edit Staff Member' : 'Create Staff Account'}
          </h2>
          <button onClick={onClose} className="text-[#827A73] hover:text-[#2D2A26] transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="staff_name" className="block text-sm font-medium text-[#524A44] mb-1">
                Name
              </label>
              <input
                id="staff_name"
                required
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
              />
            </div>
            <div>
              <label htmlFor="staff_phone" className="block text-sm font-medium text-[#524A44] mb-1">
                Phone Number
              </label>
              <input
                id="staff_phone"
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
              />
            </div>
          </div>

          <div className="border border-[#EBE6E0] rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPortalSection(p => !p)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-[#FAF6F3] hover:bg-[#F0EAE3] transition-colors text-left"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-[#524A44]">
                <Lock size={14} className="text-[#A8A19A]" />
                Portal Login Access
                {!editingId && <span className="text-xs font-normal text-[#A8A19A]">(required)</span>}
              </span>
              {showPortalSection ? <ChevronDown size={16} className="text-[#827A73]" /> : <ChevronRight size={16} className="text-[#827A73]" />}
            </button>

            {showPortalSection && (
              <div className="p-4 space-y-4 border-t border-[#EBE6E0]">
                <p className="text-xs text-[#A8A19A] -mt-1">
                  This email and password let the staff member log in to view their own assigned jobs and schedule.
                </p>
                <div>
                  <label htmlFor="staff_email" className="block text-sm font-medium text-[#524A44] mb-1">
                    Email
                  </label>
                  <input
                    id="staff_email"
                    ref={emailInputRef}
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="staff_password" className="block text-sm font-medium text-[#524A44] mb-1">
                    Password{editingId ? <>{' '}<span className="text-xs text-[#A8A19A]">(Leave blank to keep current)</span></> : null}
                  </label>
                  <input
                    id="staff_password"
                    required={!editingId}
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="staff_role" className="block text-sm font-medium text-[#524A44] mb-1">
                Role
              </label>
              <select
                id="staff_role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
              >
                {ROLE_OPTIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="staff_hired_at" className="block text-sm font-medium text-[#524A44] mb-1">
                Hire Date
              </label>
              <input
                id="staff_hired_at"
                required
                type="date"
                name="hired_at"
                value={formData.hired_at}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="block text-sm font-medium text-[#524A44]">Additional Roles (Optional)</span>
              {formData.additional_roles.length < ROLE_OPTIONS.length - 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const next = ROLE_OPTIONS.find(r => r.value !== formData.role && !formData.additional_roles.includes(r.value));
                    if (next) setFormData(prev => ({ ...prev, additional_roles: [...prev.additional_roles, next.value] }));
                  }}
                  className="text-xs font-medium text-taupe hover:text-taupe/80 transition-colors"
                >
                  + Add another role
                </button>
              )}
            </div>
            <p className="text-xs text-[#A8A19A] mb-2">
              For a staff member who covers more than one role (e.g. a head tailor who also does sublimation work) — instead of a separate account per role. Listed in order: first is their 2nd role overall, then 3rd, and so on.
            </p>
            {formData.additional_roles.length === 0 ? (
              <p className="text-xs text-[#A8A19A] italic">No additional roles added.</p>
            ) : (
              <div className="space-y-2">
                {formData.additional_roles.map((role, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#A8A19A] w-14 shrink-0">Rank {idx + 2}</span>
                    <select
                      value={role}
                      onChange={(e) => {
                        const next = [...formData.additional_roles];
                        next[idx] = e.target.value;
                        setFormData(prev => ({ ...prev, additional_roles: next }));
                      }}
                      className="flex-1 px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
                    >
                      {ROLE_OPTIONS.filter(r => r.value === role || (r.value !== formData.role && !formData.additional_roles.includes(r.value))).map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, additional_roles: prev.additional_roles.filter((_, i) => i !== idx) }))}
                      className="text-[#A8A19A] hover:text-[#B26959] transition-colors"
                      title="Remove this role"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="staff_specialization" className="block text-sm font-medium text-[#524A44] mb-1">
              Specialization (Optional)
            </label>
            <input
              id="staff_specialization"
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleInputChange}
              placeholder="e.g. Suits, Gowns, Alterations (comma-separated)"
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
            />
          </div>

          <div>
            <label htmlFor="staff_bio" className="block text-sm font-medium text-[#524A44] mb-1">
              Bio (Optional)
            </label>
            <textarea
              id="staff_bio"
              name="bio"
              value={formData.bio}
              onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={3}
              placeholder="e.g. 15 years in bespoke suits, specializes in barong and formal wear"
              maxLength={1000}
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm resize-none"
            />
            <p className="text-xs text-[#A8A19A] mt-1">Only visible to you on this staff member&apos;s profile — never shown to customers.</p>
          </div>

          {branches.length > 0 && (
            <div>
              <label htmlFor="staff_branch" className="block text-sm font-medium text-[#524A44] mb-1">
                Assigned Branch
              </label>
              <select
                id="staff_branch"
                name="shop_branch_id"
                value={formData.shop_branch_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
              >
                <option value="">Unassigned (works across all branches)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}{b.is_main ? ' (Main)' : ''}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <input
              id="staff_is_branch_manager"
              type="checkbox"
              checked={formData.is_branch_manager}
              onChange={e => setFormData(prev => ({ ...prev, is_branch_manager: e.target.checked }))}
              className="w-4 h-4 rounded border-[#EBE6E0] text-taupe focus:ring-taupe"
            />
            <label htmlFor="staff_is_branch_manager" className="text-sm font-medium text-[#524A44]">
              Make Branch Manager{' '}
              <span className="block text-xs font-normal text-[#A8A19A]">
                Can collect payments, assign staff, and manage job orders for their branch without owner access.
              </span>
            </label>
          </div>

          {/* Active toggle — only shown when editing */}
          {editingId && (
            <div className="flex items-center gap-3 pt-1">
              <input
                id="staff_is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 rounded border-[#EBE6E0] text-taupe focus:ring-taupe"
              />
              <label htmlFor="staff_is_active" className="text-sm font-medium text-[#524A44]">
                Active Staff Member{' '}
                <span className="block text-xs font-normal text-[#A8A19A]">
                  Uncheck to mark as inactive (they won&apos;t appear in job assignment lists)
                </span>
              </label>
            </div>
          )}

          {/* Available toggle — separate from Active: this is a temporary
              "on leave / out today" flag, not an offboarding one. Staff can
              also toggle their own via Account Settings; this lets the owner
              set it on their behalf too (e.g. logging a sick day for them). */}
          {editingId && (
            <div className="flex items-center gap-3 pt-1">
              <input
                id="staff_is_available"
                type="checkbox"
                checked={formData.is_available}
                onChange={e => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                className="w-4 h-4 rounded border-[#EBE6E0] text-taupe focus:ring-taupe"
              />
              <label htmlFor="staff_is_available" className="text-sm font-medium text-[#524A44]">
                Available for New Assignments{' '}
                <span className="block text-xs font-normal text-[#A8A19A]">
                  Uncheck if they&apos;re currently on leave or out — shows as &quot;On Leave&quot; on the staff list, doesn&apos;t block existing job assignments.
                </span>
              </label>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-[#827A73] hover:text-[#2D2A26] transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-taupe hover:bg-taupe/90 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {!saving && (editingId ? 'Save Changes' : 'Create Account')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
