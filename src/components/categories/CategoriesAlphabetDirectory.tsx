'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ALPHABET, buildDirectoryEntries, groupByLetter } from './categoriesDirectoryData';

export default function CategoriesAlphabetDirectory({ query }: Readonly<{ query: string }>) {
  const grouped = useMemo(() => {
    const entries = buildDirectoryEntries();
    const q = query.trim().toLowerCase();
    const filtered = q ? entries.filter((e) => e.label.toLowerCase().includes(q)) : entries;
    return groupByLetter(filtered);
  }, [query]);

  const activeLetters = ALPHABET.filter((letter) => grouped.has(letter));

  if (activeLetters.length === 0) {
    return (
      <p className="mobile-body-md text-ink-muted py-8 text-center">
        No categories match &ldquo;{query}&rdquo;.
      </p>
    );
  }

  return (
    <div>
      {/* Alphabet jump bar */}
      <nav
        aria-label="Alphabetical jump bar"
        className="flex flex-wrap gap-1.5 py-3 border-y border-line mb-6 sticky top-[52px] sm:top-[64px] bg-canvas z-10"
      >
        {ALPHABET.map((letter) => {
          const isActive = grouped.has(letter);
          return isActive ? (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="w-8 h-8 flex items-center justify-center text-xs font-bold text-ink border border-line hover:bg-ink hover:text-white transition-colors"
            >
              {letter}
            </a>
          ) : (
            <span
              key={letter}
              className="w-8 h-8 flex items-center justify-center text-xs font-bold text-ink-faint/50"
            >
              {letter}
            </span>
          );
        })}
      </nav>

      {/* Full directory, grouped by letter */}
      <div className="space-y-8">
        {activeLetters.map((letter) => (
          <section key={letter} id={`letter-${letter}`} className="scroll-mt-28">
            <h3 className="mobile-h3 text-taupe-dark mb-3">{letter}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
              {grouped.get(letter)!.map((entry) => (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className="min-h-[44px] flex flex-col justify-center border-b border-line/60 hover:border-taupe group"
                >
                  <span className="mobile-body-md text-ink group-hover:text-taupe-dark truncate">
                    {entry.label}
                  </span>
                  <span className="mobile-caption text-ink-faint truncate">{entry.breadcrumb}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
