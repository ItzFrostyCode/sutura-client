import React from 'react';
import Image from 'next/image';
import { getMediaUrl } from '@/lib/media';
import { CatalogItemImage } from './types';

interface CatalogAngleThumbnailsProps {
  images: CatalogItemImage[];
  selectedImage: string;
  onSelectImage: (imgUrl: string, label: string) => void;
  itemName: string;
}

export default function CatalogAngleThumbnails({
  images,
  selectedImage,
  onSelectImage,
  itemName,
}: CatalogAngleThumbnailsProps) {
  if (images.length <= 1) return null;

  return (
    <div className="flex items-center gap-2.5 overflow-x-auto pt-1 pb-1 scrollbar-none">
      {images.map((img, idx) => {
        const isSelected = selectedImage === img.image_url;
        return (
          <button
            key={img.id || img.image_url || idx}
            type="button"
            onClick={() => onSelectImage(img.image_url, `Model View ${idx + 1}`)}
            className={`w-16 h-16 rounded-none overflow-hidden border-2 transition-all relative shrink-0 shadow-xs cursor-pointer ${
              isSelected
                ? 'border-taupe ring-2 ring-taupe/50'
                : 'border-line hover:border-taupe opacity-75 hover:opacity-100'
            }`}
            title={`${itemName} View ${idx + 1}`}
          >
            <Image
              src={getMediaUrl(img.image_url)}
              alt={`${itemName} View ${idx + 1}`}
              className="w-full h-full object-cover object-top"
              fill
            />
            <span className="absolute bottom-0 inset-x-0 bg-ink/80 text-[8px] text-white text-center py-0.5 font-bold uppercase tracking-wider">
              View {idx + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}
