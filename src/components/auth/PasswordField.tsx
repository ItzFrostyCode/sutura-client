'use client';

import { FIELD, LABEL, SHOW_BTN } from './authStyles';
import PasswordChecklist from '@/components/shop-auth/PasswordChecklist';

interface PasswordFieldProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly shown: boolean;
  /** Pass to put the Show / Hide toggle on this field (one toggle reveals both password fields). */
  readonly onToggle?: () => void;
  readonly autoComplete: 'current-password' | 'new-password';
  readonly disabled?: boolean;
  /** Shows the live password rules under the field. */
  readonly withRules?: boolean;
  /** For a "confirm" field: the password it must match; shows "Passwords match" / "do not match yet". */
  readonly matchWith?: string;
}

/** The one password input: 48px, 16px text, Show / Hide as a word (clearer than an eye icon), rules and match hint below. */
export default function PasswordField({ id, label, value, onChange, shown, onToggle, autoComplete, disabled, withRules, matchWith }: PasswordFieldProps) {
  const checkMatch = matchWith !== undefined && value.length > 0;
  const matches = checkMatch && value === matchWith;
  return (
    <div>
      <div className="relative">
        <label htmlFor={id} className={LABEL}>{label}<span className="text-danger">*</span></label>
        <input
          id={id}
          type={shown ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-invalid={checkMatch && !matches ? true : undefined}
          aria-describedby={checkMatch ? `${id}-match` : withRules ? `${id}-rules` : undefined}
          className={`${FIELD} ${onToggle ? 'pr-20' : ''}`}
          required
        />
        {onToggle && (
          <button type="button" onClick={onToggle} aria-controls={id} aria-pressed={shown} className={SHOW_BTN}>
            {shown ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {withRules && <div id={`${id}-rules`}><PasswordChecklist password={value} /></div>}
      {checkMatch && (
        <p id={`${id}-match`} aria-live="polite" className={`mt-1.5 text-sm ${matches ? 'text-sage' : 'text-danger'}`}>
          {matches ? 'Passwords match' : 'Passwords do not match yet'}
        </p>
      )}
    </div>
  );
}
