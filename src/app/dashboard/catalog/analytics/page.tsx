import { redirect } from 'next/navigation';

// The Analytics tab was removed; old links land on the designs list.
export default function CatalogAnalyticsPage() {
  redirect('/dashboard/catalog');
}
