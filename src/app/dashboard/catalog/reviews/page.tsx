import { redirect } from 'next/navigation';

// Reviews and the Analytics tab were removed; old links land on the designs list.
export default function CatalogItemReviewsPage() {
  redirect('/dashboard/catalog');
}
