import React from 'react';
import { Workflow } from 'lucide-react';
import ColumnFold from './ColumnFold';

interface WorkSectionProps {
  /** The order has moved on (Ready, Done): fold it to "Being made — 4 of 4 done". */
  readonly folded: boolean;
  readonly done: number;
  readonly total: number;
  readonly children: React.ReactNode;
}

/** The Being made column: the production line, photos and notes. Open while the order is being made, folded after. */
export default function WorkSection({ folded, done, total, children }: WorkSectionProps) {
  return (
    <ColumnFold icon={Workflow} title="Being made" subtitle="Work stage, photos and notes" done={done} total={total} folded={folded}>
      <div className="p-5 sm:p-6">{children}</div>
    </ColumnFold>
  );
}
