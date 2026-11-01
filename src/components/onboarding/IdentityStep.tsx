'use client';

import { StepActions, TextField } from '@/components/store-application/ApplicationFields';
import GenderPicker from '@/components/shared/GenderPicker';
import type { StoreApplicationState } from '@/components/store-application/useStoreApplication';
import type { OwnerFields } from '@/components/store-application/applicationTypes';
import VerificationNotice from './VerificationNotice';

// 18+ only — mirrors the server rule `before:-18 years`.
const MAX_BIRTHDAY = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
})();

/** Step 1 of the wizard: who the owner is. The email is already known from sign-up, so it is not asked again. */
export default function IdentityStep({ app }: { readonly app: StoreApplicationState }) {
  const { owner, setOwner, goTo, setError } = app;
  const bind = (key: keyof OwnerFields) => ({
    value: owner[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setOwner({ ...owner, [key]: e.target.value }),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!owner.gender) { setError('Please choose your gender.'); return; }
        goTo(2);
      }}
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id="id-first" label="First Name" required autoComplete="given-name" placeholder="Juan" {...bind('first_name')} />
        <TextField id="id-last" label="Last Name" required autoComplete="family-name" placeholder="Dela Cruz" {...bind('last_name')} />
        <TextField id="id-middle" label="Middle Name (optional)" autoComplete="additional-name" {...bind('middle_name')} />
        <TextField id="id-suffix" label="Suffix (optional)" placeholder="Jr., Sr., III" {...bind('suffix')} />
        <div className="sm:col-span-2">
          <GenderPicker value={owner.gender} onChange={(gender) => setOwner({ ...owner, gender })} label="Gender" optional={false} />
        </div>
        <TextField id="id-birthday" label="Birth Date" type="date" required max={MAX_BIRTHDAY} {...bind('birthday')} />
        <TextField id="id-phone" label="Phone Number" type="tel" required autoComplete="tel" placeholder="0905 123 4567" {...bind('contact_number')} />
      </div>
      <VerificationNotice />
      <StepActions nextLabel="Continue" />
    </form>
  );
}
