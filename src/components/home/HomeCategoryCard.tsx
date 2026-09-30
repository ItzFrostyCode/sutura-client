'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { CategoryVisualConfig } from './homeCategoryData';

interface HomeCategoryCardProps {
  readonly href: string;
  readonly category: {
    value: string;
    label: string;
  };
  readonly visual: CategoryVisualConfig;
  readonly isPriority?: boolean;
}

export default function HomeCategoryCard({
  href,
  category,
  visual,
  isPriority = false,
}: HomeCategoryCardProps) {
  return (
    <Link
      href={href}
      className="group relative w-[200px] sm:w-[230px] md:w-[250px] h-[280px] sm:h-[320px] shrink-0 snap-start rounded-none overflow-hidden border border-line hover:border-ink bg-sunken transition-colors block"
    >
      {/* Background Image */}
      <Image
        src={visual.imageUrl}
        alt={category.label}
        fill
        sizes="(max-width: 640px) 200px, (max-width: 768px) 230px, 250px"
        priority={isPriority}
        className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
      />

      {/* Flat bottom gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent transition-opacity duration-300" />

      {/* Flat bottom text banner — crisp white text only */}
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 z-10">
        <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
          {category.label}
        </h3>
      </div>
    </Link>
  );
}
