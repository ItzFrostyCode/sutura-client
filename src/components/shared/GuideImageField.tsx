import React from 'react';
import GuideImage from './GuideImage';
import { ImagePlus, Loader2, RefreshCw, Trash2 } from 'lucide-react';

interface GuideImageFieldProps {
  readonly imageUrl: string;
  readonly uploading: boolean;
  readonly alt: string;
  readonly onUpload: (file: File | undefined) => void;
  readonly onRemove: () => void;
}

// The preview is the same GuideImage the customer sees — whole image, own
// proportions — so what you attach is what they get. The empty placeholder is
// a grey box that separates it from the white box around it.
export default function GuideImageField({ imageUrl, uploading, alt, onUpload, onRemove }: Readonly<GuideImageFieldProps>) {
  const input = (
    <input
      type="file"
      accept="image/*"
      className="sr-only"
      disabled={uploading}
      onChange={e => {
        onUpload(e.target.files?.[0]);
        e.target.value = '';
      }}
    />
  );

  if (imageUrl) {
    return (
      <div className="space-y-2">
        <GuideImage src={imageUrl} alt={alt} />
        <div className="flex gap-2">
          <label className="h-11 px-4 border border-line-strong bg-white text-sm font-medium text-ink flex items-center gap-2 cursor-pointer hover:bg-sunken">
            <RefreshCw size={15} /> Replace
            {input}
          </label>
          <button type="button" onClick={onRemove} className="h-11 px-4 border border-line-strong bg-white text-sm font-medium text-danger flex items-center gap-2 cursor-pointer hover:bg-danger/5">
            <Trash2 size={15} /> Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <label className="w-full h-[200px] bg-sunken border border-dashed border-line-strong flex flex-col items-center justify-center gap-2 text-ink-muted cursor-pointer hover:bg-line/40 hover:text-taupe transition-colors">
      {uploading ? <Loader2 size={28} className="animate-spin text-taupe" /> : <ImagePlus size={32} strokeWidth={1.5} />}
      <span className="text-xs font-medium">{uploading ? 'Uploading…' : 'Add guide image'}</span>
      {input}
    </label>
  );
}
