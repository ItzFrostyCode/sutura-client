import { redirect } from 'next/navigation';

// "My Location" is the real /location screen (current location, choose on map, home address, recent places) — the old
// "coming soon" page said a saved address was not built, which stopped being true. Old links and the desktop sidebar land there.
export default function MyLocationPage() {
  redirect(`/location?returnTo=${encodeURIComponent('/account/settings')}`);
}
