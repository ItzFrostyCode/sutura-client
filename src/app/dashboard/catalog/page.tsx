import CatalogShowcaseShell from '@/components/catalog/CatalogShowcaseShell';
import SubscriptionGate from '@/components/SubscriptionGate';

function CatalogPage() {
  return <CatalogShowcaseShell />;
}

/** Catalog designs are a Pro feature: a lower plan sees the upgrade panel (the server refuses too). */
export default function CatalogPageGated() {
  return <SubscriptionGate feature="catalog"><CatalogPage /></SubscriptionGate>;
}
