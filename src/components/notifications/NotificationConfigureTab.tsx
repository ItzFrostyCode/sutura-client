import { Check, Loader2, Save } from 'lucide-react';
import type { PreferenceItem } from './notificationTypes';

interface NotificationConfigureTabProps {
  preferences: PreferenceItem[];
  prefsLoading: boolean;
  prefsSaving: boolean;
  prefsSavedMessage: string | null;
  onTogglePref: (id: string, channel: 'email' | 'mobile') => void;
  onSavePreferences: () => void;
}

export default function NotificationConfigureTab({
  preferences,
  prefsLoading,
  prefsSaving,
  prefsSavedMessage,
  onTogglePref,
  onSavePreferences,
}: NotificationConfigureTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          Select the notifications that you want to receive an email copy or mobile notification of:
        </p>

        <button
          type="button"
          onClick={onSavePreferences}
          disabled={prefsSaving}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 text-xs font-bold bg-taupe hover:bg-taupe-hover text-white rounded-xl transition-colors disabled:opacity-50 shadow-xs"
        >
          {prefsSaving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          <span>{prefsSaving ? 'Saving...' : 'Save Preferences'}</span>
        </button>
      </div>

      {prefsSavedMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <span>{prefsSavedMessage}</span>
        </div>
      )}

      {/* Configuration Matrix Table */}
      <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-xs">
        {prefsLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 size={28} className="text-taupe animate-spin mb-3" />
            <p className="text-sm font-semibold text-ink">Loading notification settings...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[550px]">
              <thead>
                <tr className="border-b border-line bg-[#FAF6F3]/75 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  <th className="py-3 px-5 w-20 text-center">Email</th>
                  <th className="py-3 px-5 w-24 text-center">Mobile</th>
                  <th className="py-3 px-5">Event</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {preferences.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF6F3]/50 transition-colors">
                    <td className="py-3.5 px-5 text-center">
                      <input
                        type="checkbox"
                        checked={item.email}
                        onChange={() => onTogglePref(item.id, 'email')}
                        aria-label={`Enable email for ${item.event}`}
                        className="w-4 h-4 rounded border-line text-taupe focus:ring-taupe cursor-pointer"
                      />
                    </td>

                    <td className="py-3.5 px-5 text-center">
                      <input
                        type="checkbox"
                        checked={item.mobile}
                        onChange={() => onTogglePref(item.id, 'mobile')}
                        aria-label={`Enable mobile for ${item.event}`}
                        className="w-4 h-4 rounded border-line text-taupe focus:ring-taupe cursor-pointer"
                      />
                    </td>

                    <td className="py-3.5 px-5 font-medium text-ink text-[13px]">
                      {item.event}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
