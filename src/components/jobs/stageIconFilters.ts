import {
  Layers, AlertTriangle, Palette, Ruler, Printer, Scissors,
  Shirt, UserCheck, CheckCircle2, Store, CheckCheck, Pause,
  type LucideIcon,
} from 'lucide-react';

export interface StageIconFilter {
  id: string;
  title: string;
  icon: LucideIcon;
  dotColor?: string | null;
  iconColor?: string;
}

export interface StageNotifItem {
  key: string;
  title: string;
  desc: string;
  dot: string;
  icon: LucideIcon;
  iconCls: string;
}

export const DEFAULT_NOTIF_PREFS: Record<string, boolean> = {
  pending: true,
  design: true,
  pattern_making: true,
  mass_cutting_printing: true,
  cutting: true,
  sewing: true,
  ready_for_fitting: true,
  qc_ironing: true,
  ready_for_pickup: true,
  completed: true,
  on_hold: true,
};

export const STAGE_NOTIF_ITEMS: StageNotifItem[] = [
  {
    key: 'pending',
    title: 'Pending Feasibility Review',
    desc: 'Orders awaiting initial tailor approval',
    dot: 'bg-amber-500',
    icon: AlertTriangle,
    iconCls: 'text-amber-600',
  },
  {
    key: 'design',
    title: 'Design',
    desc: 'Custom sketching, mockup & fabric finalization',
    dot: 'bg-sky-500',
    icon: Palette,
    iconCls: 'text-sky-600',
  },
  {
    key: 'pattern_making',
    title: 'Pattern Making',
    desc: 'Drafting measurements and pattern templates',
    dot: 'bg-indigo-500',
    icon: Ruler,
    iconCls: 'text-indigo-600',
  },
  {
    key: 'mass_cutting_printing',
    title: 'Mass Cutting & Printing',
    desc: 'Sublimation printing, embroidery & bulk cutting',
    dot: 'bg-cyan-500',
    icon: Printer,
    iconCls: 'text-cyan-600',
  },
  {
    key: 'cutting',
    title: 'Cutting',
    desc: 'Precision fabric and lining panel cutting',
    dot: 'bg-amber-600',
    icon: Scissors,
    iconCls: 'text-amber-600',
  },
  {
    key: 'sewing',
    title: 'Sewing / Assembly',
    desc: 'Garment construction and main stitching',
    dot: 'bg-teal-600',
    icon: Shirt,
    iconCls: 'text-teal-600',
  },
  {
    key: 'ready_for_fitting',
    title: 'Ready for Fitting',
    desc: 'Garments ready for customer fitting session',
    dot: 'bg-violet-500',
    icon: UserCheck,
    iconCls: 'text-violet-600',
  },
  {
    key: 'qc_ironing',
    title: 'QC & Ironing',
    desc: 'Quality inspection, thread trimming & steam pressing',
    dot: 'bg-rose-500',
    icon: CheckCircle2,
    iconCls: 'text-rose-600',
  },
  {
    key: 'ready_for_pickup',
    title: 'Ready for Pickup',
    desc: 'Finished garments awaiting customer claim and in-store pickup',
    dot: 'bg-emerald-500',
    icon: Store,
    iconCls: 'text-emerald-600',
  },
  {
    key: 'completed',
    title: 'Completed Orders',
    desc: 'Fully claimed and settled garment orders',
    dot: 'bg-taupe',
    icon: CheckCheck,
    iconCls: 'text-taupe',
  },
  {
    key: 'on_hold',
    title: 'On Hold (Paused)',
    desc: 'Jobs paused for materials or customer feedback',
    dot: 'bg-amber-500',
    icon: Pause,
    iconCls: 'text-amber-700',
  },
];

