import React from 'react';
import Link from 'next/link';
import { BookOpen, Store, Building2, Tag, ShoppingBag, UserCog, Calendar, Scissors, CreditCard, LayoutDashboard, type LucideIcon } from 'lucide-react';

interface OnboardingStep {
  step: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  href: string;
}

// Used to be 3 shallow steps that also referenced "rental deposits" — a
// feature that doesn't exist in this app (rental lifecycle management was
// explicitly excluded from SUTURA's approved thesis scope). Covers the
// real setup order a new shop owner actually needs, matching what's
// genuinely built: storefront → branches → catalog/services → staff →
// day-to-day ops → money tracking.
const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    step: 'Step 1',
    title: 'Set Up Your Storefront',
    desc: 'Open your Shop Profile to add your logo, banner, description, and social links, set your map location and operating hours, and configure your GCash/bank details so they print on receipts. This is what customers see when they find you.',
    icon: Store,
    href: '/dashboard/profile',
  },
  {
    step: 'Step 2',
    title: 'Add Your Branches',
    desc: 'If you operate from more than one location, add each branch here — address, contact number, and a guide photo customers can use to find it. Every branch-scoped view in the dashboard (Jobs, Appointments, Payments, Reports) can be filtered per branch from the header selector.',
    icon: Building2,
    href: '/dashboard/branches',
  },
  {
    step: 'Step 3',
    title: 'List Your Services & Pricing',
    desc: 'Declare what you offer — Barong, Gown, School Uniforms, Jerseys, Alterations, or custom services — with pricing tiers, estimated turnaround, and minimum order quantities for bulk work. You can bundle related services into Packages at a combo price too.',
    icon: Tag,
    href: '/dashboard/services',
  },
  {
    step: 'Step 4',
    title: 'Build Your Design Catalog',
    desc: 'Add photos of past work customers can browse and order from directly — made-to-order, not off-the-shelf inventory. Each item can link straight into a Job Order so its reference photo carries over automatically when a customer orders it.',
    icon: ShoppingBag,
    href: '/dashboard/catalog',
  },
  {
    step: 'Step 5',
    title: 'Add Your Staff',
    desc: 'Bring on tailors, cutters, designers, and other roles, assign each to a branch, and set their specializations. Staff get their own profile with bio, workload, and job assignment history — visible to you only, never to customers.',
    icon: UserCog,
    href: '/dashboard/staff',
  },
  {
    step: 'Step 6',
    title: 'Manage Appointments',
    desc: 'Book fittings, consultations, and measurement sessions for walk-in or online customers. Each appointment auto-calculates duration by type, and a fitting can convert straight into a Job Order once measurements are confirmed.',
    icon: Calendar,
    href: '/dashboard/appointments',
  },
  {
    step: 'Step 7',
    title: 'Track Production in Jobs',
    desc: 'Every order moves through the real production pipeline — Design, Pattern Making, Cutting, Sewing, Fitting, Final Adjustments, QC, Ready for Pickup — with a 50% downpayment gate before cutting starts and staff assigned per stage. Bulk orders (a team’s jersey set, a school’s uniform batch) get a roster-based override.',
    icon: Scissors,
    href: '/dashboard/jobs',
  },
  {
    step: 'Step 8',
    title: 'Collect Payments & Review Reports',
    desc: 'Log payments and verify GCash/bank receipts as they come in, apply discounts, and reject bad receipts with a reason. Reports rolls all of it up — revenue, staff productivity, branch comparisons, and proactive alerts for unclaimed pickups or jobs stuck on hold.',
    icon: CreditCard,
    href: '/dashboard/payments',
  },
];

export default function WelcomeView() {
  return (
    <div className="bg-white border border-[#EBE6E0] rounded-3xl p-8 max-w-5xl mx-auto shadow-xs space-y-8 animate-fade-in text-[#2D2A26]">
      <div className="text-center space-y-3 pb-6 border-b border-[#FAF6F3]">
        <div className="w-16 h-16 bg-[#FAF6F3] rounded-full flex items-center justify-center mx-auto text-[#9A8073]">
          <BookOpen size={28} />
        </div>
        <h2 className="text-2xl font-heading font-semibold text-[#2D2A26]">Welcome to SUTURA Tailoring Tracker</h2>
        <p className="text-[#827A73] text-sm max-w-lg mx-auto">A complete guide to setting up and running your shop on SUTURA, from your first storefront edit to tracking a finished order.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ONBOARDING_STEPS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-2xl p-6 flex gap-4 transition-all hover:border-[#D1C7BD]">
              <div className="bg-white border border-[#EBE6E0] w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-[#9A8073]">
                <Icon size={22} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#9A8073] uppercase tracking-wider">{item.step}</span>
                <h4 className="font-semibold text-sm text-[#2D2A26]">{item.title}</h4>
                <p className="text-xs text-[#827A73] leading-relaxed mb-3">{item.desc}</p>
                <Link href={item.href} className="text-xs font-semibold text-[#9A8073] hover:text-[#91756A] flex items-center gap-1.5 transition-colors">
                  Configure now →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-2xl p-6 flex gap-4">
        <div className="bg-white border border-[#EBE6E0] w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-[#9A8073]">
          <LayoutDashboard size={22} />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-[#9A8073] uppercase tracking-wider">Once you&apos;re set up</span>
          <h4 className="font-semibold text-sm text-[#2D2A26]">This Home page is your daily overview</h4>
          <p className="text-xs text-[#827A73] leading-relaxed">
            Needs Attention flags overdue orders, pending deposits, unclaimed pickups, and jobs stuck on hold. Use the branch selector in the header to switch between locations — it filters everything on this page and across Jobs, Appointments, Payments, and Reports.
          </p>
        </div>
      </div>

      <div className="pt-6 border-t border-[#FAF6F3] flex justify-between items-center flex-wrap gap-4 text-xs text-[#A8A19A]">
        <p>Need support? Feel free to contact our administrative team via Support Tickets.</p>
        <Link href="/dashboard/support" className="px-4 py-2 bg-[#9A8073] hover:bg-[#91756A] text-white rounded-lg font-medium transition-all shadow-xs">
          Create Ticket
        </Link>
      </div>
    </div>
  );
}
