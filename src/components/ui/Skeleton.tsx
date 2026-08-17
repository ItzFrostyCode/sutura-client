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
