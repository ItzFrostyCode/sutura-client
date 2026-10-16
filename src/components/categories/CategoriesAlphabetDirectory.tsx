'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ALPHABET, SHOPEE_ALPHABET_DIRECTORY } from './categoriesDirectoryData';

interface CategoriesAlphabetDirectoryProps {
  readonly query: string;
}

export default function CategoriesAlphabetDirectory({ query }: CategoriesAlphabetDirectoryProps) {
  // Filter the directory by query if provided
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SHOPEE_ALPHABET_DIRECTORY;

    return SHOPEE_ALPHABET_DIRECTORY.map((group) => {
      const filteredCategories = group.categories
        .map((cat) => {
          const categoryMatches = cat.title.toLowerCase().includes(q);
          const matchedSubs = cat.subCategories.filter((sub) =>
            sub.label.toLowerCase().includes(q)
          );

          if (categoryMatches) {
            // Keep all subcategories if category matches
            return cat;
          }
          if (matchedSubs.length > 0) {
            return {
              ...cat,
              subCategories: matchedSubs,
            };
          }
          return null;
        })
        .filter((cat): cat is NonNullable<typeof cat> => cat !== null);

      if (filteredCategories.length > 0) {
        return {
          ...group,
          categories: filteredCategories,
        };
      }
      return null;
    }).filter((group): group is NonNullable<typeof group> => group !== null);
  }, [query]);

  // Set of active letters present in filtered groups
  const activeLettersSet = useMemo(() => {
    return new Set(filteredGroups.map((g) => g.letter));
  }, [filteredGroups]);

  const handleLetterClick = (e: React.MouseEvent<HTMLAnchorElement>, letter: string) => {
    e.preventDefault();
    const target = document.getElementById(`letter-${letter}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="mt-8">
      {/* A–Z Index Bar (Shopee Style) */}
      <nav
        aria-label="A to Z Alphabet Index Bar"
        className="sticky top-[56px] sm:top-[68px] z-30 bg-surface/95 backdrop-blur-md py-3.5 px-4 border border-line shadow-2xs mb-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2 max-w-full overflow-x-auto hide-scrollbar">
          {ALPHABET.map((letter) => {
            const isActive = activeLettersSet.has(letter);
            return isActive ? (
              <a
                key={letter}
                href={`#letter-${letter}`}
                onClick={(e) => handleLetterClick(e, letter)}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold text-taupe-dark hover:text-white hover:bg-taupe transition-all rounded-xs cursor-pointer"
                title={`Jump to letter ${letter}`}
              >
                {letter}
              </a>
            ) : (
              <span
                key={letter}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-medium text-ink-faint/30 select-none cursor-default"
              >
                {letter}
              </span>
            );
          })}
        </div>
      </nav>

      {/* Empty State */}
      {filteredGroups.length === 0 && (
        <div className="py-12 text-center bg-surface border border-line">
          <p className="text-ink text-base font-medium">
            No categories match &ldquo;{query}&rdquo;
          </p>
          <p className="text-ink-muted text-xs mt-1">
            Try searching for terms like &ldquo;Barong&rdquo;, &ldquo;Suit&rdquo;, &ldquo;Uniform&rdquo;, or &ldquo;Dress&rdquo;.
          </p>
        </div>
      )}

      {/* Alphabetical Text Directory (4-Column Layout) */}
      <div className="space-y-10">
        {filteredGroups.map((group) => (
          <section
            key={group.letter}
            id={`letter-${group.letter}`}
            className="scroll-mt-36"
          >
            {/* Big Letter Heading */}
            <div className="border-b-2 border-line/80 pb-2 mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-serif">
                {group.letter}
              </h2>
            </div>

            {/* Categories under this letter */}
            <div className="space-y-8">
              {group.categories.map((cat) => (
                <div key={cat.title} className="bg-surface p-5 sm:p-6 border border-line/60 shadow-2xs">
                  {/* Category Title Header */}
                  <div className="mb-4 pb-2 border-b border-line/40">
                    <Link
                      href={cat.categoryHref}
                      className="text-base sm:text-lg font-bold text-taupe-dark hover:text-ink hover:underline transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>{cat.title}</span>
                    </Link>
                  </div>

                  {/* 4-Column Sub-category Links */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2.5">
                    {cat.subCategories.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className="text-xs sm:text-[13px] text-ink-muted hover:text-taupe transition-colors truncate py-0.5 hover:underline"
                        title={sub.label}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
