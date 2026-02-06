'use client';

import { useState, useEffect } from 'react';

export default function RomanianClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time
    setTime(new Date());

    // Update every second
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return null; // Prevent hydration mismatch
  }

  // Format time for Romania timezone (EET/EEST)
  const romanianTime = time.toLocaleTimeString('ro-RO', {
    timeZone: 'Europe/Bucharest',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const romanianDate = time.toLocaleDateString('ro-RO', {
    timeZone: 'Europe/Bucharest',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed top-4 left-4 bg-white/95 backdrop-blur-sm shadow-lg rounded-lg p-3 border border-gray-200 z-40">
      <div className="text-center">
        <div className="text-xl font-bold text-blue-600 font-mono">
          {romanianTime}
        </div>
        <div className="text-xs text-gray-600 mt-1 capitalize">
          {romanianDate}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          🇷🇴 România
        </div>
      </div>
    </div>
  );
}
