'use client';

import { Globe } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function LanguageSwitcher() {
  const { language, changeLanguage } = useTranslation();

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors">
        <Globe className="h-5 w-5 text-gray-700" />
        <span className="text-sm font-medium text-gray-700 uppercase">{language}</span>
      </button>
      
      <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all max-h-80 overflow-y-auto">
        <button
          onClick={() => changeLanguage('ro')}
          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
            language === 'ro' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
          }`}
        >
          🇷🇴 Română
        </button>
        <button
          onClick={() => changeLanguage('en')}
          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
            language === 'en' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
          }`}
        >
          🇬🇧 English
        </button>
        <button
          onClick={() => changeLanguage('fr')}
          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
            language === 'fr' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
          }`}
        >
          🇫🇷 Français
        </button>
        <button
          onClick={() => changeLanguage('de')}
          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
            language === 'de' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
          }`}
        >
          🇩🇪 Deutsch
        </button>
        <button
          onClick={() => changeLanguage('es')}
          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
            language === 'es' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
          }`}
        >
          🇪🇸 Español
        </button>
        <button
          onClick={() => changeLanguage('it')}
          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
            language === 'it' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
          }`}
        >
          🇮🇹 Italiano
        </button>
      </div>
    </div>
  );
}
