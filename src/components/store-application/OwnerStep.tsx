'use client';

import { useState } from 'react';
import { cleanName, nameError as checkName, NAME_HINT } from '@/lib/nameRules';
import { ageFrom } from '@/lib/age';
import { StepActions, TextField, type FieldStatus } from './ApplicationFields';
import type { StoreApplicationState } from './useStoreApplication';
import type { OwnerFields } from './applicationTypes';
import { EMAIL_PATTERN, PH_MOBILE_PATTERN, useAvailabilityCheck, type AvailabilityState } from './useAvailabilityCheck';

// 18+ only — mirrors StoreApplicationRequest's `before:-18 years`.
const MAX_BIRTHDAY = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
})();

const isEmail = (v: string) => EMAIL_PATTERN.test(v);

/** Age shown under Date of Birth; red when under 18 (the server requires 18+). */
export function ageStatus(birthday: string): FieldStatus | null {
  const age = ageFrom(birthday);
  if (age === null) return birthday ? { tone: 'error', message: 'Enter a valid date of birth.' } : null;
  return age < 18
    ? { tone: 'error', message: `Age: ${age}. The shop owner must be at least 18 years old.` }
    : { tone: 'muted', message: `Age: ${age} years old` };
}

// Names: shared rule (lib/nameRules), same as the server.
type NameKey = 'first_name' | 'middle_name' | 'last_name' | 'suffix';
const REQUIRED_NAMES: NameKey[] = ['first_name', 'last_name'];
const nameError = (key: NameKey, value: string) => checkName(value, REQUIRED_NAMES.includes(key));
const isMobile = (v: string) => PH_MOBILE_PATTERN.test(v);

function statusFor(state: AvailabilityState, kind: 'Email' | 'Contact number', formatHint: string): FieldStatus | null {
  switch (state) {
    case 'taken': return { tone: 'error', message: `This ${kind.toLowerCase()} is already registered` };
    case 'available': return { tone: 'success', message: `${kind} is available` };
    case 'invalid': return { tone: 'muted', message: formatHint };
    case 'checking': return { tone: 'muted', message: 'Checking…' };
    case 'error': return { tone: 'muted', message: 'Couldn’t check right now — we’ll check again when you submit.' };
    default: return null;
  }
}

// No password here: the System Admin issues the shop's login on approval
// and emails it to the address below, so a shop sign-in never reuses (or
// collides with) the owner's personal customer account.
export default function OwnerStep({ app }: { readonly app: StoreApplicationState }) {
  const { owner, setOwner, goTo } = app;
  const bind = (key: keyof OwnerFields) => ({
    value: owner[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setOwner({ ...owner, [key]: e.target.value }),
  });

  // Name fields drop digits and symbols as they're typed or pasted; a short
  // note explains why when something was removed, and the rule is re-checked
  // on Continue (and by the server).
  const [nameNotes, setNameNotes] = useState<Partial<Record<NameKey, string>>>({});
  const nameField = (key: NameKey) => {
    const error = nameError(key, owner[key]);
    const note = error || nameNotes[key] || '';
    return {
      value: owner[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, changed } = cleanName(e.target.value);
        setNameNotes((n) => ({ ...n, [key]: changed ? NAME_HINT : '' }));
        setOwner({ ...owner, [key]: value });
      },
      onBlur: () => setOwner({ ...owner, [key]: owner[key].trim() }),
      status: note ? ({ tone: 'error', message: note } as FieldStatus) : null,
    };
  };
  const namesValid = (['first_name', 'middle_name', 'last_name', 'suffix'] as NameKey[]).every((k) => !nameError(k, owner[k]));

  // Live "already registered?" checks (another shop already uses it).
  const email = useAvailabilityCheck('email', owner.email, isEmail);
  const phone = useAvailabilityCheck('contact_number', owner.contact_number, isMobile);

  // Can't continue while either is taken, badly formatted, or still being checked.
  const blocked = (s: AvailabilityState) => s === 'taken' || s === 'checking' || s === 'invalid';
  const canContinue = !blocked(email.state) && !blocked(phone.state);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!namesValid) return;
        if (!isMobile(owner.contact_number.trim())) { phone.checkNow(); return; }
        if (!isEmail(owner.email.trim())) { email.checkNow(); return; }
        if (canContinue) goTo(2);
      }}
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id="app-first" label="First Name" required autoComplete="given-name" maxLength={100} {...nameField('first_name')} />
        <TextField id="app-middle" label="Middle Name (optional)" autoComplete="additional-name" maxLength={100} {...nameField('middle_name')} />
        <TextField id="app-last" label="Last Name" required autoComplete="family-name" maxLength={100} {...nameField('last_name')} />
        <TextField id="app-suffix" label="Suffix (Jr., Sr.) (optional)" maxLength={20} {...nameField('suffix')} />
        <TextField id="app-birthday" label="Date of Birth" type="date" required max={MAX_BIRTHDAY} {...bind('birthday')} status={ageStatus(owner.birthday)} />
        <TextField
          id="app-phone"
          label="Contact Number"
          type="tel"
          inputMode="numeric"
          required
          maxLength={11}
          placeholder="09XXXXXXXXX"
          autoComplete="tel"
          value={owner.contact_number}
          // Digits only.
          onChange={(e) => setOwner({ ...owner, contact_number: e.target.value.replace(/\D/g, '').slice(0, 11) })}
          onBlur={phone.checkNow}
          status={statusFor(phone.state, 'Contact number', 'Enter 11 digits starting with 09, e.g. 09663946888.')}
        />
      </div>

      <div className="border-t border-line pt-5 space-y-2">
        <TextField
          id="app-email"
          label="Your Email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@gmail.com"
          {...bind('email')}
          onBlur={email.checkNow}
          status={statusFor(email.state, 'Email', 'Enter a valid email address, e.g. you@gmail.com.')}
        />
        <p className="mobile-body-sm text-ink-muted">
          Once your shop is approved, we&apos;ll send your shop login and a temporary password here. It can be the same
          email you use as a customer.
        </p>
      </div>

      <StepActions nextLabel="Continue" busy={!canContinue || !namesValid} />
    </form>
  );
}
