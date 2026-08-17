import React from 'react';
import { UserCog } from 'lucide-react';
import { StaffPresence } from './dashboardHelpers';

interface StaffOnlineProps {
  readonly onlineStaff: StaffPresence[];
}

export default function StaffOnline({
  onlineStaff,
}: StaffOnlineProps) {
  return (
    <div className="bg-surface rounded-2xl border border-line p-6 flex flex-col text-ink">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">Staff Online Now</h2>
          <p className="text-xs text-ink-faint mt-0.5">Active in the last 5 minutes</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-sage bg-sage/10 border border-sage/20 px-2.5 py-1 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
          {onlineStaff.length} Online
        </span>
      </div>

      <div className="flex-1">
        {onlineStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-canvas border border-line flex items-center justify-center mb-3">
              <UserCog size={20} className="text-ink-faint" />
            </div>
            <p className="text-sm text-ink-faint font-medium">No staff online right now</p>
            <p className="text-xs text-ink-faint mt-1">Staff appear here when they log in</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {onlineStaff.map((member, idx) => {
              const initials = member.user.name
                .split(' ')
                .map(w => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
              const roleLabel = member.role
                ? member.role.charAt(0).toUpperCase() + member.role.slice(1).replaceAll('_', ' ')
                : 'Staff';
              const avatarColors = [
                'bg-taupe text-white',
                'bg-sage text-white',
                'bg-[#8B7B6B] text-white',
                'bg-[#6B7B8B] text-white',
              ];
              const avatarClass = avatarColors[idx % avatarColors.length];

              return (
                <div key={member.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold select-none ${avatarClass}`}>
                      {initials}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-sage border-2 border-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-semibold text-ink leading-tight truncate">{member.user.name}</p>
                    <span className="inline-block mt-0.5 text-[10px] font-medium text-ink-muted bg-sunken px-2 py-0.5 rounded-full">
                      {roleLabel}
                    </span>
                  </div>

                  <span className="text-xs text-ink-faint font-medium shrink-0">#{idx + 1}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
