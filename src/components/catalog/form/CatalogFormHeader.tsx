import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

interface CatalogFormHeaderProps {
  readonly title: string;
  readonly description: string;
  readonly submitLabel: string;
  readonly submitting: boolean;
  readonly saveDisabled: boolean;
}

export function CatalogFormHeader({
  title,
  description,
  submitLabel,
  submitting,
  saveDisabled,
}: CatalogFormHeaderProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/catalog"
            className="p-2.5 bg-surface border border-line rounded-xl text-ink-muted hover:text-ink hover:border-line-strong transition-all shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-bold text-ink tracking-tight">{title}</h1>
            <p className="text-ink-muted text-sm mt-0.5">{description}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/catalog"
            className="px-5 py-2.5 bg-surface border border-line rounded-xl text-sm font-semibold text-ink-body hover:bg-canvas transition-colors flex items-center justify-center animate-fade-in"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saveDisabled}
            className="px-5 py-2.5 bg-taupe hover:bg-taupe/90 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer animate-fade-in"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
