export interface Staff {
  id: number;
  /** Locked by the shop's plan (over its limit; never deleted). Server: PlanLimits. */
  plan_locked_at?: string | null;
  user_id?: number;
  user: { id?: number; name: string; email: string; phone?: string; last_seen_at?: string | null; profile_picture?: string | null; gender?: 'male' | 'female' | null };
  role: string;
  additional_roles?: string[] | null;
  is_active: boolean;
  is_available?: boolean;
  hired_at: string;
  specialization?: string | string[];
  bio?: string | null;
  active_jobs?: number;
  completed_jobs?: number;
  store_branch_id?: number | null;
  is_branch_manager?: boolean;
  branch?: { id: number; name: string } | null;
}

// Shown names that differ from the stored key (keys stay as they are).
const ROLE_LABELS: Record<string, string> = {
  quality_control: 'Quality Checker',
  senior_designer: 'Designer',
};

/** Turns a raw role value (e.g. "head_tailor") into a display label ("Head Tailor"). */
export function roleLabel(role: string): string {
  if (ROLE_LABELS[role]) return ROLE_LABELS[role];
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace(/^Store\b/, 'Shop'); // store_owner → "Shop Owner" (the key stays store_owner)
}

/** "Cassandra Velasquez (Head Tailor)" — how staff are listed in assign pickers. */
export function staffOptionLabel(s: Staff): string {
  const name = s.user?.name || `Staff #${s.user_id ?? s.user?.id ?? s.id}`;
  const role = s.is_branch_manager ? 'Branch Manager' : roleLabel(s.role || 'staff');
  return `${name} (${role})`;
}

/**
 * Staff who can take a given job: that job's branch staff plus anyone with no
 * branch (they work across branches) — same rule as the Create Job Order form.
 * The currently assigned person is always kept so the picker can show them.
 */
export function staffForBranch(list: Staff[], branchId: number | null | undefined, keepUserId?: number | null): Staff[] {
  return list.filter((s) => {
    const uid = s.user_id ?? s.user?.id;
    if (keepUserId && uid === keepUserId) return true;
    if (!branchId) return true;
    return s.store_branch_id == null || s.store_branch_id === branchId;
  });
}

/**
 * Returns a human-friendly relative last-seen string.
 * < 5 min  → "Online" (green dot)
 * < 60 min → "Xm ago"
 * < 24 h   → "Xh ago"
 * < 7 d    → "Xd ago"
 * else     → locale date string
 */
export function formatLastSeen(lastSeenAt: string | null | undefined): {
  label: string;
  isOnline: boolean;
} {
  if (!lastSeenAt) return { label: 'Never', isOnline: false };

  const diff = Math.floor((Date.now() - new Date(lastSeenAt).getTime()) / 1000); // seconds

  if (diff < 300)  return { label: 'Online',             isOnline: true  };
  if (diff < 3600) return { label: `${Math.floor(diff / 60)}m ago`,   isOnline: false };
  if (diff < 86400)return { label: `${Math.floor(diff / 3600)}h ago`,  isOnline: false };
  if (diff < 604800)return{ label: `${Math.floor(diff / 86400)}d ago`, isOnline: false };
  return { label: new Date(lastSeenAt).toLocaleDateString(), isOnline: false };
}
