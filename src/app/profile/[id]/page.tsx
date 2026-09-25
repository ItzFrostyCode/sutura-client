'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MoreHorizontal, Flag, User as UserIcon } from 'lucide-react';
import api from '@/lib/axios';

interface PublicUser {
  id: number;
  name: string;
  profile_picture: string | null;
}

// Minimal stub: tapping another customer's name/avatar (e.g. on a catalog
// item's Ratings & Reviews page) lands here instead of /account — that page
// is private (Job Orders, Appointments, Measurements, ...) and only ever
// shown for your OWN account. This is deliberately just avatar + name for
// now, nothing else, until a real public-profile design is scoped.
export default function PublicProfilePage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api.get(`/public/users/${id}`)
      .then(res => setProfile(res.data.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <div className="sticky top-0 z-50 bg-surface border-b border-line px-4 h-10 flex items-center justify-between relative">
        <button type="button" onClick={() => router.back()} aria-label="Back" className="p-1 text-ink-muted">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-sm font-bold text-ink truncate absolute left-1/2 -translate-x-1/2">Profile</h1>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="More options"
            className="p-1 text-ink-muted"
          >
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />
              <div className="absolute right-0 top-full mt-1 w-44 bg-surface border border-line shadow-lg z-50 py-1">
                <Link
                  href="/account/settings/support"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink-body hover:bg-canvas transition-colors"
                >
                  <Flag size={15} className="text-ink-faint shrink-0" /> Report
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {loading && <div className="text-center py-16 text-sm text-ink-muted">Loading…</div>}

      {!loading && !profile && (
        <div className="text-center py-16 text-sm text-ink-faint">User not found.</div>
      )}

      {!loading && profile && (
        <div className="flex flex-col items-center pt-10 pb-6">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-sunken border border-line">
            {profile.profile_picture ? (
              <Image src={profile.profile_picture} alt="" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon size={32} className="text-ink-faint" />
              </div>
            )}
          </div>
          <p className="mt-3 text-base font-bold text-ink">{profile.name}</p>
        </div>
      )}
    </div>
  );
}
