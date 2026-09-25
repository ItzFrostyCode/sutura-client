'use client';

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import NotificationDetailModal from '@/components/notifications/NotificationDetailModal';
import { useNotificationsHub } from '@/components/notifications/useNotificationsHub';
import NotificationsHeader from '@/components/notifications/NotificationsHeader';
import NotificationListTab from '@/components/notifications/NotificationListTab';
import NotificationConfigureTab from '@/components/notifications/NotificationConfigureTab';

function NotificationsContent() {
  const {
    activeTab,
    switchTab,
    notifications,
    totalCount,
    loading,
    currentPage,
    lastPage,
    setCurrentPage,
    perPage,
    searchQuery,
    setSearchQuery,
    selectedIds,
    bulkBusy,
    isAllSelected,
    toggleSelectAll,
    toggleSelectOne,
    handleBulkRead,
    handleBulkDelete,
    selectedNotif,
    setSelectedNotif,
    handleOpenDetailModal,
    handleDeleteDetailNotif,
    isClearDialogOpen,
    setIsClearDialogOpen,
    clearBusy,
    handleClearAll,
    preferences,
    prefsLoading,
    prefsSaving,
    prefsSavedMessage,
    togglePref,
    handleSavePreferences,
  } = useNotificationsHub();

  return (
    <div className="space-y-6">
      <NotificationsHeader
        activeTab={activeTab}
        totalCount={totalCount}
        onSwitchTab={switchTab}
        onOpenClearDialog={() => setIsClearDialogOpen(true)}
      />

      {activeTab === 'list' && (
        <NotificationListTab
          notifications={notifications}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          selectedIds={selectedIds}
          bulkBusy={bulkBusy}
          isAllSelected={isAllSelected}
          onToggleSelectAll={toggleSelectAll}
          onToggleSelectOne={toggleSelectOne}
          onBulkRead={handleBulkRead}
          onBulkDelete={handleBulkDelete}
          onOpenDetail={handleOpenDetailModal}
          currentPage={currentPage}
          lastPage={lastPage}
          perPage={perPage}
          totalCount={totalCount}
          onPageChange={setCurrentPage}
        />
      )}

      {activeTab === 'configure' && (
        <NotificationConfigureTab
          preferences={preferences}
          prefsLoading={prefsLoading}
          prefsSaving={prefsSaving}
          prefsSavedMessage={prefsSavedMessage}
          onTogglePref={togglePref}
          onSavePreferences={handleSavePreferences}
        />
      )}

      <NotificationDetailModal
        notif={selectedNotif}
        isOpen={!!selectedNotif}
        onClose={() => setSelectedNotif(null)}
        onDelete={handleDeleteDetailNotif}
      />

      <ConfirmDialog
        isOpen={isClearDialogOpen}
        onClose={() => setIsClearDialogOpen(false)}
        onConfirm={handleClearAll}
        tone="danger"
        title="Clear all notifications?"
        message="This will permanently remove all notifications from your history. This action cannot be undone."
        confirmLabel="Clear All"
        busy={clearBusy}
      />
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 size={32} className="text-taupe animate-spin mb-3" />
          <p className="text-sm font-semibold text-ink">Loading notifications hub...</p>
        </div>
      }
    >
      <NotificationsContent />
    </Suspense>
  );
}
