import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircle, Eye, Pencil, Trash2, X } from 'lucide-react';
import { Staff, roleLabel } from './staffHelpers';
import { useBranch } from '@/context/BranchContext';
import SearchInput from '@/components/shared/SearchInput';

type WorkloadFilter = 'all' | 'light' | 'moderate' | 'heavy';

/** Same thresholds as WorkloadBar below — kept in one place so the filter and the bar it filters can never silently disagree. */
function workloadBucket(jobs: number): Exclude<WorkloadFilter, 'all'> {
  if (jobs >= 5) return 'heavy';
  if (jobs >= 3) return 'moderate';
  return 'light';
}

interface StaffListViewProps {
  readonly staff: Staff[];
  readonly loading: boolean;
  readonly onEdit: (member: Staff) => void;
  readonly onDelete: (id: number) => void;
}

interface StaffMemberRowProps {
  readonly member: Staff;
  readonly onEdit: (member: Staff) => void;
  readonly onDelete: (id: number) => void;
  readonly onView: (id: number) => void;
}

const WORKLOAD_STYLE: Record<Exclude<WorkloadFilter, 'all'>, { bar: string; text: string; label: string }> = {
  light:    { bar: 'bg-[#7A8B76]', text: 'text-[#7A8B76]', label: 'Light' },
  moderate: { bar: 'bg-amber-500', text: 'text-amber-600', label: 'Moderate' },
  heavy:    { bar: 'bg-[#B26959]', text: 'text-[#B26959]', label: 'Heavy' },
};

function WorkloadBar({ jobs }: { readonly jobs: number }) {
  const { bar: barColor, text: textColor, label } = WORKLOAD_STYLE[workloadBucket(jobs)];
  // No fixed "/5" denominator — 5 is only the "Heavy" threshold, not an
  // actual ceiling a staff member's real active-job count is bound by (a
  // shop owner could genuinely have 8, 10+ jobs stacked on one tailor). The
  // bar fill is purely decorative, scaled against a generous reference of
  // 10 so it keeps growing instead of looking permanently maxed-out right
  // at the Heavy threshold.
  const pct = Math.min((jobs / 10) * 100, 100);

  return (
    <div className="w-full sm:w-32">
      <div className="flex justify-between items-center mb-1 text-xs">
        <span className="font-semibold text-[#2D2A26]">{jobs} active</span>
        <span className={`font-bold text-[10px] uppercase ${textColor}`}>{label}</span>
      </div>
      <div className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}

function StatusBadges({ member }: { readonly member: Staff }) {
  return (
    <div className="flex flex-wrap gap-1 items-center">
      {member.is_active ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-[#7A8B76]/10 text-[#7A8B76] border-[#7A8B76]/20">
          Active
        </span>
      ) : (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-zinc-500/10 text-[#827A73] border-zinc-500/20">
          Inactive
        </span>
      )}
      {/* is_active = still employed; is_available = temporarily out
          (leave/sick day) — only worth flagging for someone who's
          otherwise still active, so it doesn't stack meaninglessly on top
          of an already-Inactive badge. */}
      {member.is_active && member.is_available === false && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          On Leave
        </span>
      )}
    </div>
  );
}

function StaffAvatar({ member, size }: { readonly member: Staff; readonly size: number }) {
  return (
    <div
      className="rounded-full bg-[#F0EAE3] flex items-center justify-center text-[#827A73] overflow-hidden shrink-0"
      style={{ width: size, height: size }}
    >
      {member.user?.profile_picture ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={member.user.profile_picture} alt={member.user.name} className="w-full h-full object-cover" />
      ) : (
        <UserCircle size={size * 0.6} />
      )}
    </div>
  );
}

function StaffMemberRow({ member, onEdit, onDelete, onView }: StaffMemberRowProps) {
  return (
    <tr
      onClick={() => onView(member.id)}
      className="hover:bg-[#F0EAE3]/20 transition-colors cursor-pointer group"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <StaffAvatar member={member} size={36} />
          <div className="min-w-0">
            <div className="font-medium text-[#2D2A26] group-hover:text-taupe transition-colors truncate">{member.user?.name}</div>
            <div className="text-xs text-[#A8A19A] truncate">
              {roleLabel(member.role)}{member.branch?.name ? ` · ${member.branch.name}` : ' · All branches'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4"><WorkloadBar jobs={member.active_jobs || 0} /></td>
      <td className="px-6 py-4"><StatusBadges member={member} /></td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onView(member.id); }}
            title="View profile"
            className="text-[#A8A19A] hover:text-[#7A8B76] transition-colors p-1"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(member); }}
            className="text-[#A8A19A] hover:text-[#2D2A26] transition-colors p-1"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(member.id); }}
            className="text-[#A8A19A] hover:text-[#B26959] transition-colors p-1"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function StaffMemberCard({ member, onEdit, onDelete, onView }: StaffMemberRowProps) {
  return (
    <div onClick={() => onView(member.id)} className="p-4 space-y-3 cursor-pointer active:bg-[#F0EAE3]/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <StaffAvatar member={member} size={36} />
          <div className="min-w-0">
            <div className="font-medium text-[#2D2A26] truncate">{member.user?.name}</div>
            <div className="text-xs text-[#A8A19A] truncate">
              {roleLabel(member.role)}{member.branch?.name ? ` · ${member.branch.name}` : ' · All branches'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onEdit(member); }} className="text-[#A8A19A] hover:text-[#2D2A26] transition-colors p-1.5">
            <Pencil size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(member.id); }} className="text-[#A8A19A] hover:text-[#B26959] transition-colors p-1.5">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <StatusBadges member={member} />

      <WorkloadBar jobs={member.active_jobs || 0} />
    </div>
  );
}

