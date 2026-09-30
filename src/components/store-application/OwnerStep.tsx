'use client';

import { StepActions, TextField } from './ApplicationFields';
import type { StoreApplicationState } from './useStoreApplication';
import type { OwnerFields } from './applicationTypes';

// 18+ only — mirrors StoreApplicationRequest's `before:-18 years`.
const MAX_BIRTHDAY = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
})();

// No password here: the System Admin issues the shop's login on approval
// and emails it to the address below, so a shop sign-in never reuses (or
// collides with) the owner's personal customer account.
export default function OwnerStep({ app }: { readonly app: StoreApplicationState }) {
  const { owner, setOwner, goTo } = app;
  const bind = (key: keyof OwnerFields) => ({
    value: owner[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setOwner({ ...owner, [key]: e.target.value }),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); goTo(2); }} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id="app-first" label="First Name" required autoComplete="given-name" {...bind('first_name')} />
        <TextField id="app-middle" label="Middle Name" autoComplete="additional-name" {...bind('middle_name')} />
        <TextField id="app-last" label="Last Name" required autoComplete="family-name" {...bind('last_name')} />
        <TextField id="app-suffix" label="Suffix (Jr., Sr.)" {...bind('suffix')} />
        <TextField id="app-birthday" label="Date of Birth" type="date" required max={MAX_BIRTHDAY} {...bind('birthday')} />
        <TextField id="app-phone" label="Contact Number" type="tel" required placeholder="09XX XXX XXXX" autoComplete="tel" {...bind('contact_number')} />
      </div>

      <div className="border-t border-line pt-5 space-y-2">
        <TextField id="app-email" label="Your Email" type="email" required autoComplete="email" placeholder="you@gmail.com" {...bind('email')} />
        <p className="mobile-body-sm text-ink-muted">
          Once your shop is approved, we&apos;ll send your shop login and a temporary password here. It can be the same
          email you use as a customer.
        </p>
      </div>

      <StepActions nextLabel="Continue" />
    </form>
  );
}
