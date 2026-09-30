import React, { useState } from 'react';
import { Loader2, Upload, Plus, X } from 'lucide-react';
import api from '@/lib/axios';
import { ColorItem } from '../catalogTypes';

interface CatalogColorEditorProps {
  readonly value: ColorItem[];
  readonly onChange: (value: ColorItem[]) => void;
  readonly storeId: number;
}

/**
 * Colors this design can actually be tailored in — add one, give it a
 * reference photo, or remove it. Deliberately no "available"/"unavailable"
 * toggle: this is a made-to-order tailoring shop, not a retail store with
 * stock to run out of. A color a shop no longer offers gets removed from
 * this list outright, never just hidden/greyed-out (that would imply an
 * inventory concept this system doesn't track — see AGENTS.md's explicit
 * out-of-scope list).
 */
export default function CatalogColorEditor({ value, onChange, storeId }: CatalogColorEditorProps) {
  const [nameInput, setNameInput] = useState('');

  const addColor = () => {
    const name = nameInput.trim();
    if (!name || value.some(c => c.name.toLowerCase() === name.toLowerCase())) return;
    onChange([...value, { id: `color-${Date.now()}`, name, image_url: '' }]);
    setNameInput('');
  };

  const removeColor = (id: string) => {
    onChange(value.filter(c => c.id !== id));
  };

  const uploadColorImage = async (id: string, file: File | undefined) => {
    if (!file) return;
    onChange(value.map(c => (c.id === id ? { ...c, uploading: true } : c)));
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`/stores/${storeId}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url || res.data?.url || '';
      onChange(value.map(c => (c.id === id ? { ...c, image_url: url, uploading: false } : c)));
    } catch {
      onChange(value.map(c => (c.id === id ? { ...c, uploading: false } : c)));
    }
  };

  return (
    <div className="border-t border-line pt-4 mt-2">
      <span className="block text-xs font-semibold text-ink-muted mb-1 uppercase tracking-wider">
        Color <span className="text-ink-faint normal-case font-normal">(optional)</span>
      </span>
      <p className="text-[11px] text-ink-faint mt-0.5 mb-3 max-w-md">
        Just a name and a photo — no color codes. The first color is the default customers see selected.
        Colors are what this design can be tailored in, not stock on hand, so remove one if you no
        longer offer it.
      </p>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2.5 mb-3">
          {value.map((color, colorIdx) => (
            <div
              key={color.id}
              className="flex flex-col w-[84px] border border-line rounded-none overflow-hidden shrink-0"
            >
              <label
                htmlFor={`color-image-${color.id}`}
                className="relative w-full aspect-square bg-canvas cursor-pointer group flex items-center justify-center"
              >
                <input
                  id={`color-image-${color.id}`}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => uploadColorImage(color.id, e.target.files?.[0])}
                  disabled={color.uploading}
                />
                {colorIdx === 0 && (
                  <span className="absolute top-0 left-0 z-10 bg-ink text-white text-[9px] font-bold uppercase px-1.5 py-0.5">Default</span>
                )}
                {color.uploading ? (
                  <Loader2 className="h-5 w-5 text-ink-faint animate-spin" />
                ) : color.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={color.image_url} alt={color.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-ink-faint group-hover:text-taupe transition-colors">
                    <Upload size={14} />
                    <span className="text-[9px]">Photo</span>
                  </div>
                )}
              </label>
              <div className="flex items-center justify-between px-1.5 py-1 border-t border-line">
                <span className="text-[11px] font-medium text-ink-body truncate" title={color.name}>
                  {color.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeColor(color.id)}
                  title={`Remove ${color.name}`}
                  className="shrink-0 text-ink-faint hover:text-danger focus:outline-none"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 max-w-xs">
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addColor();
            }
          }}
          placeholder="e.g. Ivory"
          className="flex-1 px-3 py-1.5 bg-surface border border-line rounded-lg text-sm focus:outline-none focus:border-taupe"
        />
        <button
          type="button"
          onClick={addColor}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-taupe/10 text-taupe text-xs font-semibold hover:bg-taupe/20 transition-colors flex items-center gap-1"
        >
          <Plus size={12} /> Add
        </button>
      </div>
    </div>
  );
}
