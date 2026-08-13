import { BarChart2, Megaphone, BookOpen } from 'lucide-react';

export interface AnalyticsData {
  total_jobs: number;
  completed_jobs: number;
  total_revenue: number;
  total_outstanding_balance: number;
  upcoming_appointments: number;
  total_appointments: number;
  total_services: number;
  total_collections: number;
  total_branches: number;
  total_staff: number;
  total_customers?: number;
  // New KPI fields
  overdue_jobs?: number;
  pending_deposit_jobs?: number;
  ready_for_pickup_jobs?: number;
  rush_jobs_active?: number;
  today_revenue?: number;
  completion_rate?: number;
  avg_order_value?: number;
  today_appointments?: {
    id: number;
    scheduled_at: string;
    appointment_type: string;
    status: string;
    customer?: { id: number; name: string };
    service?: { id: number; name: string };
  }[];
  recent_jobs?: {
    id: number;
    order_number?: string;
    total_amount: number | string;
    customer?: { name: string };
    created_at?: string;
  }[];
  revenue_data?: { month: string; date?: string; revenue: number }[];
  jobs_by_status?: { status: string; count: number }[];
  // Same aging-alert data Reports' own tables list in full — Home's Needs
  // Attention section only needs the count to flag that they exist at all.
  unclaimed_pickups?: unknown[];
  jobs_on_hold?: unknown[];
  completed_unpaid_jobs?: JobItem[];
  completed_unpaid_jobs_count?: number;
  pending_dp_jobs_list?: JobItem[];
  pending_dp_jobs_list_count?: number;
  due_today_jobs?: JobItem[];
  due_today_jobs_count?: number;
  due_this_week_jobs?: JobItem[];
  due_this_week_jobs_count?: number;
}

export interface JobItem {
  id: number;
  order_number?: string;
  status: string;
  intake_channel?: string;
  payment_status: string;
  balance?: string | number;
  total_amount?: string | number;
  discount_amount?: string | number | null;
  due_date?: string;
  customer?: { name: string };
}

export interface StaffPresence {
  id: number;
  role: string;
  shop_branch_id?: number | null;
  user: { name: string; last_seen_at?: string | null };
  _onlineSince: number; // epoch ms when last_seen_at was first within 5 min
}

export const TABS = [
  { id: 'dashboard', label: 'Dashboard',    icon: BarChart2 },
  { id: 'news',      label: 'System News',  icon: Megaphone },
  { id: 'welcome',   label: 'Welcome Guide', icon: BookOpen  },
] as const;
