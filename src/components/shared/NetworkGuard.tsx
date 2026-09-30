'use client';

import { useEffect, useState } from 'react';
import OfflineScreen from '@/components/shared/OfflineScreen';

/**
 * NetworkGuard — wraps the entire app and renders <OfflineScreen /> whenever
 * the browser fires the "offline" event. Restores children the moment "online"
 * fires (no reload required; if the app needs a full refresh the OfflineScreen
 * retry button handles that).
 */
export default function NetworkGuard({ children }: { readonly children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Sync with the real initial state (SSR always starts as true).
    setIsOnline(navigator.onLine);

    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <>
      {!isOnline && <OfflineScreen />}
      {children}
    </>
  );
}
