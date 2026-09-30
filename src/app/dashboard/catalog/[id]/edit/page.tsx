import { redirect } from 'next/navigation';

// Editing now happens in place on the design's own page — every section has
// its own pencil — so this old standalone form route just forwards there
// (keeps old bookmarks and links working).
export default async function EditCatalogItemPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  redirect(`/dashboard/catalog/${id}`);
}
