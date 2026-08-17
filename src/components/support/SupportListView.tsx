import React from 'react';
import { MessageSquare, Plus, Loader2, ChevronRight, Clock } from 'lucide-react';
import { Ticket, TYPE_LABELS, PRIORITY_LABELS, STATUS_CONFIG, formatDate } from './supportHelpers';
import Badge from '@/components/shared/Badge';
import EmptyState from '@/components/shared/EmptyState';
import PageHeader from '@/components/shared/PageHeader';

interface SupportListViewProps {
  readonly tickets: Ticket[];
  readonly loading: boolean;
  readonly openCount: number;
  readonly onCreateTicket: () => void;
  readonly onSelectTicket: (ticket: Ticket) => void;
}

export default function SupportListView({
  tickets,
  loading,
  openCount,
  onCreateTicket,
  onSelectTicket,
}: SupportListViewProps) {
  const renderContent = () => {
    if (loading) {
      return (
        <div className="py-16 text-center text-ink-faint animate-pulse flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin" />
          Loading tickets...
        </div>
      );
    }

    if (tickets.length === 0) {
      return (
        <EmptyState
          icon={MessageSquare}
          title="No support tickets yet"
          description="Experiencing an issue or have a request? Submit a ticket and our team will get back to you."
          actionLabel="Create Your First Ticket"
          onAction={onCreateTicket}
        />
      );
    }

    return (
      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        {tickets.map((ticket, idx) => {
          const typeConfig = TYPE_LABELS[ticket.type];
          const priorityConfig = PRIORITY_LABELS[ticket.priority];
          const statusConfig = STATUS_CONFIG[ticket.status];
          
          let dotColor = 'bg-sage';
          if (ticket.priority === 'urgent') {
            dotColor = 'bg-red-500';
          } else if (ticket.priority === 'high') {
            dotColor = 'bg-orange-400';
          } else if (ticket.priority === 'medium') {
            dotColor = 'bg-amber-400';
          }

          const isLast = idx === tickets.length - 1;

          return (
            <button
              key={ticket.id}
              type="button"
              onClick={() => onSelectTicket(ticket)}
              className={`w-full text-left flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-canvas transition-colors group ${isLast ? '' : 'border-b border-line'}`}
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-ink text-sm truncate">{ticket.subject}</span>
                  {(ticket.replies?.length ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-xs text-ink-faint shrink-0">
                      <MessageSquare size={12} /> {ticket.replies.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${typeConfig.color}`}>
                    {typeConfig.icon} {typeConfig.label}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${priorityConfig.color}`}>
                    {priorityConfig.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <Badge variant={statusConfig.variant}>
                    {statusConfig.icon} {statusConfig.label}
                  </Badge>
                  <p className="text-xs text-ink-faint mt-1 flex items-center gap-1 justify-end">
                    <Clock size={10} /> {formatDate(ticket.created_at)}
                  </p>
                </div>
                <ChevronRight size={16} className="text-ink-faint group-hover:text-ink-body transition-colors" />
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Help Desk"
        title="Support Tickets"
        description={<>Submit issues, update requests, or questions to the SUTURA admin team.{openCount > 0 && <span className="text-taupe font-semibold"> {openCount} active ticket{openCount > 1 ? 's' : ''}.</span>}</>}
        actions={
          <button
            onClick={onCreateTicket}
            className="flex items-center gap-2 bg-taupe hover:bg-taupe-hover text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors min-h-[44px]"
          >
            <Plus size={17} /> New Ticket
          </button>
        }
      />

      {renderContent()}
    </div>
  );
}
