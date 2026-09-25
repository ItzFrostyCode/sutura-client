import React from 'react';
import { Loader2, Save } from 'lucide-react';

interface PersonalTabProps {
  readonly personalForm: { name: string; phone: string };
  readonly setPersonalForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string }>>;
  readonly personalErrors: { name?: string; phone?: string };
  readonly setPersonalErrors: React.Dispatch<React.SetStateAction<{ name?: string; phone?: string }>>;
  readonly handlePersonalSubmit: (e: React.SyntheticEvent) => void;
  readonly loadingPersonal: boolean;
  readonly userEmail: string;
}

export default function PersonalTab({
  personalForm,
  setPersonalForm,
  personalErrors,
  setPersonalErrors,
  handlePersonalSubmit,
  loadingPersonal,
  userEmail,
}: Readonly<PersonalTabProps>) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-6 animate-in fade-in duration-200">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-ink">Personal Details</h2>
        <p className="text-xs text-ink-faint mt-0.5">
          These details are shown on your profile and used for communication.
        </p>
      </div>

      <form onSubmit={handlePersonalSubmit} className="space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="full_name" className="block text-sm font-medium text-ink-body">
            Full Name
          </label>
          <input
            id="full_name"
            type="text"
            value={personalForm.name}
            onChange={(e) => {
              setPersonalForm({ ...personalForm, name: e.target.value });
              if (personalErrors.name) setPersonalErrors((prev) => ({ ...prev, name: undefined }));
            }}
            className={`w-full px-4 py-2.5 bg-canvas border rounded-xl text-ink text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-taupe/20 ${
              personalErrors.name ? 'border-danger bg-danger/5' : 'border-line focus:border-taupe'
            }`}
            placeholder="Your full name"
          />
          {personalErrors.name && (
            <p className="text-xs text-danger mt-1">{personalErrors.name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <label htmlFor="email_address" className="block text-sm font-medium text-ink-body">
              Email Address
            </label>
            <input
              id="email_address"
              type="email"
              value={userEmail}
              disabled
              className="w-full px-4 py-2.5 bg-canvas border border-line rounded-xl text-ink-faint cursor-not-allowed text-sm"
            />
            <p className="text-[11px] text-ink-faint">Email cannot be changed.</p>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label htmlFor="phone_number" className="block text-sm font-medium text-ink-body">
              Phone Number
            </label>
            <input
              id="phone_number"
              type="text"
              value={personalForm.phone}
              onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
              className={`w-full px-4 py-2.5 bg-canvas border rounded-xl text-ink text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-taupe/20 ${
                personalErrors.phone ? 'border-danger bg-danger/5' : 'border-line focus:border-taupe'
              }`}
              placeholder="+63 9XX XXX XXXX"
            />
            {personalErrors.phone && (
              <p className="text-xs text-danger mt-1">{personalErrors.phone}</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-line flex justify-end mt-6">
          <button
            type="submit"
            disabled={loadingPersonal}
            className="bg-taupe hover:bg-[#8a7065] text-white px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-sm cursor-pointer"
          >
            {loadingPersonal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={15} />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
