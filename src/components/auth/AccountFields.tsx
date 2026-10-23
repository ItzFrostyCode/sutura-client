'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';
import GenderPicker, { type Gender } from '@/components/shared/GenderPicker';
import { PLAIN_FIELD, PLAIN_LABEL } from '@/components/shared/plainForm';
import { PASSWORD_RULES } from '@/lib/passwordRules';

export interface AccountValues {
  name: string;
  gender: Gender | '';
  email: string;
  password: string;
  password_confirmation: string;
}

interface AccountFieldsProps {
  readonly values: AccountValues;
  readonly onChange: (next: Partial<AccountValues>) => void;
  /** Extra context placed after the name/gender row, before email. */
  readonly after?: React.ReactNode;
  /** Override id prefix to avoid collisions when rendered twice on a page. */
  readonly idPrefix?: string;
}

/**
 * Full name, Gender (optional), Email, Password + Confirm — same fields,
 * validation and show/hide as the customer Sign Up page.  Extracted so Add
 * Staff and Add Branch can reuse them without duplicating the password-rules
 * checklist or the show/hide toggle.
 */
export default function AccountFields({
  values,
  onChange,
  after,
  idPrefix = 'acct',
}: AccountFieldsProps) {
  const [show, setShow] = useState(false);
  const p = (k: string) => `${idPrefix}-${k}`;

  return (
    <div className="space-y-5">
      {/* Full name */}
      <div>
        <label htmlFor={p('name')} className={PLAIN_LABEL}>
          Full Name <span className="text-danger">*</span>
        </label>
        <input
          id={p('name')}
          type="text"
          required
          value={values.name}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g. Maria Santos"
          autoComplete="name"
          className={PLAIN_FIELD}
        />
      </div>

      {/* Gender (optional) */}
      <GenderPicker
        value={values.gender}
        onChange={gender => onChange({ gender })}
        optional
      />

      {after}

      {/* Email */}
      <div>
        <label htmlFor={p('email')} className={PLAIN_LABEL}>
          Email <span className="text-danger">*</span>
        </label>
        <input
          id={p('email')}
          type="email"
          required
          value={values.email}
          onChange={e => onChange({ email: e.target.value })}
          placeholder="e.g. maria@gmail.com"
          autoComplete="email"
          className={PLAIN_FIELD}
        />
      </div>

      {/* Password */}
      <div>
        <div className="relative">
          <label htmlFor={p('password')} className={PLAIN_LABEL}>
            Password <span className="text-danger">*</span>
          </label>
          <input
            id={p('password')}
            type={show ? 'text' : 'password'}
            required
            value={values.password}
            onChange={e => onChange({ password: e.target.value })}
            autoComplete="new-password"
            className={`${PLAIN_FIELD} pr-16`}
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3.5 bottom-2.5 text-sm text-espresso underline underline-offset-2"
          >
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
        <ul className="mt-3 space-y-1.5">
          {PASSWORD_RULES.map(rule => {
            const met = rule.test(values.password);
            return (
              <li key={rule.key} className="flex items-center gap-2 text-xs">
                <span
                  className={`shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    met ? 'bg-espresso border-espresso text-white' : 'border-line-strong text-transparent'
                  }`}
                >
                  <Check size={10} strokeWidth={3} />
                </span>
                <span className={met ? 'text-ink' : 'text-ink-faint'}>{rule.label}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor={p('confirm')} className={PLAIN_LABEL}>
          Confirm Password <span className="text-danger">*</span>
        </label>
        <input
          id={p('confirm')}
          type={show ? 'text' : 'password'}
          required
          value={values.password_confirmation}
          onChange={e => onChange({ password_confirmation: e.target.value })}
          autoComplete="new-password"
          className={PLAIN_FIELD}
        />
        {values.password_confirmation && values.password !== values.password_confirmation && (
          <p className="mt-1.5 text-xs text-danger">Passwords do not match.</p>
        )}
      </div>
    </div>
  );
}
