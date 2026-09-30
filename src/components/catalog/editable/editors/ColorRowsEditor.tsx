'use client';

import React, { useState } from 'react';
import { Loader2, Plus, Upload, X } from 'lucide-react';
import api from '@/lib/axios';
import type { ColorItem } from '../../catalogTypes';

interface ColorRowsEditorProps {
  readonly value: ColorItem[];
  readonly onChange: (value: ColorItem[]) => void;
  /** Photo #1 — the default color always shows it, so it needs no upload of its own. */
  readonly mainPhotoUrl: string;
  readonly storeId: number;
}

// Same look as the customer's color picker: photo on the left, name on the
// right. The first color is the default and simply reflects thumbnail #1;
// the owner only names it. Other colors get their own photo.
export default function ColorRowsEditor({ value, onChange, mainPhotoUrl, storeId }: Readonly<ColorRowsEditorProps>) {
  const [nameInput, setNameInput] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newUploading, setNewUploading] = useState(false);
  const addingDefault = value.length === 0; // the first color takes photo #1

  const update = (id: string, patch: Partial<ColorItem>) => onChange(value.map(c => (c.id === id ? { ...c, ...patch } : c)));

  const add = () => {
    const name = nameInput.trim();
    if (!name || value.some(c => c.name.trim().toLowerCase() === name.toLowerCase())) return;
    onChange([...value, { id: `color-${Date.now()}`, name, image_url: addingDefault ? '' : newImage }]);
    setNameInput('');
    setNewImage('');
  };

  const uploadNew = async (file: File | undefined) => {
    if (!file || !storeId) return;
    setNewUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`/stores/${storeId}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNewImage(res.data?.data?.url || res.data?.url || '');
    } finally {
      setNewUploading(false);
    }
  };

  const upload = async (id: string, file: File | undefined) => {
    if (!file || !storeId) return;
    update(id, { uploading: true });
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`/stores/${storeId}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      update(id, { image_url: res.data?.data?.url || res.data?.url || '', uploading: false });
    } catch {
      update(id, { uploading: false });
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="block text-xs font-bold text-ink uppercase tracking-wider">Colors</p>
        <p className="text-[11px] text-ink-faint mt-1">
          Just a name for each color — no color codes. The first color is the default and uses photo #1; add a photo only for the other colors.
        </p>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {value.map((color, idx) => {
            const isDefault = idx === 0;
            const photo = isDefault ? mainPhotoUrl : color.image_url;
            return (
              <div key={color.id} className="flex items-center gap-2 border border-line bg-white p-1.5">
                {isDefault ? (
                  <div className="relative w-12 h-12 shrink-0 bg-sunken overflow-hidden" title="Uses photo #1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {photo && <img src={photo} alt="" className="w-full h-full object-cover object-top" />}
                    <span className="absolute bottom-0 inset-x-0 bg-ink text-white text-[9px] font-bold uppercase text-center leading-4">Default</span>
                  </div>
                ) : (
                  <label className="relative w-12 h-12 shrink-0 bg-sunken overflow-hidden cursor-pointer flex items-center justify-center text-ink-faint hover:text-taupe" title="Upload a photo for this color">
                    {color.uploading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="" className="w-full h-full object-cover object-top" />
                    ) : (
                      <Upload size={16} />
                    )}
                    <input type="file" accept="image/*" className="sr-only" disabled={color.uploading} onChange={e => upload(color.id, e.target.files?.[0])} />
                  </label>
                )}
                <input
                  value={color.name}
                  onChange={e => update(color.id, { name: e.target.value })}
                  aria-label={isDefault ? 'Default color name' : 'Color name'}
                  placeholder={isDefault ? 'Name the color in photo #1' : 'Color name'}
                  className="flex-1 min-w-0 h-11 px-2.5 bg-surface border border-line text-base text-ink focus:outline-none focus:border-taupe"
                />
                <button type="button" onClick={() => onChange(value.filter(c => c.id !== color.id))} aria-label={`Remove ${color.name || 'color'}`} className="w-11 h-11 shrink-0 flex items-center justify-center text-ink-faint hover:text-danger cursor-pointer">
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add a color: photo on the left, name on the right — same as the rows above */}
      <div className="flex items-center gap-2 border border-dashed border-line-strong bg-white p-1.5">
        {addingDefault ? (
          <div className="relative w-12 h-12 shrink-0 bg-sunken overflow-hidden" title="The first color uses photo #1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {mainPhotoUrl && <img src={mainPhotoUrl} alt="" className="w-full h-full object-cover object-top" />}
            <span className="absolute bottom-0 inset-x-0 bg-ink text-white text-[9px] font-bold uppercase text-center leading-4">Default</span>
          </div>
        ) : (
          <label className="w-12 h-12 shrink-0 bg-sunken overflow-hidden cursor-pointer flex items-center justify-center text-ink-faint hover:text-taupe" title="Add a photo for this color">
            {newUploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : newImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={newImage} alt="" className="w-full h-full object-cover object-top" />
            ) : (
              <Upload size={16} />
            )}
            <input type="file" accept="image/*" className="sr-only" disabled={newUploading} onChange={e => uploadNew(e.target.files?.[0])} />
          </label>
        )}
        <input
          value={nameInput}
          onChange={e => setNameInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={addingDefault ? 'Name the color in photo #1, e.g. Ivory' : 'Color name, e.g. Navy'}
          aria-label="New color name"
          className="flex-1 min-w-0 h-11 px-2.5 bg-surface border border-line text-base text-ink focus:outline-none focus:border-taupe"
        />
        <button type="button" onClick={add} disabled={!nameInput.trim() || newUploading} className="shrink-0 h-11 px-4 bg-taupe text-white text-sm font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}