export function buildStageIconFilters(
  notifPrefs: Record<string, boolean>,
  pendingReviewCount: number,
  groupedJobs: Record<string, any[]>,
  onHoldJobsCount: number
): StageIconFilter[] {
  return [
    { id: 'all', title: 'All Stages', icon: Layers },
    {
      id: 'pending',
      title: 'Pending Review',
      icon: AlertTriangle,
      dotColor: notifPrefs.pending && pendingReviewCount > 0 ? 'bg-amber-500 ring-white' : null,
      iconColor: notifPrefs.pending && pendingReviewCount > 0 ? 'text-amber-600' : '',
    },
    {
      id: 'design',
      title: 'Design',
      icon: Palette,
      dotColor: notifPrefs.design && (groupedJobs['design']?.length || 0) > 0 ? 'bg-sky-500 ring-white' : null,
      iconColor: notifPrefs.design && (groupedJobs['design']?.length || 0) > 0 ? 'text-sky-600' : '',
    },
    {
      id: 'pattern_making',
      title: 'Pattern Making',
      icon: Ruler,
      dotColor: notifPrefs.pattern_making && (groupedJobs['pattern_making']?.length || 0) > 0 ? 'bg-indigo-500 ring-white' : null,
      iconColor: notifPrefs.pattern_making && (groupedJobs['pattern_making']?.length || 0) > 0 ? 'text-indigo-600' : '',
    },
    {
      id: 'mass_cutting_printing',
      title: 'Mass Cutting & Printing',
      icon: Printer,
      dotColor: notifPrefs.mass_cutting_printing && (groupedJobs['mass_cutting_printing']?.length || 0) > 0 ? 'bg-cyan-500 ring-white' : null,
      iconColor: notifPrefs.mass_cutting_printing && (groupedJobs['mass_cutting_printing']?.length || 0) > 0 ? 'text-cyan-600' : '',
    },
    {
      id: 'cutting',
      title: 'Cutting',
      icon: Scissors,
      dotColor: notifPrefs.cutting && (groupedJobs['cutting']?.length || 0) > 0 ? 'bg-amber-600 ring-white' : null,
      iconColor: notifPrefs.cutting && (groupedJobs['cutting']?.length || 0) > 0 ? 'text-amber-600' : '',
    },
    {
      id: 'sewing',
      title: 'Sewing / Assembly',
      icon: Shirt,
      dotColor: notifPrefs.sewing && (groupedJobs['sewing']?.length || 0) > 0 ? 'bg-teal-600 ring-white' : null,
      iconColor: notifPrefs.sewing && (groupedJobs['sewing']?.length || 0) > 0 ? 'text-teal-600' : '',
    },
    {
      id: 'ready_for_fitting',
      title: 'Ready for Fitting',
      icon: UserCheck,
      dotColor: notifPrefs.ready_for_fitting && (groupedJobs['ready_for_fitting']?.length || 0) > 0 ? 'bg-violet-500 ring-white' : null,
      iconColor: notifPrefs.ready_for_fitting && (groupedJobs['ready_for_fitting']?.length || 0) > 0 ? 'text-violet-600' : '',
    },
    {
      id: 'qc_ironing',
      title: 'QC & Ironing',
      icon: CheckCircle2,
      dotColor: notifPrefs.qc_ironing && (groupedJobs['qc_ironing']?.length || 0) > 0 ? 'bg-rose-500 ring-white' : null,
      iconColor: notifPrefs.qc_ironing && (groupedJobs['qc_ironing']?.length || 0) > 0 ? 'text-rose-600' : '',
    },
    {
      id: 'ready_for_pickup',
      title: 'Ready for Pickup',
      icon: Store,
      dotColor: notifPrefs.ready_for_pickup && (groupedJobs['ready_for_pickup']?.length || 0) > 0 ? 'bg-emerald-500 ring-white' : null,
      iconColor: notifPrefs.ready_for_pickup && (groupedJobs['ready_for_pickup']?.length || 0) > 0 ? 'text-emerald-600' : '',
    },
    {
      id: 'completed',
      title: 'Completed Orders',
      icon: CheckCheck,
      dotColor: notifPrefs.completed && (groupedJobs['completed']?.length || 0) > 0 ? 'bg-taupe ring-white' : null,
      iconColor: notifPrefs.completed && (groupedJobs['completed']?.length || 0) > 0 ? 'text-taupe' : '',
    },
    {
      id: 'on_hold',
      title: 'On Hold (Paused)',
      icon: Pause,
      dotColor: notifPrefs.on_hold && onHoldJobsCount > 0 ? 'bg-amber-500 ring-white' : null,
      iconColor: notifPrefs.on_hold && onHoldJobsCount > 0 ? 'text-amber-700' : '',
    },
  ];
}
