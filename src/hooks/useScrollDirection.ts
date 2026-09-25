'use client';

import { useState, useEffect } from 'react';

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDir = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY;

      // Always show header near the top of the page
      if (currentScrollY <= 50) {
        setScrollDirection('up');
        lastScrollY = Math.max(0, currentScrollY);
        setScrollY(currentScrollY);
        ticking = false;
        return;
      }

      // Threshold of 8px to prevent jitter on touch bounce
      if (Math.abs(diff) < 8) {
        ticking = false;
        return;
      }

      if (currentScrollY > lastScrollY) {
        setScrollDirection('down');
      } else {
        setScrollDirection('up');
      }

      lastScrollY = currentScrollY > 0 ? currentScrollY : 0;
      setScrollY(currentScrollY);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { scrollDirection, scrollY };
}
