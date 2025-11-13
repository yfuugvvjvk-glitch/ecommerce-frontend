'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  return (
    <div
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={`fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold" aria-hidden="true">
          {icons[type]}
        </span>
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-2 font-bold text-xl hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}
