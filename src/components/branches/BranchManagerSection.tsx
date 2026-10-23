'use client';

import React from 'react';
import AccountFields, { type AccountValues } from '@/components/auth/AccountFields';
import { PLAIN_FIELD, PLAIN_LABEL } from '@/components/shared/plainForm';
import type { Staff } from '@/components/staff/staffHelpers';

interface BranchManagerSectionProps {
  readonly mode: 'new' | 'pick' | 'none';
  readonly onMode: (m: 'new' | 'pick' | 'none') => void;
  readonly newAccount: AccountValues;
  readonly onNewAccount: (delta: Partial<AccountValues>) => void;
  /** Staff members who don't already manage a branch. */
  readonly availableStaff: Staff[];
  readonly pickedStaffId: string;
  readonly onPickedStaffId: (id: string) => void;
  readonly idPrefix?: string;
}

const RADIO = 'flex items-start gap-3 cursor-pointer select-none group';
const RADIO_DOT =
  'mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-espresso/30 flex items-center justify-center transition-colors group-has-[:checked]:border-espresso';

/**
 * The "Branch manager" section for Add Branch and Assign Manager pages.
 * Three choices as radios:
 *   1. Create a new account → shows AccountFields
 *   2. Pick an existing staff member → shows a select
 *   3. No manager yet → nothing else
 */
export default function BranchManagerSection({
  mode,
  onMode,
  newAccount,
  onNewAccount,
  availableStaff,
  pickedStaffId,
  onPickedStaffId,
  idPrefix = 'bm',
}: BranchManagerSectionProps) {
  const p = (k: string) => `${idPrefix}-${k}`;

  return (
    <fieldset className="space-y-4 rounded-xl border border-espresso/10 bg-canvas/50 px-4 py-5">
      <legend className="block text-sm font-semibold text-espresso px-1">Branch manager</legend>

      {/* Radio: Create new */}
      <label className={RADIO}>
        <span className={RADIO_DOT}>
          <input
            id={p('mode-new')}
            type="radio"
            name={p('mode')}
            value="new"
            checked={mode === 'new'}
            onChange={() => onMode('new')}
            className="sr-only"
          />
          {mode === 'new' && <span className="h-2 w-2 rounded-full bg-espresso" />}
        </span>
        <span>
          <span className="text-sm font-medium text-ink">Create a new account</span>
          <span className="block text-xs text-ink-muted">Make a login for the person who will run this branch.</span>
        </span>
      </label>

      {/* Radio: Pick existing */}
      <label className={RADIO}>
        <span className={RADIO_DOT}>
          <input
            id={p('mode-pick')}
            type="radio"
            name={p('mode')}
            value="pick"
            checked={mode === 'pick'}
            onChange={() => onMode('pick')}
            disabled={availableStaff.length === 0}
            className="sr-only"
          />
          {mode === 'pick' && <span className="h-2 w-2 rounded-full bg-espresso" />}
        </span>
        <span>
          <span className="text-sm font-medium text-ink">
            Pick an existing staff member
            {availableStaff.length === 0 && <span className="ml-2 text-xs text-ink-faint">(no eligible staff yet)</span>}
          </span>
          <span className="block text-xs text-ink-muted">Promote a current staff member to manage this branch.</span>
        </span>
      </label>

      {/* Radio: No manager yet */}
      <label className={RADIO}>
        <span className={RADIO_DOT}>
          <input
            id={p('mode-none')}
            type="radio"
            name={p('mode')}
            value="none"
            checked={mode === 'none'}
            onChange={() => onMode('none')}
            className="sr-only"
          />
          {mode === 'none' && <span className="h-2 w-2 rounded-full bg-espresso" />}
        </span>
        <span>
          <span className="text-sm font-medium text-ink">No manager yet</span>
          <span className="block text-xs text-ink-muted">Assign one later from the Branches page.</span>
        </span>
      </label>

      {/* Conditionally rendered details */}
      {mode === 'new' && (
        <div className="mt-2 border-t border-espresso/10 pt-4">
          <AccountFields
            values={newAccount}
            onChange={onNewAccount}
            idPrefix={`${idPrefix}-new`}
          />
        </div>
      )}

      {mode === 'pick' && availableStaff.length > 0 && (
        <div className="mt-2 border-t border-espresso/10 pt-4">
          <label htmlFor={p('staff-pick')} className={PLAIN_LABEL}>
            Staff member <span className="text-danger">*</span>
          </label>
          <select
            id={p('staff-pick')}
            required={mode === 'pick'}
            value={pickedStaffId}
            onChange={e => onPickedStaffId(e.target.value)}
            className={PLAIN_FIELD}
          >
            <option value="">— pick a staff member —</option>
            {availableStaff.map(s => (
              <option key={s.id} value={String(s.id)}>
                {s.user.name} {s.role ? `· ${s.role.replace(/_/g, ' ')}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}
    </fieldset>
  );
}
