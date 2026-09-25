import { Trash2, List as ListIcon, Settings } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

interface NotificationsHeaderProps {
  activeTab: 'list' | 'configure';
  totalCount: number;
  onSwitchTab: (tab: 'list' | 'configure') => void;
  onOpenClearDialog: () => void;
}

export default function NotificationsHeader({
  activeTab,
  totalCount,
  onSwitchTab,
  onOpenClearDialog,
}: NotificationsHeaderProps) {
  return (
    <PageHeader
      eyebrow="ALERTS & ACTIVITY"
      title="Notifications"
      description="Review your order activity, customer appointments, and pickup notifications."
      actions={
        activeTab === 'list' && totalCount > 0 ? (
          <button
            type="button"
            onClick={onOpenClearDialog}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/10 border border-danger/25 rounded-xl transition-colors"
            title="Clear all notifications"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        ) : null
      }
    >
      <div className="flex items-center gap-2 pt-4 overflow-x-auto hide-scrollbar">
        <button
          type="button"
          onClick={() => onSwitchTab('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-colors shrink-0 ${
            activeTab === 'list'
              ? 'bg-taupe text-white'
              : 'bg-surface text-ink-body hover:bg-sunken border border-line'
          }`}
        >
          <ListIcon size={14} />
          <span>List</span>
          <span
            className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
              activeTab === 'list' ? 'bg-white/25 text-white' : 'bg-sunken text-ink-muted'
            }`}
          >
            {totalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSwitchTab('configure')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-colors shrink-0 ${
            activeTab === 'configure'
              ? 'bg-taupe text-white'
              : 'bg-surface text-ink-body hover:bg-sunken border border-line'
          }`}
        >
          <Settings size={14} />
          <span>Configure</span>
        </button>
      </div>
    </PageHeader>
  );
}
