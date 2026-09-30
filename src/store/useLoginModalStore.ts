import { create } from 'zustand';

// Tablet/desktop Sign In modal (600px+). Below that, sign-in stays the
// full-page /login route — see openSignIn() in NavActionButtons.
interface LoginModalState {
  isOpen: boolean;
  /** Where to go after signing in (e.g. the booking page that needed a login); null = stay on the current page. */
  redirectTo: string | null;
  open: (redirectTo?: string | null) => void;
  close: () => void;
}

export const useLoginModalStore = create<LoginModalState>((set) => ({
  isOpen: false,
  redirectTo: null,
  open: (redirectTo = null) => set({ isOpen: true, redirectTo }),
  close: () => set({ isOpen: false, redirectTo: null }),
}));
