import React from 'react';
import {
  Briefcase,
  Building2,
  Cross,
  EyeOff,
  Lock,
  Scissors,
  Shirt,
  Sparkles,
  Stethoscope,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier';

interface SettingsBusinessTypeProps {
  readonly businessType: string;
  readonly onChange: (value: string) => void;
  readonly specializations: string[];
  readonly onSpecializationsChange: (specializations: string[]) => void;
  readonly isFeatured: boolean;
  readonly onFeaturedChange: (value: boolean) => void;
  readonly isHidden: boolean;
  readonly onHiddenChange: (value: boolean) => void;
}

const SPECIALIZATIONS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'barong', label: 'Barong Tagalog', Icon: Shirt },
  { id: 'gown', label: 'Gowns', Icon: Sparkles },
  { id: 'suit', label: 'Suits', Icon: Briefcase },
  { id: 'filipiniana', label: 'Filipiniana', Icon: Sparkles },
  { id: 'uniform', label: 'School / Corporate Uniforms', Icon: Users },
  { id: 'lab_gown', label: 'Lab Gowns', Icon: Cross },
  { id: 'scrub_suit', label: 'Scrub Suits', Icon: Stethoscope },
  { id: 'corporate_wear', label: 'Corporate Wear', Icon: Briefcase },
  { id: 'alteration_repair', label: 'Alterations & Repair', Icon: Scissors },
];

export default function SettingsBusinessType({
  businessType,
  onChange,
  specializations,
  onSpecializationsChange,
  isFeatured,
  onFeaturedChange,
  isHidden,
  onHiddenChange,
}: SettingsBusinessTypeProps) {
  const { isGated } = useSubscriptionTier();
  const featuredGated = isGated('featured_visibility');

  const toggleSpecialization = (id: string) => {
    if (specializations.includes(id)) {
      onSpecializationsChange(specializations.filter(s => s !== id));
    } else {
      onSpecializationsChange([...specializations, id]);
    }
  };

  const options = [
    {
      value: 'tailoring_shop',
      label: 'Tailoring Shop',
      desc: 'Custom measurements, job orders & production tracking',
      Icon: Scissors,
    },
    {
      value: 'fashion_designer',
      label: 'Fashion Designer',
      desc: 'Portfolio showcase, catalog of original designs & commissions',
      Icon: Sparkles,
    },
    {
      value: 'hybrid',
      label: 'Hybrid',
      desc: 'Both tailoring services and original fashion designs',
      Icon: Building2,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-line rounded-2xl p-6">
        <h2 className="text-lg font-medium text-ink mb-2">Business Type</h2>
        <p className="text-sm text-ink-muted mb-5">
          Select the type that best describes your business. This controls which features are highlighted on your
          public profile.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {options.map(opt => {
            const OptionIcon = opt.Icon;
            return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                businessType === opt.value
                  ? 'border-taupe bg-canvas'
                : 'border-line hover:border-line-strong bg-white'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-canvas border border-line flex items-center justify-center mb-2 text-taupe">
                <OptionIcon size={18} />
              </div>
              <div className="font-semibold text-ink text-sm mb-1">{opt.label}</div>
              <div className="text-xs text-ink-faint leading-snug">{opt.desc}</div>
              {businessType === opt.value && <div className="mt-2 text-xs font-medium text-taupe">✓ Selected</div>}
            </button>
            );
          })}
        </div>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-6">
        <h2 className="text-lg font-medium text-ink mb-2">Garment Specializations</h2>
        <p className="text-sm text-ink-muted mb-5">
          Select the garment types your shop specializes in. Customers discover shops by specialization when
          searching the map, so this directly affects how often you show up in results.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SPECIALIZATIONS.map(spec => {
            const isChecked = specializations.includes(spec.id);
            const SpecIcon = spec.Icon;
            return (
              <button
                key={spec.id}
                type="button"
                onClick={() => toggleSpecialization(spec.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all text-left ${
                  isChecked
                    ? 'border-taupe bg-canvas text-ink'
                    : 'border-line bg-white text-ink-body hover:bg-canvas'
                  }`}
              >
                <SpecIcon size={16} className="shrink-0 text-current" />
                <span className="flex-1">{spec.label}</span>
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] shrink-0 ${
                    isChecked ? 'border-taupe bg-taupe text-white' : 'border-line'
                  }`}
                >
                  {isChecked ? '✓' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-ink mb-1 flex items-center gap-2">
              Shop Visibility
              {isHidden && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sunken text-ink-muted border border-line">
                  <EyeOff size={10} /> Hidden
                </span>
              )}
            </h2>
            <p className="text-sm text-ink-muted max-w-md">
              {isHidden
                ? "Your shop is hidden — customers can't find or view it right now. You can still edit everything here while hidden."
                : 'Your shop is visible to customers. Turn this off to temporarily take your storefront down without deleting anything.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onHiddenChange(!isHidden)}
            className={`shrink-0 relative w-12 h-7 rounded-full transition-colors ${!isHidden ? 'bg-taupe' : 'bg-line'}`}
            aria-pressed={!isHidden}
            aria-label="Toggle shop visibility"
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${!isHidden ? 'translate-x-5' : ''}`}
            />
          </button>
        </div>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-ink mb-1 flex items-center gap-2">
              Featured Shop Placement
              {featuredGated && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                  <Zap size={10} /> Premium
                </span>
              )}
            </h2>
            <p className="text-sm text-ink-muted max-w-md">
              {featuredGated
                ? 'Get pinned as a "Featured Shop" at the top of relevant search results. Upgrade to Premium to unlock this.'
                : 'Pin your shop as a "Featured Shop" at the top of relevant customer search results.'}
            </p>
          </div>
          {featuredGated ? (
            <Link
              href="/dashboard/billing"
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <Lock size={13} /> Upgrade
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onFeaturedChange(!isFeatured)}
              className={`shrink-0 relative w-12 h-7 rounded-full transition-colors ${isFeatured ? 'bg-taupe' : 'bg-line'}`}
              aria-pressed={isFeatured}
              aria-label="Toggle featured shop placement"
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${isFeatured ? 'translate-x-5' : ''}`}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
