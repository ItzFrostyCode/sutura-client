import {
  Bell,
  CheckCheck,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import SearchInput from '@/components/shared/SearchInput';
import EmptyState from '@/components/shared/EmptyState';
import {
  type AppNotification,
  getSenderInfo,
  formatDateTime,
} from '@/lib/notificationHelpers';

interface NotificationListTabProps {
  notifications: AppNotification[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedIds: string[];
  bulkBusy: boolean;
  isAllSelected: boolean;
  onToggleSelectAll: () => void;
  onToggleSelectOne: (id: string) => void;
  onBulkRead: () => void;
  onBulkDelete: () => void;
  onOpenDetail: (notif: AppNotification) => void;
  currentPage: number;
  lastPage: number;
  perPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export default function NotificationListTab({
  notifications,
  loading,
  searchQuery,
  onSearchChange,
  selectedIds,
  bulkBusy,
  isAllSelected,
  onToggleSelectAll,
  onToggleSelectOne,
  onBulkRead,
  onBulkDelete,
  onOpenDetail,
  currentPage,
  lastPage,
  perPage,
  totalCount,
  onPageChange,
}: NotificationListTabProps) {
  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onBulkRead}
            disabled={selectedIds.length === 0 || bulkBusy}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-line bg-surface hover:bg-sunken text-ink transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <CheckCheck size={14} className="text-sage" />
            <span>Mark as read</span>
            {selectedIds.length > 0 && (
              <span className="ml-1 text-[10px] bg-sunken px-1.5 py-0.5 rounded-full font-bold">
                ({selectedIds.length})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onBulkDelete}
            disabled={selectedIds.length === 0 || bulkBusy}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-line bg-surface hover:bg-danger/10 text-danger transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <Trash2 size={14} />
            <span>Delete</span>
            {selectedIds.length > 0 && (
              <span className="ml-1 text-[10px] bg-danger/10 px-1.5 py-0.5 rounded-full font-bold">
                ({selectedIds.length})
              </span>
            )}
          </button>
        </div>

        <div className="w-full sm:w-72">
          <SearchInput
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={onSearchChange}
          />
        </div>
      </div>

      {/* Table Surface */}
      <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 size={28} className="text-taupe animate-spin mb-3" />
            <p className="text-sm font-semibold text-ink">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 px-4">
            <EmptyState
              icon={Bell}
              title={searchQuery ? 'No matching notifications' : 'No notifications yet'}
              description={
                searchQuery
                  ? 'Try adjusting your search query or clear the filter.'
                  : 'You are completely caught up! New orders, stage changes, and appointments will appear here.'
              }
              actionLabel={searchQuery ? 'Clear search' : undefined}
              onAction={searchQuery ? () => onSearchChange('') : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-line bg-[#FAF6F3]/75 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={onToggleSelectAll}
                      aria-label="Select all notifications"
                      className="w-4 h-4 rounded border-line text-taupe focus:ring-taupe cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-4 w-52">From</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4 w-40">Sent</th>
                  <th className="py-3 px-4 w-20 text-center">Read?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {notifications.map((notif, index) => {
                  const sender = getSenderInfo(notif);
                  const isRead = !!notif.read_at;
                  const isSelected = selectedIds.includes(notif.id);
                  const rowNumber = (currentPage - 1) * perPage + index + 1;

                  return (
                    <tr
                      key={notif.id}
                      className={`hover:bg-[#FAF6F3] transition-colors group ${
                        isSelected ? 'bg-taupe/5' : !isRead ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelectOne(notif.id)}
                          aria-label={`Select notification ${notif.data?.title ?? ''}`}
                          className="w-4 h-4 rounded border-line text-taupe focus:ring-taupe cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-3 text-center text-xs font-semibold text-ink-muted">
                        {rowNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-canvas border border-line flex items-center justify-center text-xs font-black text-taupe shrink-0 shadow-2xs">
                            {sender.initial}
                          </div>
                          <span className="font-semibold text-ink text-[13px] truncate">
                            {sender.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => onOpenDetail(notif)}
                          className="text-left font-medium text-[13px] text-[#0B7D8C] hover:text-[#096774] hover:underline cursor-pointer line-clamp-1 group-hover:underline transition-colors"
                        >
                          {notif.data?.title || notif.data?.message || 'Notification Update'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-ink-muted whitespace-nowrap">
                        {formatDateTime(notif.created_at)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isRead ? (
                          <span
                            className="inline-flex items-center justify-center text-emerald-600 font-bold text-sm"
                            title="Read"
                          >
                            ✓
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center justify-center text-danger font-bold text-sm"
                            title="Unread"
                          >
                            ✕
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {lastPage > 1 && (
          <div className="px-4 py-3 border-t border-line bg-[#FAF6F3]/50 flex items-center justify-between gap-3">
            <p className="text-xs text-ink-muted">
              Page <strong className="text-ink">{currentPage}</strong> of{' '}
              <strong className="text-ink">{lastPage}</strong> ({totalCount} total)
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className="p-1.5 rounded-lg border border-line bg-surface text-ink-body hover:bg-sunken disabled:opacity-40 disabled:pointer-events-none transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: lastPage }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                    pageNum === currentPage
                      ? 'bg-taupe text-white'
                      : 'bg-surface text-ink hover:bg-sunken border border-line'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage >= lastPage}
                onClick={() => onPageChange(Math.min(lastPage, currentPage + 1))}
                className="p-1.5 rounded-lg border border-line bg-surface text-ink-body hover:bg-sunken disabled:opacity-40 disabled:pointer-events-none transition-colors"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
