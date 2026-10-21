import { create } from 'zustand';

/** What the in-app confirm dialog asks. */
export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button for something that removes or ends a thing. */
  danger?: boolean;
  /** Only one button (OK): a message to read, not a question. */
  notice?: boolean;
}

interface ConfirmState {
  open: ConfirmOptions | null;
  resolve: ((ok: boolean) => void) | null;
  ask: (options: ConfirmOptions) => Promise<boolean>;
  answer: (ok: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: null,
  resolve: null,
  ask: (options) => new Promise<boolean>((resolve) => {
    get().resolve?.(false); // a question still open is answered "no" before the next one
    set({ open: options, resolve });
  }),
  answer: (ok) => {
    get().resolve?.(ok);
    set({ open: null, resolve: null });
  },
}));

/**
 * The app's own "Are you sure?" instead of the browser's "localhost:3000 says…" box:
 * `if (!(await confirmDialog({ title: 'Remove this?', danger: true }))) return;`
 */
export const confirmDialog = (options: ConfirmOptions) => useConfirmStore.getState().ask(options);

/** The app's own message box instead of the browser's `alert()`; works outside components too. */
export const noticeDialog = (message: string, title = 'Something went wrong') =>
  useConfirmStore.getState().ask({ title, message, confirmLabel: 'OK', notice: true }).then(() => undefined);
