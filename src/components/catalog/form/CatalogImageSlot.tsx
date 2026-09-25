import React from 'react';
import { X, ImageOff, Loader2, UploadCloud } from 'lucide-react';
import { ImageItem } from '../catalogTypes';
import { QUICK_ANGLE_LABELS } from './formTypes';

interface CatalogImageSlotProps {
  readonly img: ImageItem;
  readonly onRemoveSlot: () => void;
  readonly onRemoveImage: () => void;
  readonly onUpload: (file: File | undefined) => void;
  readonly onAngleChange: (angle: string) => void;
  readonly onSetPrimary: () => void;
}

export function CatalogImageSlot({
  img,
  onRemoveSlot,
  onRemoveImage,
  onUpload,
  onAngleChange,
  onSetPrimary,
}: CatalogImageSlotProps) {
  return (
    <div className="space-y-3 p-4 bg-surface border border-line rounded-xl relative group hover:border-taupe/50 transition-colors">
      <button
        type="button"
        onClick={onRemoveSlot}
        className="absolute -top-2 -right-2 bg-surface border border-line text-ink-muted hover:text-rose-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
      >
        <X size={14} />
      </button>

      {img.url ? (
        <div className="relative aspect-3/4 bg-canvas border border-line rounded-lg overflow-hidden group/img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt="Uploaded" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onRemoveImage}
            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-white text-sm font-medium gap-2 cursor-pointer"
          >
            <ImageOff size={16} /> Remove
          </button>
        </div>
      ) : (
        <label className="relative flex flex-col items-center justify-center aspect-3/4 border-2 border-dashed border-[#D5CEC8] rounded-lg bg-canvas hover:bg-sunken hover:border-taupe transition-colors cursor-pointer group/upload">
          {img.uploading ? (
            <div className="flex flex-col items-center gap-2 text-taupe">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs font-medium">Uploading...</span>
            </div>
          ) : (
            <>
              <div className="p-3 bg-surface border border-line rounded-full text-taupe mb-2 group-hover/upload:scale-110 transition-transform">
                <UploadCloud size={20} />
              </div>
              <span className="text-sm font-semibold text-ink-body">Click to upload image</span>
              <span className="text-xs text-ink-muted mt-1">JPEG, PNG up to 5MB</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={img.uploading}
            onChange={e => onUpload(e.target.files?.[0])}
          />
        </label>
      )}

      <div className="flex items-end gap-3 mt-3">
        <div className="flex-1">
          <label htmlFor={`img-angle-${img.id}`} className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
            Photo Label <span className="text-ink-faint normal-case font-normal">— shown as a caption on this photo (e.g. Front, Back, Detail)</span>
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {QUICK_ANGLE_LABELS.map(label => (
              <button
                key={label}
                type="button"
                onClick={() => onAngleChange(label)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
                  img.angle === label ? 'bg-taupe text-white border-taupe' : 'bg-canvas text-ink-muted border-line hover:border-taupe/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            id={`img-angle-${img.id}`}
            type="text"
            value={img.angle}
            onChange={e => onAngleChange(e.target.value)}
            placeholder="e.g. Front, Back, Detail"
            className="w-full px-3 py-2 bg-canvas border border-line rounded-md text-ink text-sm focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-shadow"
          />
        </div>
        <label className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md border cursor-pointer transition-colors shrink-0 ${img.is_primary ? 'bg-taupe/10 border-taupe text-taupe font-medium' : 'bg-white border-line text-ink-muted hover:bg-canvas'}`}>
          <input
            type="radio"
            name="is_primary"
            checked={img.is_primary}
            onChange={onSetPrimary}
            className="accent-[#9A8073] w-4 h-4"
          />
          <span>Primary</span>
        </label>
      </div>
    </div>
  );
}
