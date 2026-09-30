'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

// Receipts live on the server's private disk, so a plain <img src> can't load
// them (no auth header). Fetch the blob with whichever authenticated client the
// caller has (owner or admin) and show it from an object URL.
export default function AuthImage({ load, alt, className = '' }: Readonly<{ load: () => Promise<Blob>; alt: string; className?: string }>) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    load()
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) return <p className="p-6 text-center text-sm text-danger">Couldn&apos;t load the receipt.</p>;
  if (!url) return <div className="flex items-center justify-center p-10"><Loader2 className="animate-spin text-ink-faint" /></div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} />;
}
