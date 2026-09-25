import React, { useState, useEffect } from 'react';
import { Save, Bell, MessageSquare, Mail, BarChart2 } from 'lucide-react';

const NOTIF_STORAGE_KEY = 'sutura_notif_prefs';

interface NotifPrefs {
  new_order: boolean;
  sms: boolean;
  email: boolean;
  weekly_summary: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  new_order: true,
  sms: false,
  email: true,
  weekly_summary: false,
};

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-taupe' : 'bg-line'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white ring-0 transition duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
      // Syncing from localStorage (an external system, unavailable during
      // SSR) — there's no way to read it before this effect runs on mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {
      // ignore
    }
  }, []);

  const update = (key: keyof NotifPrefs) => (val: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const rows: { key: keyof NotifPrefs; label: string; desc: string; icon: React.ElementType }[] = [
    {
      key: 'new_order',
      label: 'New Order Notifications',
      desc: 'Get notified whenever a new order is placed in your store.',
      icon: Bell,
    },
    {
      key: 'sms',
      label: 'SMS Notifications',
      desc: 'Receive order updates and reminders via SMS to your registered phone number.',
      icon: MessageSquare,
    },
    {
      key: 'email',
      label: 'Email Notifications',
      desc: 'Receive order confirmations, status updates, and alerts via email.',
      icon: Mail,
    },
    {
      key: 'weekly_summary',
      label: 'Weekly Sales Summary',
      desc: "Get a weekly digest of your store's sales performance every Monday morning.",
      icon: BarChart2,
    },
  ];

  return (
    <div className="bg-surface border border-line rounded-2xl p-6 animate-in fade-in duration-200">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-ink">Notification Preferences</h2>
        <p className="text-xs text-ink-faint mt-0.5">
          Choose which alerts and summaries you want to receive.
        </p>
      </div>

      <div className="space-y-5">
        {rows.map(({ key, label, desc, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-canvas flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={15} className="text-taupe" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">{label}</p>
                <p className="text-xs text-ink-faint mt-0.5">{desc}</p>
              </div>
            </div>
            <Toggle id={`notif-${key}`} checked={prefs[key]} onChange={update(key)} />
          </div>
        ))}
      </div>

      <div className="pt-5 border-t border-line flex items-center justify-between mt-6">
        {saved ? (
          <span className="text-xs text-emerald-600 font-medium">Preferences saved.</span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handleSave}
          className="bg-taupe hover:bg-[#8a7065] text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm cursor-pointer"
        >
          <Save size={15} />
          Save Preferences
        </button>
      </div>
    </div>
  );
}
