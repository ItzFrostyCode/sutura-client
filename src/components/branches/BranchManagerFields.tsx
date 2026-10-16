import React from 'react';
import type { BranchFormData } from '@/components/branches/branchHelpers';

interface BranchManagerFieldsProps {
  readonly formData: BranchFormData;
  readonly setFormData: React.Dispatch<React.SetStateAction<BranchFormData>>;
}

const input = 'w-full min-h-12 px-4 bg-canvas border border-line text-ink focus:outline-none focus:border-taupe text-base';

/** The owner makes the branch manager's login here. The manager then adds their own staff and runs the branch. */
export default function BranchManagerFields({ formData, setFormData }: BranchManagerFieldsProps) {
  const set = (key: keyof BranchFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [key]: e.target.value }));
  const touched = !!(formData.manager_name || formData.manager_email || formData.manager_password);

  return (
    <fieldset className="space-y-3">
      <legend className="block text-sm font-medium text-ink-body mb-1">Branch manager</legend>
      <p className="text-xs text-ink-muted">
        {formData.manager_current
          ? `Managed by ${formData.manager_current}. Fill this in only to replace them.`
          : 'Make the login for the person who will run this branch. They add their own staff and set up the branch page customers see.'}
      </p>
      <input className={input} placeholder="Full name" autoComplete="off" value={formData.manager_name} onChange={set('manager_name')} required={touched} />
      <input className={input} type="email" placeholder="Email (used to log in)" autoComplete="off" value={formData.manager_email} onChange={set('manager_email')} required={touched} />
      <input className={input} placeholder="Phone (optional)" autoComplete="off" value={formData.manager_phone} onChange={set('manager_phone')} />
      <input className={input} type="password" placeholder="Password (at least 8 characters)" autoComplete="new-password" minLength={8} value={formData.manager_password} onChange={set('manager_password')} required={touched} />
    </fieldset>
  );
}
