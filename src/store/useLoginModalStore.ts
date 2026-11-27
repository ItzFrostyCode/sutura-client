import { create } from 'zustand';

// Tablet/desktop Sign In modal (600px+). Below that, sign-in stays the
// full-page /login route — see openSignIn() in NavActionButtons.
interface LoginModalState {
  isOpen: boolean;
  /** Where to go after signing in (e.g. the booking page that needed a login); null = stay on the current page. */
  redirectTo: string | null;
  /** Which tab opens first: Customer, or Shop ("Log in as Shop Owner"). */
  portal: 'customer' | 'store';
  /** "Log in as Shop Owner" from a signed-in customer: keep that account signed in too. */
  addAccount: boolean;
  open: (redirectTo?: string | null, options?: { portal?: 'customer' | 'store'; addAccount?: boolean }) => void;
  close: () => void;
}

export const useLoginModalStore = create<LoginModalState>((set) => ({
  isOpen: false,
  redirectTo: null,
  portal: 'customer',
  addAccount: false,
  open: (redirectTo = null, options = {}) => set({ isOpen: true, redirectTo, portal: options.portal ?? 'customer', addAccount: options.addAccount ?? false }),
  close: () => set({ isOpen: false, redirectTo: null, portal: 'customer', addAccount: false }),
}));
