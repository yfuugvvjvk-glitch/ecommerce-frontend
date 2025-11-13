import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey;
        const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey;
        const altMatch = shortcut.altKey === undefined || shortcut.altKey === event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export function KeyboardShortcutsHelp({ shortcuts }: { shortcuts: KeyboardShortcut[] }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold mb-3">⌨️ Keyboard Shortcuts</h3>
      <ul className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <li key={index} className="flex justify-between items-center text-sm">
            <span className="text-gray-600">{shortcut.description}</span>
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
              {shortcut.ctrlKey && 'Ctrl + '}
              {shortcut.shiftKey && 'Shift + '}
              {shortcut.altKey && 'Alt + '}
              {shortcut.key.toUpperCase()}
            </kbd>
          </li>
        ))}
      </ul>
    </div>
  );
}
