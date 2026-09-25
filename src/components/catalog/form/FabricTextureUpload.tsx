import React from 'react';
import { Loader2, UploadCloud, X } from 'lucide-react';

interface FabricTextureUploadProps {
  readonly fabricImageUrl: string;
  readonly uploading: boolean;
  readonly inputRef: React.RefObject<HTMLInputElement | null>;
  readonly onRemove: () => void;
  readonly onUpload: (file: File | undefined) => void;
}

export function FabricTextureUpload({
  fabricImageUrl,
  uploading,
  inputRef,
  onRemove,
  onUpload,
}: FabricTextureUploadProps) {
  return (
    <div className="mt-2">
      {fabricImageUrl ? (
        <div className="relative inline-flex items-center gap-2 bg-canvas border border-line rounded-lg px-3 py-2 text-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fabricImageUrl} alt="Fabric texture" className="w-10 h-10 object-cover rounded border border-line" />
          <span className="text-ink-body font-medium">Fabric texture uploaded</span>
          <button
            type="button"
            onClick={onRemove}
            className="ml-1 text-danger hover:text-danger/80 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#D5CEC8] bg-canvas text-xs font-semibold text-ink-body hover:bg-sunken hover:border-taupe transition-colors disabled:opacity-50 cursor-pointer"
        >
          {uploading ? (
            <Loader2 size={14} className="animate-spin text-taupe" />
          ) : (
            <UploadCloud size={14} />
          )}
          <span>{uploading ? 'Uploading texture...' : 'Upload fabric texture image (optional)'}</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={e => onUpload(e.target.files?.[0])}
          />
        </button>
      )}
    </div>
  );
}
