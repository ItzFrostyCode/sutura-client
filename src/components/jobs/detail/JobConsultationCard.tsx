import React from 'react';
import Link from 'next/link';
import { MessageSquareText } from 'lucide-react';
import type { Job } from '../jobTypes';
import { designSourceLabel } from '@/lib/designSource';

/** What was agreed in the consultation and where the design comes from: the first thing the people who make it should read. */
export default function JobConsultationCard({ job }: Readonly<{ job: Job }>) {
  const source = designSourceLabel(job.design_source);
  if (!source && !job.consultation_notes?.trim() && !job.design_link) return null;
  return (
    <div className="bg-surface border border-line rounded-2xl p-5 shadow-2xs space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-ink-muted uppercase tracking-wider">
        <MessageSquareText size={14} className="text-taupe" /> Design and style notes
      </div>
      {source && (
        <p className="text-sm text-ink">
          <span className="text-ink-muted">Design: </span><span className="font-semibold">{source}</span>
          {job.design_link && <> · <a href={job.design_link} target="_blank" rel="noopener noreferrer" className="text-taupe hover:underline">their file</a></>}
        </p>
      )}
      {job.consultation_notes?.trim() && <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-body">{job.consultation_notes}</p>}
      {job.appointment_id && <Link href={`/dashboard/appointments?open=${job.appointment_id}`} className="inline-block text-xs font-semibold text-taupe hover:underline">Open the consultation</Link>}
    </div>
  );
}
