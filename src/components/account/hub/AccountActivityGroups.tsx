import { Heart, History, Layers, LifeBuoy, Ruler, Star, Store } from 'lucide-react';
import HubGroup from './HubGroup';
import HubRow from './HubRow';

/** The rest of the Me hub as two grouped lists, like iOS Settings: what I have done here, then the store owner and support entries. */
export default function AccountActivityGroups({ measurementCount }: { readonly measurementCount: number | null }) {
  const records = measurementCount === null ? 'Loading…' : `${measurementCount} record${measurementCount === 1 ? '' : 's'}`;
  return (
    <>
      <HubGroup>
        <HubRow href="/account/measurements" Icon={Ruler} title="My Measurements" subtitle={records} />
        <HubRow href="/account/history" Icon={Layers} title="My History" subtitle="Orders, appointments & measurements" />
        <HubRow href="/account/saved" Icon={Heart} title="My Saved Items" />
        <HubRow href="/account/ratings" Icon={Star} title="My Ratings" />
        <HubRow href="/account/recently-viewed" Icon={History} title="Recently Viewed" />
      </HubGroup>
      <HubGroup>
        <HubRow href="/account/settings/become-store-owner" Icon={Store} title="Start a Store Owner Account" subtitle="Be a Store Owner" />
        <HubRow href="/account/settings/support" Icon={LifeBuoy} title="Support" subtitle="Open a ticket or follow one" />
      </HubGroup>
    </>
  );
}
