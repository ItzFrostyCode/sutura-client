'use client';

import { useAuthStore } from '@/store/useAuthStore';
import PublicNav from '@/components/shared/PublicNav';
import PageBrandRow from '@/components/shared/publicNav/PageBrandRow';
import AccountWebSidebar from '@/components/account/hub/AccountWebSidebar';
import InboxPanel from '@/components/notifications/inbox/InboxPanel';

/** The full Notifications page: the same panel as the bell's drop-down, with every notification. From 768px the account sidebar sits beside it. */
export default function NotificationsPage() {
  const { user, isAuthenticated, hydrated } = useAuthStore();
  const signedIn = hydrated && isAuthenticated && !!user;

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <PublicNav />
      <main className="mobile-screen-margins mx-auto w-full max-w-7xl flex-1 py-4 md:py-6">
        <PageBrandRow className="mb-2" />
        <div className={signedIn ? 'flex flex-col md:flex-row md:items-start md:gap-8' : ''}>
          {signedIn && <div className="hidden md:block"><AccountWebSidebar user={user} /></div>}
          <div className="min-w-0 max-w-2xl flex-1">
            <div className="card-soft p-3 sm:p-4">
              <InboxPanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
