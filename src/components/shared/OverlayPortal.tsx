'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Renders overlays straight into <body>. Inside the page tree, any ancestor
// with a transform / animation / overflow clip re-anchors `position: fixed`,
// which is how a "centered" modal ends up off-center or cut off.
export default function OverlayPortal({ children }: Readonly<{ children: React.ReactNode }>) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
