import React from 'react';
import Link from 'next/link';
import { Trash2, MessageCircle, Calendar } from 'lucide-react';
import { PublicStorePost, StoreProfile } from '../types';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import { getSocialUrl, getMessengerUrl } from '../storeStorefrontHelpers';

interface StoreWorkPostCardProps {
  readonly post: PublicStorePost;
  readonly store: StoreProfile;
  readonly storeId: string;
  readonly isOwnerViewingOwnStore: boolean;
  readonly onDeletePost: (id: number) => void;
  readonly onOpenLightbox: (images: string[], index: number) => void;
}

export default function StoreWorkPostCard({
  post,
  store,
  storeId,
  isOwnerViewingOwnStore,
  onDeletePost,
  onOpenLightbox,
}: StoreWorkPostCardProps) {
  const renderImages = (images: string[]) => {
    const count = images.length;
    if (count <= 1) {
      return (
        <button
          type="button"
          onClick={() => onOpenLightbox(images, 0)}
          className="block w-full aspect-4/3 bg-sunken relative focus:outline-none cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[0]} alt="" className="w-full h-full object-cover" />
        </button>
      );
    }
    const gridCols = count === 3 ? 'grid-cols-3' : 'grid-cols-2';
    const visible = images.slice(0, 4);
    const remaining = count - visible.length;

    return (
      <div className={`grid ${gridCols} gap-0.5 aspect-4/3`}>
        {visible.map((img, i) => (
          <button
            type="button"
            key={img}
            onClick={() => onOpenLightbox(images, i)}
            className="relative overflow-hidden focus:outline-none cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="" className="w-full h-full object-cover" />
            {i === visible.length - 1 && remaining > 0 && (
              <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white font-bold text-lg">
                +{remaining}
              </div>
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <article className="group relative bg-surface border border-line rounded-2xl overflow-hidden w-full shadow-xs">
      {isOwnerViewingOwnStore && (
        <button
          type="button"
          onClick={() => onDeletePost(post.id)}
          title="Remove post"
          className="absolute top-2 right-2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-surface border border-line text-ink-body hover:text-danger focus:outline-none opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all cursor-pointer shadow-xs"
        >
          <Trash2 size={15} />
        </button>
      )}

      <header className="p-4 flex items-center gap-3">
        <StoreLogoAvatar
          src={store.logo_path}
          name={store.name}
          className="w-10 h-10 rounded-full border border-line"
          textClassName="text-sm font-bold text-taupe"
        />
        <div className="min-w-0">
          <p className="font-semibold text-sm text-ink truncate">{store.name}</p>
          <time className="text-xs text-ink-faint">
            {new Date(post.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </time>
        </div>
      </header>

      <div className="bg-sunken relative">{renderImages(post.image_urls)}</div>

      <div className="p-4 space-y-3">
        <p className="text-sm text-ink-body font-normal leading-relaxed whitespace-pre-wrap">{post.caption}</p>

        <div className="pt-2 flex flex-col gap-2.5">
          <a
            href={getMessengerUrl(getSocialUrl(store.social_links, 'facebook'))}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[48px] h-[52px] rounded-lg flex items-center justify-center gap-2 bg-ink hover:bg-taupe text-white text-sm font-semibold transition-colors shadow-xs active:scale-[0.99] cursor-pointer"
          >
            <MessageCircle size={16} /> Inquire About This
          </a>

          {post.service && (
            <Link
              href={`/store/${storeId}/book?service_id=${post.service.id}`}
              className="w-full min-h-[48px] h-[52px] rounded-lg flex items-center justify-center gap-2 bg-surface border border-line hover:bg-sunken text-ink text-sm font-medium transition-colors active:scale-[0.99] cursor-pointer"
            >
              <Calendar size={16} /> Book &quot;{post.service.name}&quot;
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
