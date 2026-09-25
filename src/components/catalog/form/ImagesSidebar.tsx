import React from 'react';
import { Plus, Loader2, Save } from 'lucide-react';
import { ImageItem } from '../catalogTypes';
import { uploadCatalogImage } from '../catalogHelpers';
import { MAX_CATALOG_IMAGES } from './formTypes';
import { CatalogImageSlot } from './CatalogImageSlot';

interface ImagesSidebarProps {
  readonly images: ImageItem[];
  readonly setImages: React.Dispatch<React.SetStateAction<ImageItem[]>>;
  readonly storeId?: number;
  readonly saveDisabled: boolean;
  readonly submitting: boolean;
  readonly submitLabel: string;
}

export function ImagesSidebar({
  images,
  setImages,
  storeId,
  saveDisabled,
  submitting,
  submitLabel,
}: ImagesSidebarProps) {
  const handleAddSlot = () => {
    if (images.length >= MAX_CATALOG_IMAGES) return;
    setImages(prev => [
      ...prev,
      { id: Math.random().toString(), url: '', angle: 'Default', is_primary: false },
    ]);
  };

  const handleUploadImage = (file: File | undefined, imageId: string) => {
    if (!file || !storeId) return;
    uploadCatalogImage({
      file,
      storeId,
      imageId,
      setImages,
    });
  };

  return (
    <div className="bg-surface border border-line rounded-2xl p-6 sticky top-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium text-ink">Images</h2>
          <span className="text-xs font-medium text-ink-faint">
            {images.length}/{MAX_CATALOG_IMAGES}
          </span>
        </div>
        <button
          type="button"
          disabled={images.length >= MAX_CATALOG_IMAGES}
          onClick={handleAddSlot}
          className="text-taupe text-xs font-semibold hover:text-taupe-hover disabled:text-ink-faint disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
        >
          <Plus size={14} /> Add Image Slot
        </button>
      </div>

      <div className="space-y-4">
        {images.map((img, idx) => (
          <CatalogImageSlot
            key={img.id}
            img={img}
            onRemoveSlot={() => setImages(prev => prev.filter((_, i) => i !== idx))}
            onRemoveImage={() =>
              setImages(prev => prev.map(im => (im.id === img.id ? { ...im, url: '' } : im)))
            }
            onUpload={file => handleUploadImage(file, img.id)}
            onAngleChange={angle =>
              setImages(prev => prev.map(im => (im.id === img.id ? { ...im, angle } : im)))
            }
            onSetPrimary={() =>
              setImages(prev => prev.map(im => ({ ...im, is_primary: im.id === img.id })))
            }
          />
        ))}
      </div>

      <div className="mt-8 border-t border-line pt-6">
        <button
          type="submit"
          disabled={saveDisabled}
          className="w-full bg-taupe hover:bg-taupe/90 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
