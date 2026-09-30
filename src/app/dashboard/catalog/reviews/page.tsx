import { redirect } from 'next/navigation';

// Reviews merged into the Analytics tab as its own section — old links to
// this route still land somewhere useful instead of a stale "reviews" tab.
export default function CatalogItemReviewsPage() {
  redirect('/dashboard/catalog/analytics');
}
