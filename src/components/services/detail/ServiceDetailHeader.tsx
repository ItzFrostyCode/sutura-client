'use client';

import React from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';

const ICON_BTN = 'h-11 min-w-11 px-3 border border-line bg-white hover:bg-sunken text-ink text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer';

interface ServiceDetailHeaderProps {
  readonly isActive: boolean;
  readonly toggling: boolean;
  readonly showActions: boolean;
  readonly onBack: () => void;
  readonly noun?: string;
  readonly onToggle: () => void;
  readonly onDelete: () => void;
}

// Just navigation + actions; the service's own details are in the page below.
export default function ServiceDetailHeader({ isActive, toggling, showActions, onBack, noun = 'service', onToggle, onDelete }: Readonly<ServiceDetailHeaderProps>) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to services"
        title="Back to services"
        className="w-11 h-11 rounded-full bg-ink text-white hover:bg-ink/85 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
      >
        <ArrowLeft size={18} />
      </button>

      {showActions && !isActive && (
        <span className="text-[11px] px-2.5 py-1 font-bold uppercase tracking-wider border bg-zinc-100 text-zinc-600 border-zinc-200">Paused</span>
      )}

      {showActions && (
        <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
          <button type="button" onClick={onToggle} disabled={toggling} aria-label={isActive ? `Pause ${noun}` : `Activate ${noun}`} title={isActive ? `Pause ${noun}` : `Activate ${noun}`} className={`${ICON_BTN} disabled:opacity-50`}>
            {toggling ? <Loader2 size={16} className="animate-spin" /> : isActive ? <EyeOff size={16} className="text-ink-muted" /> : <Eye size={16} className="text-emerald-600" />}
            <span className="hidden sm:inline">{isActive ? 'Pause' : 'Activate'}</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${noun}`}
            title={`Delete ${noun}`}
            className="w-11 h-11 border border-line bg-white text-ink-muted hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors flex items-center justify-center cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
