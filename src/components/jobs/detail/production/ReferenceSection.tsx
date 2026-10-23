import React from 'react';
import { Images } from 'lucide-react';
import { safeHref } from '@/lib/safeHref';
import type { Job } from '../../jobTypes';
import SectionHeading from './SectionHeading';

/** What the customer wants: the pictures and link attached at booking, or by the shop for a walk-in custom order. */
export default function ReferenceSection({ job }: Readonly<{ job: Job }>) {
  const images = job.reference_images ?? [];
  if (images.length === 0 && !job.reference_link) return null;

  return (
    <section className="space-y-2 border-t border-line pt-6">
      <SectionHeading icon={Images} title="Design Reference" />
      <p className="text-[13px] text-ink-muted">What the customer wants — attached at booking, or by the store for a walk-in custom order.</p>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3 pt-1">
          {images.map((url) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Design reference" className="h-24 w-24 rounded-xl border border-line object-cover transition-opacity hover:opacity-80" />
            </a>
          ))}
        </div>
      )}
      {job.reference_link && (
        <a href={safeHref(job.reference_link)} target="_blank" rel="noopener noreferrer" className="inline-block max-w-full truncate text-[13px] text-espresso hover:underline">
          {job.reference_link}
        </a>
      )}
    </section>
  );
}
