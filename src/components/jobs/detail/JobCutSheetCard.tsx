'use client';

import React from 'react';
import { Scissors, BookOpen, Link as LinkIcon } from 'lucide-react';
import { Job } from '../jobTypes';

interface JobCutSheetCardProps {
  job: Job;
  notes: string;
  setNotes: (notes: string) => void;
}

export default function JobCutSheetCard({ job, notes, setNotes }: JobCutSheetCardProps) {
  const catalogImageUrl =
    job.catalog_item?.images?.find(i => i.is_primary)?.image_url ??
    job.catalog_item?.images?.[0]?.image_url ??
    job.catalog_item?.fabric_image_url ??
    null;

  const heroImages = [catalogImageUrl, ...(job.reference_images ?? [])].filter((u): u is string => Boolean(u));
  const mainImage = heroImages[0];
  const extraImages = heroImages.slice(1);

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center shrink-0">
          <Scissors size={16} className="text-amber-700" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-bold text-ink">Production Cut Sheet & Tailor Notes</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Instructions for manggagawa — stitch types, seam allowances, linings, and embellishments
          </p>
        </div>
      </div>

      {!mainImage ? (
        <div className="space-y-2">
          {job.reference_link && (
            <a
              href={job.reference_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-taupe hover:underline font-bold mb-2 inline-flex items-center gap-1.5"
            >
              <LinkIcon size={12} /> External Reference Link
            </a>
          )}
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={5}
            placeholder="e.g. Use cocoon silk panel A for the back. French seam on collar. Add 1cm allowance all sides. Embroidery on left chest pocket only..."
            className="w-full bg-[#FFFDF7] border border-amber-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-ink placeholder-[#C5BDBA] focus:outline-none resize-y min-h-[120px] leading-relaxed shadow-2xs"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
          <div className="space-y-2.5">
            <a
              href={mainImage}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-3/4 bg-sunken rounded-xl overflow-hidden border border-line shadow-2xs"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mainImage}
                alt={job.catalog_item?.name ?? 'Design reference'}
                className="w-full h-full object-cover"
              />
            </a>
            {job.catalog_item && (
              <p className="text-xs font-bold text-ink-body flex items-center gap-1.5 truncate">
                <BookOpen size={13} className="text-taupe shrink-0" /> {job.catalog_item.name}
              </p>
            )}
            {extraImages.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {extraImages.map(url => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt="Additional reference"
                    className="h-12 w-12 object-cover rounded-lg border border-line shadow-2xs"
                  />
                ))}
              </div>
            )}
            {job.reference_link && (
              <a
                href={job.reference_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-taupe hover:underline font-bold inline-flex items-center gap-1.5"
              >
                <LinkIcon size={12} /> Reference link
              </a>
            )}
          </div>

          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Use cocoon silk panel A for the back. French seam on collar. Add 1cm allowance all sides. Embroidery on left chest pocket only..."
            className="w-full min-h-[220px] bg-[#FFFDF7] border border-amber-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-ink placeholder-[#C5BDBA] focus:outline-none resize-none overflow-y-auto leading-relaxed shadow-2xs"
          />
        </div>
      )}

      <p className="text-[11px] text-ink-muted flex items-center gap-1.5 pt-1">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
        These cut sheet instructions will automatically print on the physical Work Ticket.
      </p>
    </div>
  );
}
