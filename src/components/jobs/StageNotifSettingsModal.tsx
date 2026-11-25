import { SlidersHorizontal, X } from 'lucide-react';
import { STAGE_NOTIF_ITEMS } from './stageIconFilters';

interface StageNotifSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifPrefs: Record<string, boolean>;
  onToggleNotifPref: (key: string) => void;
  onResetAll: () => void;
}

export default function StageNotifSettingsModal({
  isOpen,
  onClose,
  notifPrefs,
  onToggleNotifPref,
  onResetAll,
}: StageNotifSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full h-full sm:h-auto sm:max-w-md bg-surface sm:rounded-2xl border-0 sm:border border-line shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-line bg-canvas/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-taupe/10 flex items-center justify-center text-taupe">
              <SlidersHorizontal size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-ink">Stage Notification Dots</h3>
              <p className="text-xs text-ink-muted">Toggle which stages show indicator dots</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-line bg-surface hover:bg-canvas text-ink-muted hover:text-ink flex items-center justify-center transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Checkbox Options List - All 11 Stages */}
        <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto flex-1 max-h-[60vh] sm:max-h-[50vh]">
          {STAGE_NOTIF_ITEMS.map((item) => {
            const ItemIcon = item.icon;
            const isChecked = Boolean(notifPrefs[item.key]);
            return (
              <label
                key={item.key}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  isChecked
                    ? 'bg-canvas/40 border-taupe/50 shadow-2xs'
                    : 'bg-surface border-line hover:border-line-strong opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleNotifPref(item.key)}
                  className="mt-0.5 h-4 w-4 rounded text-taupe focus:ring-taupe border-line cursor-pointer accent-taupe shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <ItemIcon size={14} className={`${item.iconCls} shrink-0`} />
                    <span className="font-bold text-xs sm:text-sm text-ink truncate">{item.title}</span>
                    <span className={`w-2 h-2 rounded-full ${item.dot} shrink-0`} />
                  </div>
                  <p className="text-[11px] sm:text-xs text-ink-muted mt-0.5 leading-snug">{item.desc}</p>
                </div>
              </label>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-line bg-canvas/20 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onResetAll}
            className="text-xs font-bold text-ink-muted hover:text-ink transition-colors"
          >
            Reset All
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-6 rounded-xl bg-taupe hover:bg-taupe-hover text-white font-bold text-xs shadow-2xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
