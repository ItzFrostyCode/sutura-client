'use client';

import type { ReactNode } from 'react';
import AuthBrand from './AuthBrand';
import AuthTopBar, { type AuthNav } from './AuthTopBar';

interface AuthPageProps {
  readonly children: ReactNode;
  readonly back?: AuthNav;
  readonly close?: AuthNav;
  readonly tagline?: string;
}

/**
 * The frame of every sign-in / sign-up / password screen: no site header (PublicNav hides itself on auth paths), so
 * the form is the only thing on screen. Phone: the card is the whole screen. From 640px: a card centred on the canvas.
 * The way out is always the X (or ← Back to the previous step) in the card's top bar.
 */
export default function AuthPage({ children, back, close, tagline }: AuthPageProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <main className="w-full flex-1 sm:flex sm:items-start sm:justify-center sm:px-6 sm:py-12 md:py-16">
        <div className="min-h-dvh w-full bg-white px-4 pb-10 pt-2 sm:min-h-0 sm:max-w-md sm:rounded-2xl sm:border sm:border-line sm:p-8 sm:pt-4 sm:shadow-sm">
          <AuthTopBar back={back} close={close} />
          <AuthBrand className="mb-6 sm:mb-8" tagline={tagline} />
          {children}
        </div>
      </main>
    </div>
  );
}
