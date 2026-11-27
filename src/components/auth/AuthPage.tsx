'use client';

import type { ReactNode } from 'react';
import AuthBrand from './AuthBrand';
import AuthTopBar, { type AuthNav } from './AuthTopBar';

interface AuthPageProps {
  readonly children: ReactNode;
  readonly back?: AuthNav;
  readonly close?: AuthNav;
  readonly tagline?: string;
  /** Create Account: a wider card from 768px so its fields sit two per row. */
  readonly wide?: boolean;
}

/**
 * The frame of every sign-in / sign-up / password screen: no site header (PublicNav hides itself on auth paths), so
 * the form is the only thing on screen. Phone: the card is the whole screen. From 640px: a card centred on the canvas.
 * The way out is always the X (or ← Back to the previous step) in the card's top bar.
 * From 640px the card is centred with tight padding and the X sits in its corner, so it fits a laptop screen unscrolled.
 */
export default function AuthPage({ children, back, close, tagline, wide = false }: AuthPageProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <main className="w-full flex-1 sm:flex sm:items-center sm:justify-center sm:px-6 sm:py-6 short:py-3">
        <div className={`relative min-h-dvh w-full bg-white px-4 pb-10 pt-2 sm:min-h-0 sm:max-w-md sm:rounded-2xl sm:border sm:border-line sm:px-8 sm:py-6 sm:shadow-sm short:py-4 ${wide ? 'md:max-w-2xl' : ''}`}>
          <AuthTopBar back={back} close={close} />
          <AuthBrand className="mb-6 sm:mb-4 short:mb-3" tagline={tagline} />
          {children}
        </div>
      </main>
    </div>
  );
}
