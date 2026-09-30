'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Loader2, Trash2, Star, RefreshCw } from 'lucide-react';
import { uploadCatalogImage } from '../../catalogHelpers';
import { MAX_CATALOG_IMAGES } from '../../form/formTypes';
import type { ImageItem } from '../../catalogTypes';
import type { CatalogDraftEdit } from '../useCatalogSectionEdit';
import ColorRowsEditor from './ColorRowsEditor';

// Suggested caption per slot. All of them read as angle views, so a photo
// named this way is never mistaken for a color photo (see isAngleLabel).
export const SUGGESTED_PHOTO_NAMES = [
  'Front', 'Right Side', 'Left Side', 'Back',
  'Thumb 5', 'Thumb 6', 'Thumb 7', 'Thumb 8', 'Thumb 9', 'Thumb 10',
];

const SLOTS = Array.from({ length: MAX_CATALOG_IMAGES }, (_, i) => i);

// Slot #1 is always the main photo (the one customers see first): keep it at
// the front and flag only it as primary.
function normalize(list: ImageItem[]): ImageItem[] {
  return list
    .filter(i => i.url || i.uploading)
    .slice(0, MAX_CATALOG_IMAGES)
    .map((img, idx) => ({
      ...img,
      is_primary: idx === 0,
      // The name follows the slot (Front, Right Side, …); a custom name on an older photo is left alone.
      angle: !img.angle || SUGGESTED_PHOTO_NAMES.includes(img.angle) ? (SUGGESTED_PHOTO_NAMES[idx] ?? 'Default') : img.angle,
    }));
}

function ordered(list: ImageItem[]): ImageItem[] {
  const filled = list.filter(i => i.url || i.uploading);
  const primary = filled.find(i => i.is_primary);
  return primary ? [primary, ...filled.filter(i => i !== primary)] : filled;
}

function UploadInput({ onFile, children, className }: Readonly<{ onFile: (f: File) => void; children: React.ReactNode; className: string }>) {
  return (
    <label className={className}>
      {children}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
    </label>
  );
}

