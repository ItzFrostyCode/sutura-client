import React from 'react';
import { Loader2 } from 'lucide-react';
import { SectionImageUploadProps } from './formTypes';

export function SectionImageUpload({
  imageUrl,
  uploading,
  uploadId,
  alt,
  onRemove,
  onChange,
}: SectionImageUploadProps) {
  if (imageUrl) {
    return (
      <div className="relative max-w-md aspect-video bg-surface border border-line rounded-lg overflow-hidden group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={alt} className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={onRemove}
          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#FAF6F3] text-xs font-medium cursor-pointer"
        >
          Remove Image
        </button>
      </div>
    );
  }

  return (
    <div className="border-2 border-dashed border-line rounded-lg p-4 text-center max-w-md bg-white">
      {uploading ? (
        <div className="flex items-center justify-center gap-2 text-xs text-ink-muted">
          <Loader2 className="w-4 h-4 animate-spin text-taupe" />
          <span>Uploading visual guide...</span>
        </div>
      ) : (
        <input
          id={uploadId}
          type="file"
          accept="image/*"
          onChange={e => onChange(e.target.files?.[0])}
          className="text-xs text-ink-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-sunken file:text-taupe hover:file:bg-line cursor-pointer"
        />
      )}
    </div>
  );
}
