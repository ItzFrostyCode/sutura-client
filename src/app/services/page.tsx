import { redirect } from 'next/navigation';

export default async function ServicesPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q ? `&q=${encodeURIComponent(String(searchParams.q))}` : '';
  redirect(`/search?tab=services${q}`);
}