// Edited together, top to bottom: the photo slots, then the colors.
// Same shape as the customer gallery — a main preview with a thumbnail
// strip under it — but the strip is the 10 photo slots (#1–#10): filled ones
// show their photo, empty ones are grey boxes with a "+".
export default function GalleryEditor({ edit }: Readonly<{ edit: CatalogDraftEdit }>) {
  const { images, setImages } = edit.form;
  const list = useMemo(() => ordered(images), [images]);
  const [sel, setSel] = useState(0);

  const active = Math.min(sel, list.length); // an empty selection always points at the next free slot
  const current = list[active];
  const mutate = (fn: (l: ImageItem[]) => ImageItem[]) => setImages(prev => normalize(fn(ordered(prev))));

  const addPhoto = (file: File) => {
    if (!edit.storeId || list.length >= MAX_CATALOG_IMAGES) return;
    const id = Math.random().toString();
    const angle = SUGGESTED_PHOTO_NAMES[list.length] ?? 'Default';
    mutate(l => [...l, { id, url: '', angle, is_primary: false, uploading: true }]);
    setSel(list.length);
    uploadCatalogImage({ file, storeId: edit.storeId, imageId: id, setImages });
  };

  const replacePhoto = (file: File) => {
    if (!edit.storeId || !current) return;
    uploadCatalogImage({ file, storeId: edit.storeId, imageId: current.id, setImages });
  };

  const remove = () => {
    if (!current) return;
    mutate(l => l.filter(i => i.id !== current.id));
    setSel(Math.max(0, active - 1));
  };
  const makeMain = () => {
    if (!current) return;
    mutate(l => [current, ...l.filter(i => i.id !== current.id)]);
    setSel(0);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-ink uppercase tracking-wider">Photos <span className="text-red-600">*</span></p>
      <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
        <span>Photo #1 is required and is the one customers see first. #2–#{MAX_CATALOG_IMAGES} are optional.</span>
        <span className="font-semibold text-ink shrink-0">{list.length}/{MAX_CATALOG_IMAGES} photos</span>
      </div>

      {/* Main preview — kept modest so it never fills a phone screen */}
      <div className="relative w-full max-w-sm mx-auto aspect-[4/3] sm:aspect-square bg-sunken border border-line overflow-hidden">
        {current?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.url} alt={current.angle} className="w-full h-full object-cover object-top" />
        ) : current?.uploading ? (
          <div className="w-full h-full flex items-center justify-center text-taupe"><Loader2 className="w-7 h-7 animate-spin" /></div>
        ) : (
          <UploadInput onFile={addPhoto} className="w-full h-full flex flex-col items-center justify-center gap-1 text-ink-muted cursor-pointer hover:bg-line/40 transition-colors">
            <Plus size={36} strokeWidth={1.5} />
            <span className="text-xs font-medium">Add photo #{active + 1}</span>
            {active > 0 && <span className="text-[11px] text-ink-faint">{active < 4 ? SUGGESTED_PHOTO_NAMES[active] : 'Optional'}</span>}
          </UploadInput>
        )}
        <span className="absolute top-2 left-2 bg-ink text-white text-[11px] font-semibold px-2 py-0.5 pointer-events-none">
          {active + 1}/{MAX_CATALOG_IMAGES}
        </span>
        {current?.url && (
          <span className="absolute bottom-2 right-2 bg-white/90 text-ink text-[11px] font-semibold px-2 py-0.5 pointer-events-none">{current.angle}</span>
        )}
        {current?.url && active === 0 && (
          <span className="absolute bottom-2 left-2 bg-taupe text-white text-[11px] font-semibold px-2 py-0.5 pointer-events-none">Main photo</span>
        )}
      </div>

      {/* Slots #1–#10 */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2" role="listbox" aria-label="Photo slots">
        {SLOTS.map(i => {
          const img = list[i];
          const selected = i === active;
          return (
            <button
              key={i}
              type="button"
              role="option"
              aria-selected={selected}
              aria-label={`Photo slot ${i + 1}${img ? '' : ' (empty)'}`}
              onClick={() => setSel(Math.min(i, list.length))}
              className={`relative aspect-square overflow-hidden border-2 cursor-pointer transition-colors ${selected ? 'border-taupe' : 'border-line hover:border-taupe/60'} ${img ? 'bg-canvas' : 'bg-sunken'}`}
            >
              {img?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.url} alt="" className="w-full h-full object-cover object-top" />
              ) : img?.uploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-taupe m-auto absolute inset-0" />
              ) : (
                <span className="absolute inset-0 flex flex-col items-center justify-center text-ink-faint">
                  <Plus size={16} />
                  {i > 0 && (
                    <span className="text-[9px] leading-3 mt-0.5 px-0.5 text-center">{i < 4 ? SUGGESTED_PHOTO_NAMES[i] : 'Optional'}</span>
                  )}
                </span>
              )}
              <span className="absolute bottom-0 left-0 bg-ink/70 text-white text-[10px] leading-4 px-1">{i + 1}</span>
            </button>
          );
        })}
      </div>

      {current?.url && (
        <div className="space-y-3 pt-1">
          <div className="flex flex-wrap gap-2">
            <UploadInput onFile={replacePhoto} className="h-11 px-4 border border-line-strong bg-white text-sm font-medium text-ink flex items-center gap-2 cursor-pointer hover:bg-sunken">
              <RefreshCw size={15} /> Replace
            </UploadInput>
            {active > 0 && (
              <button type="button" onClick={makeMain} className="h-11 px-4 border border-line-strong bg-white text-sm font-medium text-ink flex items-center gap-2 cursor-pointer hover:bg-sunken">
                <Star size={15} /> Make main
              </button>
            )}
            <button type="button" onClick={remove} className="h-11 px-4 border border-line-strong bg-white text-sm font-medium text-danger flex items-center gap-2 cursor-pointer hover:bg-danger/5">
              <Trash2 size={15} /> Remove
            </button>
          </div>

        </div>
      )}

      <div className="border-t border-line pt-4">
        <ColorRowsEditor value={edit.form.colorItems} onChange={edit.form.setColorItems} mainPhotoUrl={list[0]?.url ?? ''} storeId={edit.storeId} />
      </div>

    </div>
  );
}
