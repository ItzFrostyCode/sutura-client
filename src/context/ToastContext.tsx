'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { readonly children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timeout = timeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeouts.current.delete(id);
    }
  }, []);

  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-4), { id, message, variant }]);
    const timeout = setTimeout(() => dismiss(id), 4000);
    timeouts.current.set(id, timeout);
  }, [dismiss]);

  const value = useMemo<ToastContextValue>(() => ({
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Portal */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-9999 flex flex-col gap-2.5 pointer-events-none"
        style={{ maxWidth: 380 }}
      >
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { readonly toast: Toast; readonly onDismiss: (id: string) => void }) {
  const config = {
    success: {
      icon: CheckCircle2,
      bg: 'bg-white',
      border: 'border-[#7A8B76]/30',
      iconColor: 'text-[#7A8B76]',
      bar: 'bg-[#7A8B76]',
    },
    error: {
      icon: XCircle,
      bg: 'bg-white',
      border: 'border-[#B26959]/30',
      iconColor: 'text-[#B26959]',
      bar: 'bg-[#B26959]',
    },
    info: {
      icon: Info,
      bg: 'bg-white',
      border: 'border-[#9A8073]/30',
      iconColor: 'text-[#9A8073]',
      bar: 'bg-[#9A8073]',
    },
  }[toast.variant];

  const Icon = config.icon;

  return (
    <div
      className={`
        pointer-events-auto relative overflow-hidden
        flex items-start gap-3 px-4 py-3.5
        ${config.bg} border ${config.border}
        rounded-2xl border border-[#EBE6E0]
        animate-in slide-in-from-right-4 fade-in duration-300
      `}
      style={{ minWidth: 300 }}
    >
      {/* Accent bar */}
      <span className={`absolute left-0 inset-y-0 w-1 ${config.bar} rounded-l-2xl`} />

      <Icon size={18} className={`${config.iconColor} shrink-0 mt-0.5`} />

      <p className="flex-1 text-sm text-[#2D2A26] font-medium leading-snug pr-2">
        {toast.message}
      </p>

      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-[#A8A19A] hover:text-[#524A44] transition-colors mt-0.5"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
