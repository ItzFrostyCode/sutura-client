'use client';

import { ListChecks } from 'lucide-react';
import ComingSoon from '@/components/account/ComingSoon';

export default function OrderSettingsPage() {
  return (
    <ComingSoon
      title="Order Settings"
      Icon={ListChecks}
      message="Default order preferences (preferred branch, payment method, reorder shortcuts) aren't built yet — check back soon."
    />
  );
}
