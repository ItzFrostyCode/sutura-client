import { redirect } from 'next/navigation';

// /store with no id (typo/incomplete link, not a real "store not found for
// this id" case — every real store profile lives at /store/[store_id] and
// has its own not-found handling there) rendered a blank white page before
// this existed, since neither a page.tsx nor a not-found.tsx caught it —
// Next's default not-found content is empty, and this segment's layout.tsx
// just wraps whatever children it's given in a plain white background.
export default function StoreIndexNotFound() {
  redirect('/stores');
}
