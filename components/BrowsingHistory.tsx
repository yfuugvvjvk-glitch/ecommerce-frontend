'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface HistoryItem {
  path: string;
  title: string;
  timestamp: number;
}

export default function BrowsingHistory() {
  const pathname = usePathname();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load history from localStorage
    const savedHistory = localStorage.getItem('browsingHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    // Add current page to history
    if (pathname) {
      const title = getPageTitle(pathname);
      const newItem: HistoryItem = {
        path: pathname,
        title,
        timestamp: Date.now(),
      };

      setHistory((prev) => {
        // Remove duplicates and keep last 10 items
        const filtered = prev.filter((item) => item.path !== pathname);
        const updated = [newItem, ...filtered].slice(0, 10);
        localStorage.setItem('browsingHistory', JSON.stringify(updated));
        return updated;
      });
    }
  }, [pathname]);

  const getPageTitle = (path: string): string => {
    const titles: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/products': 'Produse',
      '/offers': 'Oferte',
      '/cart': 'Coș',
      '/checkout': 'Checkout',
      '/orders': 'Comenzi',
      '/profile': 'Profil',
      '/admin': 'Administrator',
      '/about': 'Despre',
      '/contact': 'Contact',
    };
    return titles[path] || path;
  };

  const getPageIcon = (path: string): string => {
    const icons: Record<string, string> = {
      '/dashboard': '📊',
      '/products': '🛍️',
      '/offers': '🎉',
      '/cart': '🛒',
      '/checkout': '💳',
      '/orders': '📦',
      '/profile': '👤',
      '/admin': '👨‍💼',
      '/about': 'ℹ️',
      '/contact': '📞',
    };
    return icons[path] || '📄';
  };

  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Acum';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}z`;
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('browsingHistory');
    setIsOpen(false);
  };

  if (history.length <= 1) return null;

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 transition rounded hover:bg-gray-100"
        aria-label="Istoric navigare"
      >
        <span>🕐</span>
        <span className="hidden sm:inline">Istoric</span>
        {history.length > 1 && (
          <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
            {history.length - 1}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">
                🕐 Istoric Navigare
              </h3>
              <button
                onClick={clearHistory}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Șterge
              </button>
            </div>

            <div className="py-2">
              {history.slice(1).map((item, index) => (
                <Link
                  key={index}
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getPageIcon(item.path)}</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.title}
                        </div>
                        <div className="text-xs text-gray-500">{item.path}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatTime(item.timestamp)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {history.length === 1 && (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">🕐</div>
                <p className="text-sm">Istoricul este gol</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
