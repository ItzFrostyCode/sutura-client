'use client';

import React, { useState, useEffect } from 'react';
import {
  FileCode2,
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  Save,
  RotateCcw,
  Loader2,
  Maximize2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Job, CustomizationInstruction } from '../../jobTypes';
import { getMediaUrl } from '@/lib/media';
import PostImageLightbox from '@/components/profile/PostImageLightbox';
import JobCustomizationInstructionModal from './JobCustomizationInstructionModal';

interface JobCustomizationInstructionsCardProps {
  job: Job;
  onSaveInstructions: (instructions: CustomizationInstruction[]) => Promise<void>;
  storeId?: number;
  saving?: boolean;
}

export default function JobCustomizationInstructionsCard({
  job,
  onSaveInstructions,
  storeId,
  saving = false,
}: JobCustomizationInstructionsCardProps) {
  const [instructions, setInstructions] = useState<CustomizationInstruction[]>(() => {
    return (job.custom_order_data?.customization_instructions as CustomizationInstruction[]) || [];
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState<CustomizationInstruction | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Sync state if job data refreshes
  useEffect(() => {
    const list = (job.custom_order_data?.customization_instructions as CustomizationInstruction[]) || [];
    setInstructions(list);
    setIsDirty(false);
  }, [job]);

  const handleSaveInstruction = (inst: CustomizationInstruction) => {
    if (editingInstruction) {
      setInstructions((prev) => prev.map((i) => (i.id === inst.id ? inst : i)));
    } else {
      setInstructions((prev) => [...prev, inst]);
    }
    setIsDirty(true);
    setEditingInstruction(null);
  };

  const handleDeleteInstruction = (id: string) => {
    setInstructions((prev) => prev.filter((i) => i.id !== id));
    setIsDirty(true);
  };

  const handleSaveAll = async () => {
    await onSaveInstructions(instructions);
    setIsDirty(false);
  };

  const handleReset = () => {
    const list = (job.custom_order_data?.customization_instructions as CustomizationInstruction[]) || [];
    setInstructions(list);
    setIsDirty(false);
  };

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      {/* 1. Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-line">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <FileCode2 size={18} className="text-taupe" />
              <span>Customization Instructions & References</span>
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-taupe bg-taupe/10 border border-taupe/20 px-2 py-0.5 rounded-md">
              Order Specs
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Discrete tailoring guidelines, logo placements, stitching notes, and design mockups for this Job Order.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:text-ink cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={!isDirty || saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-espresso hover:bg-espresso/90 text-white text-xs font-semibold shadow-2xs transition-colors disabled:opacity-40 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <Save size={13} />
                <span>Save Instructions</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Top Add Button */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
          Active Directives ({instructions.length})
        </span>
        <button
          type="button"
          onClick={() => {
            setEditingInstruction(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-canvas hover:bg-line border border-line text-xs font-semibold text-ink transition-colors cursor-pointer"
        >
          <Plus size={13} className="text-taupe" />
          <span>Add Customization Note</span>
        </button>
      </div>

      {/* 3. Instructions List */}
      {instructions.length > 0 ? (
        <div className="space-y-3">
          {instructions.map((inst, idx) => (
            <div
              key={inst.id}
              className="bg-canvas border border-line rounded-xl p-4 space-y-3 shadow-2xs hover:border-line-strong transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-5 h-5 rounded-md bg-surface border border-line flex items-center justify-center font-mono text-[10px] font-bold text-ink-muted">
                    {idx + 1}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-ink">
                    {inst.label}
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface border border-line text-ink-body">
                    {inst.scope === 'entire_job'
                      ? 'Entire Order'
                      : inst.scope === 'custom_pieces'
                      ? 'Specific Garments'
                      : inst.scope}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingInstruction(inst);
                      setIsModalOpen(true);
                    }}
                    title="Edit instruction"
                    className="p-1.5 text-ink-muted hover:text-taupe rounded-lg hover:bg-surface transition-colors cursor-pointer"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteInstruction(inst.id)}
                    title="Remove instruction"
                    className="p-1.5 text-ink-muted hover:text-rose-600 rounded-lg hover:bg-surface transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Instruction Details */}
              <p className="text-xs sm:text-sm text-ink-body font-normal leading-relaxed whitespace-pre-wrap">
                {inst.details}
              </p>

              {/* References (Link & Thumbnail) */}
              <div className="flex items-center gap-4 flex-wrap pt-1">
                {inst.reference_link && (
                  <a
                    href={inst.reference_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-taupe font-semibold hover:underline"
                  >
                    <ExternalLink size={12} />
                    <span>Reference Mockup Link</span>
                  </a>
                )}

                {inst.reference_image && (
                  <button
                    type="button"
                    onClick={() => setLightboxImage(getMediaUrl(inst.reference_image))}
                    className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface border border-line text-xs font-semibold text-ink hover:border-taupe transition-colors cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getMediaUrl(inst.reference_image)}
                      alt={inst.label}
                      className="w-5 h-5 rounded object-cover"
                    />
                    <span>View Reference Attachment</span>
                    <Maximize2 size={11} className="text-ink-muted" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-7 border border-dashed border-line rounded-xl bg-canvas/30 space-y-2">
          <HelpCircle size={24} className="mx-auto text-ink-faint" />
          <p className="text-xs text-ink-muted">
            No customization instructions added yet (e.g. Logo Placement, Special Printing, Lining).
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingInstruction(null);
              setIsModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-canvas hover:bg-line border border-line text-xs font-semibold text-ink cursor-pointer"
          >
            + Add First Instruction
          </button>
        </div>
      )}

      {/* Helper Note */}
      <div className="flex items-center gap-1.5 text-[11px] text-ink-muted pt-1">
        <AlertCircle size={12} className="text-taupe shrink-0" />
        <span>
          Reference images and links are documentation for tailoring staff and do not alter customer invoices or order status.
        </span>
      </div>

      {/* Add / Edit Modal */}
      <JobCustomizationInstructionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingInstruction(null);
        }}
        onSave={handleSaveInstruction}
        editingInstruction={editingInstruction}
        storeId={storeId}
      />

      {/* Lightbox */}
      {lightboxImage && (
        <PostImageLightbox
          images={[lightboxImage]}
          initialIndex={0}
          isOpen={true}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}
