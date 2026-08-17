'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, Zap } from 'lucide-react';
import { useSubscriptionTier, type GatedFeature } from '@/hooks/useSubscriptionTier';

interface SubscriptionGateProps {
  feature: GatedFeature;
  children: React.ReactNode;
}

// ── Labels shown in the lock overlay ──────────────────────────────────────────
const FEATURE_LABELS: Record<GatedFeature, string> = {
  portfolio:          'Visual Portfolio Gallery',
  staff:              'Staff Management',
  analytics:          'Visual Dashboard & Analytics',
  notifications:      'SMS/Email Notifications',
  inquiry:            'Direct Customer Inquiries',
  boosted_visibility: 'Boosted Search Visibility',
  reports:            'Sales Reports & Exports',
  featured_visibility:'Featured Shop Visibility',
  custom_branding:    'Custom Branding',
  advanced_dashboard: 'Advanced Dashboard',
};

// ── Which plan unlocks each feature ──────────────────────────────────────────
const REQUIRED_PLAN: Record<GatedFeature, 'Pro' | 'Premium'> = {
  portfolio:          'Pro',
  staff:              'Pro',
  analytics:          'Pro',
  notifications:      'Pro',
  inquiry:            'Pro',
  boosted_visibility: 'Pro',
  reports:            'Premium',
  featured_visibility:'Premium',
  custom_branding:    'Premium',
  advanced_dashboard: 'Premium',
};

// ── Feature descriptions shown below the lock title ──────────────────────────
const FEATURE_DESC: Record<GatedFeature, string> = {
  portfolio:          "Showcase your work with a photo-rich portfolio visible to customers browsing your shop profile.",
  staff:              "Add staff members, assign job stages, and manage your whole team from one place.",
  analytics:          "Get a bird\u2019s-eye view of your shop with visual charts for revenue, orders, and customers.",
  notifications:      "Automatically send SMS or email updates to customers when their order status changes.",
  inquiry:            "Let customers send direct messages to your shop from your public profile.",
  boosted_visibility: "Appear higher in search results than Basic shops for your garment specializations.",
  reports:            "Download detailed income and order reports to track monthly sales performance.",
  featured_visibility:"Get pinned as a \u201cFeatured Shop\u201d at the top of relevant search results.",
  custom_branding:    "Apply your own shop colors, logo, and identity across your public storefront.",
  advanced_dashboard: "Access in-depth analytics: staff productivity, revenue trends, and forecasts.",
};

export default function SubscriptionGate({ feature, children }: Readonly<SubscriptionGateProps>) {
  const { loading, isGated } = useSubscriptionTier();

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-ink-faint">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-line" />
          <div className="h-3 w-32 bg-line rounded" />
        </div>
      </div>
    );
  }

  if (isGated(feature)) {
    const requiredPlan = REQUIRED_PLAN[feature];
    const isPremiumGate = requiredPlan === 'Premium';

    return (
      <div className="relative min-h-[450px] w-full rounded-3xl overflow-hidden flex items-center justify-center p-8 bg-canvas/30 border border-line">
        {/* Blurred content ghost */}
        <div className="absolute inset-0 blur-[6px] opacity-10 select-none pointer-events-none">
          {children}
        </div>

        {/* Lock Overlay Card */}
        <div className="relative z-10 max-w-sm w-full bg-surface border border-line rounded-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-200">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isPremiumGate
              ? 'bg-amber-50 border border-amber-100 text-amber-600'
              : 'bg-sunken border border-line text-taupe'
          }`}>
            {isPremiumGate ? <Zap size={22} /> : <Lock size={22} />}
          </div>

          {/* Plan badge */}
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-3 ${
            isPremiumGate
              ? 'bg-amber-50 text-amber-700 border border-amber-100'
              : 'bg-sunken text-taupe border border-line'
          }`}>
            {requiredPlan} Feature
          </span>

          <h3 className="text-[17px] font-bold text-ink mb-2">{FEATURE_LABELS[feature]}</h3>
          <p className="text-[13px] text-ink-muted mb-6 leading-relaxed">
            {FEATURE_DESC[feature]}
          </p>

          <Link
            href="/dashboard/billing"
            className={`inline-flex justify-center items-center w-full font-semibold py-3 rounded-xl text-sm transition-all cursor-pointer gap-2 ${
              isPremiumGate
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-taupe hover:bg-taupe/90 text-white'
            }`}
          >
            <Zap size={15} />
            Upgrade to {requiredPlan}
          </Link>

          <p className="text-[11px] text-ink-faint mt-3">
            View all plans on the <Link href="/dashboard/billing" className="underline hover:text-ink-body">Billing page</Link>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
