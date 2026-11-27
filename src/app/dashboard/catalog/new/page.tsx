import { redirect } from 'next/navigation';

// Creating a design now happens in a modal on the Catalog Designs page.
export default function NewCatalogItemPage() {
  redirect('/dashboard/catalog?new=1');
}
