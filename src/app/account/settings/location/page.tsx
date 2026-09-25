'use client';

import { MapPin } from 'lucide-react';
import ComingSoon from '@/components/account/ComingSoon';

export default function MyLocationPage() {
  return (
    <ComingSoon
      title="My Location"
      Icon={MapPin}
      message="Saving a home address so stores can estimate delivery/pickup distance isn't built yet — check back soon."
    />
  );
}
