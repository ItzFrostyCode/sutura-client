import React, { useState } from 'react';
import { Search, UserCircle, Wifi, Clock, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { Staff, formatLastSeen, roleLabel } from './staffHelpers';

interface StaffListViewProps {
  readonly staff: Staff[];
  readonly loading: boolean;
  readonly onEdit: (member: Staff) => void;
  readonly onDelete: (id: number) => void;
  readonly onViewHistory: (member: Staff) => void;
}

interface StaffMemberRowProps {
  readonly member: Staff;
  readonly onEdit: (member: Staff) => void;
  readonly onDelete: (id: number) => void;
  readonly onViewHistory: (member: Staff) => void;
}

function StaffMemberRow({ member, onEdit, onDelete, onViewHistory }: StaffMemberRowProps) {
  const { label: lastSeenLabel, isOnline } = formatLastSeen(member.user?.last_seen_at);

  return (
    <tr className="hover:bg-[#F0EAE3]/20 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[#F0EAE3] flex items-center justify-center text-[#827A73]">
              <UserCircle size={18} />
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                isOnline ? 'bg-[#7A8B76]' : 'bg-[#C5BDBA]'
              }`}
              title={isOnline ? 'Online' : `Last seen ${lastSeenLabel}`}
            />
          </div>
          <div>
            <div className="font-medium text-[#2D2A26]">{member.user?.name}</div>
            <div className="text-xs text-[#A8A19A]">{member.user?.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1 items-start">
          <div className="flex flex-wrap gap-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F0EAE3] text-[#524A44]">
              {roleLabel(member.role)}
            </span>
            {member.additional_roles?.map((r) => (
              <span key={r} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F0EAE3]/50 text-[#827A73] border border-[#EBE6E0]">
                {roleLabel(r)}
              </span>
            ))}
          </div>
          {member.is_branch_manager && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#9A8073]/10 text-[#9A8073] border border-[#9A8073]/20">
              Branch Manager
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        {member.branch?.name || <span className="text-[#A8A19A] text-xs italic">All branches</span>}
      </td>
      <td className="px-6 py-4">
        {(() => {
          const spec = member.specialization;
          if (spec && Array.isArray(spec) && spec.length > 0) {
            return (
              <div className="flex flex-wrap gap-1">
                {spec.map((s) => (
                  <span key={s} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#EBE6E0]/50 text-[#524A44] border border-[#EBE6E0]">
                    {s}
                  </span>
                ))}
              </div>
            );
          }
          if (spec && typeof spec === 'string') {
            return <span className="text-[#524A44] text-sm">{spec}</span>;
          }
          return <span className="text-[#A8A19A] text-xs italic">Not assigned</span>;
        })()}
      </td>
      <td className="px-6 py-4">
        {(() => {
          const jobs = member.active_jobs || 0;
          let barColor = 'bg-[#7A8B76]';
          let textColor = 'text-[#7A8B76]';
          let label = 'Light';

          if (jobs >= 5) {
            barColor = 'bg-[#B26959]';
            textColor = 'text-[#B26959]';
            label = 'Heavy';
          } else if (jobs >= 3) {
            barColor = 'bg-amber-500';
            textColor = 'text-amber-600';
            label = 'Moderate';
          }

          const pct = Math.min((jobs / 5) * 100, 100);

          return (
            <div className="w-36">
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-semibold text-[#2D2A26]">{jobs} / 5</span>
                <span className={`font-bold text-[10px] uppercase ${textColor}`}>{label}</span>
              </div>
              <div className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }}></div>
              </div>
            </div>
          );
        })()}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={13} className="text-[#7A8B76]" />
          <span className="font-semibold text-[#2D2A26]">{member.completed_jobs || 0}</span>
          <span className="text-[#A8A19A] text-xs">completed</span>
        </div>
      </td>
      <td className="px-6 py-4">
        {member.is_active ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-[#7A8B76]/10 text-[#7A8B76] border-[#7A8B76]/20">
            Active
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-zinc-500/10 text-[#827A73] border-zinc-500/20">
            Inactive
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        {isOnline ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A8B76]">
            <Wifi size={13} className="shrink-0" />
            Online
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#A8A19A]">
            <Clock size={13} className="shrink-0" />
            {lastSeenLabel}
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-[#827A73]">
        {member.hired_at ? new Date(member.hired_at).toLocaleDateString() : 'N/A'}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onViewHistory(member)}
            title="Work history"
            className="text-[#A8A19A] hover:text-[#7A8B76] transition-colors p-1"
          >
            <Clock size={16} />
          </button>
          <button
            onClick={() => onEdit(member)}
            className="text-[#A8A19A] hover:text-[#2D2A26] transition-colors p-1"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onDelete(member.id)}
            className="text-[#A8A19A] hover:text-[#B26959] transition-colors p-1"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function StaffListView({
  staff,
  loading,
  onEdit,
  onDelete,
  onViewHistory,
}: StaffListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStaff = staff.filter(member => {
    const name = member.user?.name || '';
    const email = member.user?.email || '';
    const role = member.role || '';
    const specialization = Array.isArray(member.specialization) ? member.specialization.join(', ') : (member.specialization || '');
    const q = searchQuery.toLowerCase();
    return (
      name.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      role.toLowerCase().includes(q) ||
      specialization.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-[#EBE6E0] flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={18} />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[#524A44]">
          <thead className="bg-[#FAF6F3]/50 text-xs uppercase text-[#A8A19A] border-b border-[#EBE6E0]">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Branch</th>
              <th className="px-6 py-4 font-medium">Specialization</th>
              <th className="px-6 py-4 font-medium">Active Jobs</th>
              <th className="px-6 py-4 font-medium">Productivity</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Last Seen</th>
              <th className="px-6 py-4 font-medium">Hire Date</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {loading && (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse border-b border-[#EBE6E0]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#EBE6E0]"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-[#EBE6E0] rounded w-24"></div>
                          <div className="h-3 bg-[#EBE6E0] rounded w-32"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 bg-[#EBE6E0] rounded-full w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#EBE6E0] rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 bg-[#EBE6E0] rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-36 space-y-2">
                        <div className="h-3 bg-[#EBE6E0] rounded w-full"></div>
                        <div className="h-1.5 bg-[#EBE6E0] rounded-full w-full"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#EBE6E0] rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 bg-[#EBE6E0] rounded-full w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#EBE6E0] rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#EBE6E0] rounded w-20"></div>
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
                <td colSpan={10} className="px-6 py-8 text-center text-[#A8A19A]">
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
                onViewHistory={onViewHistory}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
