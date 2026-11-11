import { redirect } from 'next/navigation';

/**
 * Old tracker links (/track/TNED8K2P — e.g. in emails or texts already sent) open the one Track Order page, which
 * shows the code in its box and the order under it.
 */
export default async function TrackCodeRedirect({ params }: Readonly<{ params: Promise<{ code: string }> }>) {
  const { code } = await params;
  redirect(`/track?code=${encodeURIComponent(code)}`);
}
