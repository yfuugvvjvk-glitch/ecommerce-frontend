'use client';

import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmă',
  cancelLabel = 'Anulează',
  onConfirm,
  onCancel,
  type = 'danger',
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the confirm button when dialog opens
      confirmButtonRef.current?.focus();

      // Trap focus within dialog
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onCancel();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const buttonColors = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="dialog-title"
          className="text-xl font-bold text-gray-900 mb-3"
        >
          {title}
        </h2>
        <p id="dialog-description" className="text-gray-600 mb-6">
          {message}
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-base bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 min-h-[44px]"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 text-base text-white rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[44px] ${buttonColors[type]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
