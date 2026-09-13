'use client';

import React from 'react';

interface SkeletonProps {
  readonly className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-line rounded-lg animate-pulse ${className}`}
    />
  );
}

export function SkeletonText({ lines = 2, className = '' }: { readonly lines?: number; readonly className?: string }) {
  const keys = ['line-1', 'line-2', 'line-3', 'line-4', 'line-5', 'line-6', 'line-7', 'line-8', 'line-9', 'line-10'].slice(0, lines);
  return (
    <div className={`space-y-2 ${className}`}>
      {keys.map((keyId, i) => (
        <Skeleton
          key={keyId}
          className={`h-3 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonMetricCard() {
  return (
    <div className="bg-surface border border-line rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function SkeletonCard({ className = '' }: { readonly className?: string }) {
  return (
    <div className={`bg-white border border-line rounded-2xl p-6 ${className}`}>
      <Skeleton className="h-5 w-40 mb-4" />
      <SkeletonText lines={3} />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => <SkeletonMetricCard key={`metric-${i}`} />)}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>

      {/* Bottom chart */}
      <div className="bg-surface border border-line rounded-2xl p-6">
        <Skeleton className="h-5 w-48 mb-6" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      {/* Tab bar */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={`tab-${i}`} className="h-10 w-32 rounded-xl" />
        ))}
      </div>
      {/* Cards */}
      {Array.from({ length: 3 }, (_, i) => <SkeletonCard key={`card-${i}`} />)}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { readonly rows?: number; readonly cols?: number }) {
  return (
    <div className="w-full bg-surface border border-line rounded-xl overflow-hidden animate-pulse">
      <div className="h-11 bg-canvas border-b border-line px-4 flex items-center gap-4">
        {Array.from({ length: cols }, (_, i) => (
          <div key={`th-${i}`} className="h-3 bg-line rounded w-24" />
        ))}
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }, (_, r) => (
          <div key={`tr-${r}`} className="px-4 py-3.5 flex items-center gap-4">
            {Array.from({ length: cols }, (_, c) => (
              <div
                key={`td-${r}-${c}`}
                className={`h-3.5 bg-line/70 rounded ${
                  c === 0 ? 'w-32' : c === cols - 1 ? 'w-16 ml-auto' : 'w-24'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({
  count = 8,
  cols = 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
}: {
  readonly count?: number;
  readonly cols?: string;
}) {
  return (
    <div className={`grid ${cols} gap-4 animate-pulse`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={`card-skel-${i}`} className="bg-surface border border-line rounded-2xl overflow-hidden flex flex-col">
          <div className="h-44 bg-line/60 w-full" />
          <div className="p-4 space-y-2.5 flex-1">
            <div className="h-4 bg-line rounded w-3/4" />
            <div className="h-3 bg-line/60 rounded w-1/2" />
            <div className="h-5 bg-line/80 rounded w-1/3 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function KanbanSkeleton({ columns = 4 }: { readonly columns?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 animate-pulse">
      {Array.from({ length: columns }, (_, c) => (
        <div key={`col-${c}`} className="w-72 shrink-0 bg-canvas/60 border border-line rounded-2xl p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <div className="h-4 bg-line rounded w-24" />
            <div className="h-5 w-6 bg-line rounded-full" />
          </div>
          {Array.from({ length: 3 }, (_, card) => (
            <div key={`card-${c}-${card}`} className="bg-surface border border-line rounded-xl p-3.5 space-y-2.5 shadow-2xs">
              <div className="flex justify-between items-center">
                <div className="h-3 bg-line rounded w-16" />
                <div className="h-4 bg-line rounded-full w-12" />
              </div>
              <div className="h-4 bg-line/80 rounded w-3/4" />
              <div className="h-3 bg-line/50 rounded w-1/2" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function DeckSkeleton() {
  return (
    <div className="p-3.5 sm:p-5 max-w-4xl mx-auto space-y-4 animate-pulse">
      {/* Header bar skeleton: Stepper title left, Next/Prev buttons right */}
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <div className="flex items-center gap-2">
          <div className="h-3.5 bg-line rounded w-28" />
          <div className="h-5 bg-line rounded-full w-14" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-7 w-16 bg-line rounded-md" />
          <div className="h-7 w-16 bg-line rounded-md" />
        </div>
      </div>

      {/* 2-Column Content Grid matching real deck layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        {/* Left Column: Details card skeleton */}
        <div className="bg-canvas/30 border border-line rounded-xl p-4 space-y-3">
          <div className="space-y-1.5 pb-2 border-b border-line/60">
            <div className="h-3 bg-line rounded w-24" />
            <div className="h-5 bg-line rounded w-44" />
          </div>

          <div className="space-y-3 pt-1">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={`skel-row-${i}`} className="flex justify-between items-center">
                <div className="h-3 bg-line/60 rounded w-20" />
                <div className="h-3.5 bg-line rounded w-28" />
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-3 border-t border-line/60">
            <div className="h-9 bg-line rounded-lg flex-1" />
            <div className="h-9 bg-line rounded-lg flex-1" />
          </div>
        </div>

        {/* Right Column: Receipt screenshot placeholder */}
        <div className="bg-canvas/40 border border-line rounded-xl p-3 flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-full h-64 bg-line/60 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
