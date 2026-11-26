'use client';

import { useEffect, useRef, useState } from 'react';
import { cleanName, nameError as checkName, NAME_HINT } from '@/lib/nameRules';
import { ageFrom } from '@/lib/age';
import { enterMovesOn, Group, revealFirstProblem, StepActions, TextField, type FieldStatus } from './ApplicationFields';
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

  // Live "already registered?" checks (another shop already uses it).
  const email = useAvailabilityCheck('email', owner.email, isEmail);
  const phone = useAvailabilityCheck('contact_number', owner.contact_number, isMobile);

  // Every problem on this step, keyed by the field's element id.
  const ownerErrors = (): Record<string, string> => {
    const e: Record<string, string> = {};
    const ids: Record<NameKey, string> = { first_name: 'app-first', middle_name: 'app-middle', last_name: 'app-last', suffix: 'app-suffix' };
    (Object.keys(ids) as NameKey[]).forEach((k) => {
      const problem = nameError(k, owner[k]) || (REQUIRED_NAMES.includes(k) && !owner[k].trim() ? `Enter your ${k === 'first_name' ? 'first' : 'last'} name.` : '');
      if (problem) e[ids[k]] = problem;
    });
    const age = ageStatus(owner.birthday);
    if (!owner.birthday) e['app-birthday'] = 'Enter your date of birth.';
    else if (age?.tone === 'error') e['app-birthday'] = age.message;
    if (!isMobile(owner.contact_number.trim())) e['app-phone'] = 'Enter 11 digits starting with 09, e.g. 09663946888.';
    else if (phone.state === 'taken') e['app-phone'] = 'This contact number is already registered to another shop.';
    if (!isEmail(owner.email.trim())) e['app-email'] = 'Enter a valid email address, e.g. you@gmail.com.';
    else if (email.state === 'taken') e['app-email'] = 'This email is already registered to another shop.';
    return e;
  };
  const [tried, setTried] = useState(false);
  const errors: Record<string, string> = { ...app.serverErrors, ...(tried ? ownerErrors() : {}) };

  // Continue while a "registered already?" check is still running: wait for its answer, then go on.
  const [waiting, setWaiting] = useState(false);
  const waits = useRef(0);
  const next = () => {
    app.clearServerErrors();
    setTried(true);
    const problems = ownerErrors();
    if (Object.keys(problems).length > 0) { setWaiting(false); revealFirstProblem(Object.keys(problems)); return; }
    const pending = (s: AvailabilityState) => s === 'checking' || s === 'idle';
    if ((pending(email.state) || pending(phone.state)) && waits.current < 3) {
      waits.current += 1;
      if (email.state === 'idle') email.checkNow();
      if (phone.state === 'idle') phone.checkNow();
      setWaiting(true);
      return;
    }
    // A check that couldn't run ('error') doesn't block: the server checks again on submit.
    waits.current = 0;
    setWaiting(false);
    goTo(2);
  };
  useEffect(() => {
    if (waiting && email.state !== 'checking' && phone.state !== 'checking') next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waiting, email.state, phone.state]);

  return (
    <form
      noValidate
      onKeyDown={enterMovesOn}
      onSubmit={(e) => { e.preventDefault(); waits.current = 0; next(); }}
      className="space-y-7"
    >
      <Group title="Personal details">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField id="app-first" label="First name" required autoComplete="given-name" maxLength={100} {...nameField('first_name')} error={errors['app-first']} />
          <TextField id="app-middle" label="Middle name" optional autoComplete="additional-name" maxLength={100} {...nameField('middle_name')} error={errors['app-middle']} />
          <TextField id="app-last" label="Last name" required autoComplete="family-name" maxLength={100} {...nameField('last_name')} error={errors['app-last']} />
          <TextField id="app-suffix" label="Suffix" optional placeholder="Jr., Sr., III" maxLength={20} {...nameField('suffix')} error={errors['app-suffix']} />
          <TextField id="app-birthday" label="Date of birth" type="date" required max={MAX_BIRTHDAY} {...bind('birthday')} status={ageStatus(owner.birthday)} error={errors['app-birthday']} />
          <TextField
            id="app-phone"
            label="Mobile number"
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
            error={errors['app-phone']}
          />
        </div>
      </Group>

      <Group
        title="Email"
        footer="Once your shop is approved, we’ll send your shop login and a temporary password here. It can be the same email you use as a customer."
      >
        <TextField
          id="app-email"
          label="Email address"
          type="email"
          required
          autoComplete="email"
          placeholder="you@gmail.com"
          {...bind('email')}
          onBlur={email.checkNow}
          status={statusFor(email.state, 'Email', 'Enter a valid email address, e.g. you@gmail.com.')}
          error={errors['app-email']}
        />
      </Group>

      {/* Never greyed out for a missing answer: pressing it shows what is left. */}
      <StepActions nextLabel={waiting ? 'Checking…' : 'Continue'} busy={waiting} />
    </form>
  );
}
