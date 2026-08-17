import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircle, Eye, Pencil, Trash2, X, Scissors, UserCheck, Sparkles, Building2 } from 'lucide-react';
import { Staff, roleLabel, formatLastSeen } from './staffHelpers';
import { useBranch } from '@/context/BranchContext';
import SearchInput from '@/components/shared/SearchInput';

type WorkloadFilter = 'all' | 'light' | 'moderate' | 'heavy';

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

const WORKLOAD_STYLE: Record<Exclude<WorkloadFilter, 'all'>, { bar: string; text: string; bg: string; label: string }> = {
  light:    { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Light' },
  moderate: { bar: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50',   label: 'Moderate' },
  heavy:    { bar: 'bg-rose-500',    text: 'text-rose-700',    bg: 'bg-rose-50',    label: 'High Load' },
};

function WorkloadBar({ jobs }: { readonly jobs: number }) {
  const { bar: barColor, text: textColor, bg: bgColor, label } = WORKLOAD_STYLE[workloadBucket(jobs)];
  const pct = Math.min((jobs / 10) * 100, 100);

  return (
    <div className="w-full sm:w-36 space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-ink font-mono">{jobs} active {jobs === 1 ? 'job' : 'jobs'}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border border-current/20 ${textColor} ${bgColor}`}>
          {label}
        </span>
      </div>
      <div className="w-full bg-line/60 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${Math.max(pct, 6)}%` }} />
      </div>
    </div>
  );
}

function StatusBadges({ member }: { readonly member: Staff }) {
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {member.is_active ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Active
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 text-ink-muted border border-zinc-200 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          Inactive
        </span>
      )}
      {member.is_active && member.is_available === false && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
          On Leave
        </span>
      )}
    </div>
  );
}

function StaffAvatar({ member, size }: { readonly member: Staff; readonly size: number }) {
  const { isOnline } = formatLastSeen(member.user?.last_seen_at);
  const initials = member.user?.name
    ? member.user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'A';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-full bg-linear-to-br from-[#B99A6B] to-[#8A7063] flex items-center justify-center text-white font-bold text-xs shadow-2xs overflow-hidden"
      >
        {member.user?.profile_picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.user.profile_picture} alt={member.user.name} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <span
        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
          isOnline ? 'bg-emerald-500' : 'bg-[#C5BDBA]'
        }`}
        title={isOnline ? 'Online now' : 'Offline'}
      />
    </div>
  );
}

function StaffMemberRow({ member, onEdit, onDelete, onView }: StaffMemberRowProps) {
  return (
    <tr
      onClick={() => onView(member.id)}
      className="hover:bg-canvas/50 transition-colors cursor-pointer group"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3.5">
          <StaffAvatar member={member} size={38} />
          <div className="min-w-0">
            <div className="font-bold text-ink group-hover:text-taupe transition-colors truncate text-sm">
              {member.user?.name}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-ink-muted mt-0.5 flex-wrap">
              <span className="font-semibold text-ink-body">{roleLabel(member.role)}</span>
              <span className="text-ink-faint">•</span>
              <span className="text-ink-faint flex items-center gap-1 truncate">
                <Building2 size={11} className="text-taupe shrink-0" />
                {member.branch?.name || 'All Branches'}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4"><WorkloadBar jobs={member.active_jobs || 0} /></td>
      <td className="px-6 py-4"><StatusBadges member={member} /></td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onView(member.id); }}
            title="View artisan profile"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface border border-transparent hover:border-line transition-colors cursor-pointer"
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(member); }}
            title="Edit staff details"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface border border-transparent hover:border-line transition-colors cursor-pointer"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(member.id); }}
            title="Remove staff member"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function StaffMemberCard({ member, onEdit, onDelete, onView }: StaffMemberRowProps) {
  return (
    <div onClick={() => onView(member.id)} className="p-4 space-y-3 cursor-pointer active:bg-canvas transition-colors bg-surface">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <StaffAvatar member={member} size={40} />
          <div className="min-w-0">
            <div className="font-bold text-ink truncate text-sm">{member.user?.name}</div>
            <div className="text-xs text-ink-muted truncate">
              {roleLabel(member.role)} · {member.branch?.name || 'All branches'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(member); }} 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-canvas border border-line"
          >
            <Pencil size={14} />
          </button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(member.id); }} 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-700 hover:bg-rose-50 border border-rose-200"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-line/60">
        <StatusBadges member={member} />
        <WorkloadBar jobs={member.active_jobs || 0} />
      </div>
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
  const [branchFilter, setBranchFilter] = useState('all');

  const onView = (id: number) => router.push(`/dashboard/staff/${id}`);

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

  const selectClass = 'px-3 py-2 bg-surface border border-line rounded-xl text-xs font-semibold text-ink-body focus:outline-none focus:border-taupe shadow-2xs cursor-pointer';

  return (
    <div className="bg-surface shadow-2xs border border-line rounded-2xl overflow-hidden">
      {/* Filter Toolbar */}
      <div className="p-4 sm:p-5 border-b border-line flex flex-col sm:flex-row sm:items-center gap-3 sm:flex-wrap bg-canvas/30">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search staff by name, role, skill..." className="w-full sm:w-64" />

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
          <option value="light">Light Load</option>
          <option value="moderate">Moderate</option>
          <option value="heavy">High Load</option>
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
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs font-bold text-taupe hover:text-taupe-hover px-2 py-1 cursor-pointer"
          >
            <X size={14} /> Clear filters
          </button>
        )}

        <span className="text-xs text-ink-faint font-medium sm:ml-auto">
          {filteredStaff.length} of {staff.length} staff
        </span>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-line">
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={`staff-card-skel-${i}`} className="p-4 animate-pulse space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-line"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-line rounded w-1/2"></div>
                <div className="h-3 bg-line rounded w-2/3"></div>
              </div>
            </div>
            <div className="h-5 bg-line rounded-full w-24"></div>
            <div className="h-8 bg-line rounded w-full"></div>
          </div>
        ))}
        {!loading && filteredStaff.length === 0 && (
          <p className="px-6 py-12 text-center text-ink-faint text-sm">No staff members match the selected filters.</p>
        )}
        {!loading && filteredStaff.map(member => (
          <StaffMemberCard key={member.id} member={member} onEdit={onEdit} onDelete={onDelete} onView={onView} />
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-ink-body">
          <thead className="bg-canvas/50 text-[11px] font-bold uppercase tracking-wider text-ink-muted border-b border-line">
            <tr>
              <th className="px-6 py-3.5">Artisan / Staff</th>
              <th className="px-6 py-3.5">Workroom Load</th>
              <th className="px-6 py-3.5">Availability</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse border-b border-line">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-line"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-line rounded w-28"></div>
                          <div className="h-3 bg-line rounded w-36"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-36 space-y-2">
                        <div className="h-3 bg-line rounded w-full"></div>
                        <div className="h-1.5 bg-line rounded-full w-full"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 bg-line rounded-full w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-line rounded w-20 ml-auto"></div>
                    </td>
                  </tr>
                ))}
              </>
            )}
            {!loading && filteredStaff.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-ink-muted text-sm">
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
