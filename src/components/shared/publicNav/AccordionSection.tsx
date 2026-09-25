import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AccordionSectionProps {
  readonly label: string;
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly children: React.ReactNode;
}

export default function AccordionSection({
  label,
  open,
  onToggle,
  children,
}: AccordionSectionProps) {
  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-[10px] py-3 text-black cursor-pointer"
      >
        <span className="text-[13px] font-bold text-black">{label}</span>
        {open ? (
          <ChevronUp size={16} className="text-black" />
        ) : (
          <ChevronDown size={16} className="text-black" />
        )}
      </button>
      {open && <div className="px-[10px] pb-3 text-black">{children}</div>}
    </div>
  );
}
