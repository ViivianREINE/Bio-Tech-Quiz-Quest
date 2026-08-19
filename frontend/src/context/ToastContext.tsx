import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'badge' | 'levelup';
  title: string;
  description?: string;
  iconUrl?: string;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Render Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 max-w-sm pixel-box-wood flex items-center gap-3 transition-all duration-300 animate-slide-in ${
              toast.type === 'levelup' || toast.type === 'badge' ? 'border-amber-400' : ''
            }`}
          >
            {toast.type === 'levelup' ? (
              <img
                src="/assets/images/gold_five_point_star_level_badge_icon.png"
                alt="Level Up"
                className="w-10 h-10 animate-bounce"
              />
            ) : toast.type === 'badge' ? (
              <img
                src="/assets/images/glowing_blue_diamond_XP_crystal_icon.png"
                alt="Badge"
                className="w-10 h-10 animate-pulse"
              />
            ) : (
              <div
                className={`w-3 h-3 rounded-full ${
                  toast.type === 'success'
                    ? 'bg-emerald-400'
                    : toast.type === 'error'
                    ? 'bg-rose-500'
                    : 'bg-cyan-400'
                }`}
              />
            )}
            <div>
              <h4 className="font-pixel text-xs text-amber-300 tracking-wider uppercase">
                {toast.title}
              </h4>
              {toast.description && (
                <p className="text-xs text-amber-100/90 font-sans mt-0.5">
                  {toast.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
