/** Where the landing page sends people. */
export const APPLY_HREF = '/register/store';
/** The application with the free trial already chosen on the plan step. */
export const TRIAL_HREF = '/register/store?trial=1';
export const SIGN_IN_HREF = '/login?as=store';

export const SECTION_LINKS = [
  { href: '#product', label: 'Product' },
  { href: '#customers', label: 'For customers' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
] as const;
