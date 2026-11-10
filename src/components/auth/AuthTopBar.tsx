'use client';

import Link from 'next/link';
import { ArrowLeft, X } from 'lucide-react';

export interface AuthNav {
  readonly href?: string;
  readonly onClick?: () => void;
  readonly label: string;
}

const BACK = 'inline-flex min-h-12 items-center gap-1.5 pr-3 text-sm font-medium text-ink hover:text-ink-muted transition-colors';
const CLOSE = 'flex h-12 w-12 items-center justify-center rounded-full text-ink transition-colors hover:bg-sunken';

/**
 * The row above every auth card. One rule for the two icons:
 * - X (right) LEAVES the sign-in flow (close the modal, or go back to the page you came from / home).
 * - ← Back (left) goes to the PREVIOUS STEP inside the flow (Forgot Password → Sign In, a sign-up step → the one before).
 */
export default function AuthTopBar({ back, close }: { readonly back?: AuthNav; readonly close?: AuthNav }) {
  return (
    <div className="-mx-2 mb-2 flex h-12 items-center justify-between">
      {back ? (
        back.href ? (
          <Link href={back.href} className={BACK}><ArrowLeft size={20} aria-hidden /> {back.label}</Link>
        ) : (
          <button type="button" onClick={back.onClick} className={BACK}><ArrowLeft size={20} aria-hidden /> {back.label}</button>
        )
      ) : <span />}
      {close && (
        close.href ? (
          <Link href={close.href} aria-label={close.label} className={CLOSE}><X size={22} aria-hidden /></Link>
        ) : (
          <button type="button" onClick={close.onClick} aria-label={close.label} className={CLOSE}><X size={22} aria-hidden /></button>
        )
      )}
    </div>
  );
}
