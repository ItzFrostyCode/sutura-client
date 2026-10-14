import { Bell, Store } from 'lucide-react';
import HubGroup from '@/components/account/hub/HubGroup';
import HubRow from '@/components/account/hub/HubRow';

/** A guest has no notifications yet: two standing rows that say what signing in gives, styled like the list itself. */
export default function GuestInbox() {
  return (
    <HubGroup>
      <HubRow href="/login" Icon={Bell} title="Never miss an update" subtitle="Log in to get your appointment and order updates here." />
      <HubRow href="/register/store" Icon={Store} title="Are you a store owner?" subtitle="List your tailoring store on SUTURA." />
    </HubGroup>
  );
}
