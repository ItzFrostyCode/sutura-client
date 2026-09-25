import React from 'react';
import { Trash2, Upload, Loader2 } from 'lucide-react';
import { Service } from '@/components/services/serviceHelpers';

interface StoreWorkCreatePostFormProps {
  readonly postImageUrls: string[];
  readonly postUploading: boolean;
  readonly postCaption: string;
  readonly setPostCaption: (c: string) => void;
  readonly postServiceId: string;
  readonly setPostServiceId: (s: string) => void;
  readonly postSubmitting: boolean;
  readonly ownerServices: Service[];
  readonly maxImages?: number;
  readonly onCancel: () => void;
  readonly onSubmit: (e: React.SyntheticEvent) => void;
  readonly onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onRemoveImage: (url: string) => void;
}

export default function StoreWorkCreatePostForm({
  postImageUrls,
  postUploading,
  postCaption,
  setPostCaption,
  postServiceId,
  setPostServiceId,
  postSubmitting,
  ownerServices,
  maxImages = 12,
  onCancel,
  onSubmit,
  onImageUpload,
  onRemoveImage,
}: StoreWorkCreatePostFormProps) {
  return (
    <form onSubmit={onSubmit} className="bg-surface border border-line rounded-2xl p-4 sm:p-5 space-y-3.5 mb-4 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Photos</span>
        <span className={`text-xs font-medium ${postImageUrls.length >= maxImages ? 'text-danger' : 'text-ink-muted'}`}>
          {postImageUrls.length} / {maxImages} photos
        </span>
      </div>

      {postImageUrls.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {postImageUrls.map((url) => (
            <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-line group/thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onRemoveImage(url)}
                title="Remove photo"
                className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity focus:outline-none cursor-pointer"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {postImageUrls.length < maxImages && (
        <div className="flex justify-center px-4 py-5 border-2 border-line border-dashed rounded-xl bg-canvas/50">
          <div className="space-y-1.5 text-center">
            {postUploading ? (
              <Loader2 className="mx-auto h-8 w-8 text-ink-faint animate-spin" />
            ) : (
              <>
                <Upload className="mx-auto h-8 w-8 text-taupe" />
                <div className="flex text-sm text-ink-muted justify-center">
                  <label
                    htmlFor="inline-post-image"
                    className="relative cursor-pointer bg-transparent rounded-md font-semibold text-taupe hover:underline focus-within:outline-none"
                  >
                    <span>{postImageUrls.length === 0 ? 'Upload photos' : 'Add more photos'}</span>
                    <input
                      id="inline-post-image"
                      type="file"
                      multiple
                      className="sr-only"
                      accept="image/*"
                      onChange={onImageUpload}
                      disabled={postUploading}
                    />
                  </label>
                </div>
                <p className="text-xs text-ink-faint">PNG, JPG — up to {maxImages} photos per post</p>
              </>
            )}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="post-caption-textarea" className="sr-only">Caption</label>
        <textarea
          id="post-caption-textarea"
          rows={3}
          value={postCaption}
          onChange={(e) => setPostCaption(e.target.value)}
          placeholder="e.g. Thank you to the Barangay Ballers team for trusting us with your jerseys!"
          className="w-full px-3.5 py-3 bg-canvas border border-line rounded-lg text-base text-ink resize-none focus:outline-none focus:border-taupe placeholder:text-ink-faint placeholder:text-base"
        />
      </div>

      <div>
        <label htmlFor="post-service-select" className="sr-only">Related Service</label>
        <select
          id="post-service-select"
          value={postServiceId}
          onChange={(e) => setPostServiceId(e.target.value)}
          className="w-full h-[52px] px-3.5 bg-canvas border border-line rounded-lg text-base text-ink focus:outline-none focus:border-taupe"
        >
          <option value="">No related service</option>
          {ownerServices.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[48px] h-[52px] px-5 rounded-lg text-sm font-medium text-ink-body hover:bg-canvas transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={postSubmitting || postImageUrls.length === 0 || !postCaption.trim()}
          className="min-h-[48px] h-[52px] px-6 rounded-lg text-sm font-semibold text-white bg-taupe hover:bg-taupe-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
        >
          {postSubmitting && <Loader2 size={16} className="animate-spin" />}
          Post to Storefront
        </button>
      </div>
    </form>
  );
}
