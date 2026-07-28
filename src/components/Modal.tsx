import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: React.ReactNode;
  readonly children: React.ReactNode;
  readonly maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <button 
        type="button"
        aria-label="Close modal"
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-default w-full h-full border-none p-0 focus:outline-none"
        onClick={onClose}
      />
      
      <div className={`relative bg-white border border-[#EBE6E0] rounded-2xl shadow-2xl w-full ${maxWidth} overflow-hidden flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EBE6E0]">
          <h2 className="text-lg font-semibold text-[#2D2A26]">{title}</h2>
          <button 
            onClick={onClose}
            className="text-[#827A73] hover:text-[#2D2A26] transition-colors p-1 hover:bg-[#F0EAE3] rounded-md"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
