// Mirrors AppServiceProvider's Password::defaults() (min 8, mixed case, a
// number, a symbol) exactly — a live UI checklist for a real server rule,
// not decorative copy that happens to look similar. Shared by customer
// signup (/register) and the shop application (/register/store).
export const PASSWORD_RULES = [
  { key: 'length', label: '8+ characters', test: (p: string) => p.length >= 8 },
  {
    key: 'numberSymbol',
    label: 'At least 1 number and a special character',
    test: (p: string) => /\d/.test(p) && /[^A-Za-z0-9]/.test(p),
  },
  {
    key: 'case',
    label: 'At least 1 lowercase and uppercase letter',
    test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p),
  },
];

export const meetsPasswordRules = (password: string) => PASSWORD_RULES.every((rule) => rule.test(password));