export default function StaffListView({
  staff,
  loading,
  onEdit,
  onDelete,
}: StaffListViewProps) {
  const router = useRouter();
  const { branches } = useBranch();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [workloadFilter, setWorkloadFilter] = useState<WorkloadFilter>('all');
  // 'all' | 'unassigned' | a branch id as string — separate from the
  // dashboard header's own branch selector (which pre-filters the `staff`
  // prop this component receives), since that one lives outside this list
  // and isn't obvious as the way to split staff by branch.
  const [branchFilter, setBranchFilter] = useState('all');

  const onView = (id: number) => router.push(`/dashboard/staff/${id}`);

  // Built from whatever roles actually exist in this shop's roster, not the
  // full static StaffProfile::ROLES list — a dropdown offering roles nobody
  // on this team actually has would just be more noise, not less.
  const availableRoles = useMemo(() => {
    const set = new Set<string>();
    staff.forEach(m => { if (m.role) set.add(m.role); });
    return Array.from(set).sort();
  }, [staff]);

  const filteredStaff = staff.filter(member => {
    const name = member.user?.name || '';
    const email = member.user?.email || '';
    const role = member.role || '';
    const specialization = Array.isArray(member.specialization) ? member.specialization.join(', ') : (member.specialization || '');
    const q = searchQuery.toLowerCase();
    const matchesSearch = (
      name.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      role.toLowerCase().includes(q) ||
      specialization.toLowerCase().includes(q)
    );
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' ? member.is_active : !member.is_active);
    const matchesWorkload = workloadFilter === 'all' || workloadBucket(member.active_jobs || 0) === workloadFilter;
    const matchesBranch =
      branchFilter === 'all' ||
      (branchFilter === 'unassigned' ? !member.shop_branch_id : member.shop_branch_id === Number(branchFilter));
    return matchesSearch && matchesRole && matchesStatus && matchesWorkload && matchesBranch;
  });

  const hasActiveFilters = roleFilter !== 'all' || statusFilter !== 'all' || workloadFilter !== 'all' || branchFilter !== 'all' || searchQuery !== '';
  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
    setWorkloadFilter('all');
    setBranchFilter('all');
  };

  const selectClass = 'px-3 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors';

  return (
    <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-[#EBE6E0] flex flex-col sm:flex-row sm:items-center gap-3 sm:flex-wrap">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search staff..." className="w-full sm:w-64" />

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className={selectClass}
          aria-label="Filter by role"
        >
          <option value="all">All Roles</option>
          {availableRoles.map(r => (
            <option key={r} value={r}>{roleLabel(r)}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className={selectClass}
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={workloadFilter}
          onChange={e => setWorkloadFilter(e.target.value as WorkloadFilter)}
          className={selectClass}
          aria-label="Filter by workload"
        >
          <option value="all">All Workloads</option>
          <option value="light">Light</option>
          <option value="moderate">Moderate</option>
          <option value="heavy">Heavy</option>
        </select>

        {branches.length > 1 && (
          <select
            value={branchFilter}
            onChange={e => setBranchFilter(e.target.value)}
            className={selectClass}
            aria-label="Filter by branch"
          >
            <option value="all">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}{b.is_main ? ' (Main)' : ''}</option>
            ))}
            <option value="unassigned">Unassigned</option>
          </select>
        )}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs font-semibold text-[#9A8073] hover:text-[#8A7063] px-2 py-1"
          >
            <X size={14} /> Clear filters
          </button>
        )}

        <span className="text-xs text-[#A8A19A] sm:ml-auto">
          {filteredStaff.length} of {staff.length} staff
        </span>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-[#EBE6E0]">
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={`staff-card-skel-${i}`} className="p-4 animate-pulse space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#EBE6E0]"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-[#EBE6E0] rounded w-1/2"></div>
                <div className="h-3 bg-[#EBE6E0] rounded w-2/3"></div>
              </div>
            </div>
            <div className="h-5 bg-[#EBE6E0] rounded-full w-24"></div>
            <div className="h-8 bg-[#EBE6E0] rounded w-full"></div>
          </div>
        ))}
        {!loading && filteredStaff.length === 0 && (
          <p className="px-6 py-8 text-center text-[#A8A19A] text-sm">No staff members found.</p>
        )}
        {!loading && filteredStaff.map(member => (
          <StaffMemberCard key={member.id} member={member} onEdit={onEdit} onDelete={onDelete} onView={onView} />
        ))}
      </div>

      {/* Desktop table — kept to 4 columns (Staff / Workload / Status / Actions);
          role, branch, specialization, hire date, bio, and last-seen all now
          live on the dedicated profile page instead of being crammed into
          the row. */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-[#524A44]">
          <thead className="bg-[#FAF6F3]/50 text-xs uppercase text-[#A8A19A] border-b border-[#EBE6E0]">
            <tr>
              <th className="px-6 py-4 font-medium">Staff</th>
              <th className="px-6 py-4 font-medium">Workload</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EBE6E0]">
            {loading && (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse border-b border-[#EBE6E0]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#EBE6E0]"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-[#EBE6E0] rounded w-24"></div>
                          <div className="h-3 bg-[#EBE6E0] rounded w-32"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32 space-y-2">
                        <div className="h-3 bg-[#EBE6E0] rounded w-full"></div>
                        <div className="h-1.5 bg-[#EBE6E0] rounded-full w-full"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 bg-[#EBE6E0] rounded-full w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-[#EBE6E0] rounded w-20 ml-auto"></div>
                    </td>
                  </tr>
                ))}
              </>
            )}
            {!loading && filteredStaff.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-[#A8A19A]">
                  No staff members found.
                </td>
              </tr>
            )}
            {!loading && filteredStaff.map(member => (
              <StaffMemberRow
                key={member.id}
                member={member}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
