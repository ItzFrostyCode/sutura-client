'use client';

import { Bell } from 'lucide-react';
import ComingSoon from '@/components/account/ComingSoon';

export default function NotificationSettingsPage() {
  return (
    <ComingSoon
      title="Notification Settings"
      Icon={Bell}
      message="Per-category notification toggles (appointments, jobs, promos) aren't built yet — you'll get every notification for now, viewable from the bell icon."
    />
  );
}
