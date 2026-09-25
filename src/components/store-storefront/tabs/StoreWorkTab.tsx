import React from 'react';
import { Plus } from 'lucide-react';
import { PublicStorePost, StoreProfile } from '../types';
import { Service } from '@/components/services/serviceHelpers';
import StoreWorkPostCard from '../work/StoreWorkPostCard';
import StoreWorkCreatePostForm from '../work/StoreWorkCreatePostForm';

interface StoreWorkTabProps {
  readonly posts: PublicStorePost[];
  readonly store: StoreProfile;
  readonly storeId: string;
  readonly isOwnerViewingOwnStore: boolean;
  readonly isAddingPost: boolean;
  readonly setIsAddingPost: (v: boolean) => void;
  readonly postImageUrls: string[];
  readonly postUploading: boolean;
  readonly postCaption: string;
  readonly setPostCaption: (c: string) => void;
  readonly postServiceId: string;
  readonly setPostServiceId: (s: string) => void;
  readonly postSubmitting: boolean;
  readonly ownerServices: Service[];
  readonly submitPost: (e: React.SyntheticEvent) => void;
  readonly deletePost: (id: number) => void;
  readonly handlePostImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly removePostImage: (url: string) => void;
  readonly onOpenLightbox: (images: string[], index: number) => void;
}

export default function StoreWorkTab({
  posts,
  store,
  storeId,
  isOwnerViewingOwnStore,
  isAddingPost,
  setIsAddingPost,
  postImageUrls,
  postUploading,
  postCaption,
  setPostCaption,
  postServiceId,
  setPostServiceId,
  postSubmitting,
  ownerServices,
  submitPost,
  deletePost,
  handlePostImageUpload,
  removePostImage,
  onOpenLightbox,
}: StoreWorkTabProps) {
  if (posts.length === 0 && !isOwnerViewingOwnStore) return null;

  return (
    <section aria-labelledby="store-work-title" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="store-work-title" className="mobile-h2 text-ink">
            Our Work
          </h2>
          <p className="mobile-body-sm text-ink-muted mt-1">
            A look at recent custom orders we&apos;ve completed for happy customers.
          </p>
        </div>

        {isOwnerViewingOwnStore && !isAddingPost && (
          <button
            type="button"
            onClick={() => setIsAddingPost(true)}
            className="shrink-0 min-h-[44px] h-[48px] flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white text-sm font-semibold px-4 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer active:scale-[0.98]"
          >
            <Plus size={18} /> Add Post
          </button>
        )}
      </div>

      {isOwnerViewingOwnStore && isAddingPost && (
        <StoreWorkCreatePostForm
          postImageUrls={postImageUrls}
          postUploading={postUploading}
          postCaption={postCaption}
          setPostCaption={setPostCaption}
          postServiceId={postServiceId}
          setPostServiceId={setPostServiceId}
          postSubmitting={postSubmitting}
          ownerServices={ownerServices}
          onCancel={() => setIsAddingPost(false)}
          onSubmit={submitPost}
          onImageUpload={handlePostImageUpload}
          onRemoveImage={removePostImage}
        />
      )}

      {posts.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-2xl border border-line p-6 shadow-xs">
          <p className="mobile-body-sm text-ink-muted">No posts yet. Share your first completed order above.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <StoreWorkPostCard
              key={post.id}
              post={post}
              store={store}
              storeId={storeId}
              isOwnerViewingOwnStore={isOwnerViewingOwnStore}
              onDeletePost={deletePost}
              onOpenLightbox={onOpenLightbox}
            />
          ))}
        </div>
      )}
    </section>
  );
}
