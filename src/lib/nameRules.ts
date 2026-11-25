/**
 * Person names: letters (incl. ñ, á, é…), spaces, hyphens, apostrophes and
 * periods — no digits or other symbols. Same rule as the server
 * (StoreApplicationRequest::NAME_PATTERN, RegisterRequest).
 */
export const NAME_PATTERN = /^[\p{L}\s'.-]+$/u;
/** Everything a name may NOT contain — stripped as the user types or pastes. */
export const NAME_DISALLOWED = /[^\p{L}\s'.-]/gu;
export const NAME_HINT = 'Names can only contain letters, spaces, hyphens, apostrophes, and periods.';

/** '' when fine. Empty is left to the field's own "required". */
export function nameError(value: string, mustHaveLetter = true): string {
  const v = value.trim();
  if (!v) return '';
  if (!NAME_PATTERN.test(v)) return NAME_HINT;
  if (mustHaveLetter && !/\p{L}/u.test(v)) return 'Please enter a name with at least one letter.';
  return '';
}

/** Removes disallowed characters; `changed` says whether anything was dropped. */
export function cleanName(raw: string): { value: string; changed: boolean } {
  const value = raw.replace(NAME_DISALLOWED, '');
  return { value, changed: value !== raw };
}
