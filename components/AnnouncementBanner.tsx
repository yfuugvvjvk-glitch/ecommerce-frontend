'use client';

import { X } from 'lucide-react';
import { AnnouncementBannerConfig } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

interface AnnouncementBannerProps {
  config: AnnouncementBannerConfig;
  onClose?: () => void;
}

export default function AnnouncementBanner({ config, onClose }: AnnouncementBannerProps) {
  const { locale } = useTranslation();
  
  // Get translated title and description based on locale
  const getTranslatedText = (field: 'title' | 'description'): string => {
    const baseText = config[field];
    
    if (locale === 'ro') return baseText;
    
    // Try to get translated version
    const translatedField = `${field}${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof AnnouncementBannerConfig;
    const translatedText = config[translatedField];
    
    // Return translated text if available, otherwise fallback to Romanian
    return (translatedText && typeof translatedText === 'string') ? translatedText : baseText;
  };
  
  const title = getTranslatedText('title');
  const description = getTranslatedText('description');
  
  // Don't render if both title and description are empty
  if (!title.trim() && !description.trim()) {
    return null;
  }

  return (
    <div
      role="banner"
      aria-label="Anunț important"
      className="relative w-full bg-white shadow-md rounded-lg overflow-hidden mb-6 transition-all duration-300"
    >
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClose();
            }
          }}
          className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition z-10"
          aria-label="Închide anunțul"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      )}

      {/* Content container with responsive padding */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Title */}
        {title.trim() && (
          <h2
            id="banner-title"
            className="mb-3 break-words"
            style={{
              color: config.titleStyle.color,
              backgroundColor: config.titleStyle.backgroundColor,
              fontSize: `${config.titleStyle.fontSize}px`,
              fontFamily: config.titleStyle.fontFamily,
              fontWeight: config.titleStyle.fontWeight,
              textAlign: config.titleStyle.textAlign,
              padding: '8px',
              borderRadius: '4px',
            }}
          >
            {title}
          </h2>
        )}

        {/* Description */}
        {description.trim() && (
          <p
            id="banner-description"
            className="break-words whitespace-pre-wrap"
            style={{
              color: config.descriptionStyle.color,
              backgroundColor: config.descriptionStyle.backgroundColor,
              fontSize: `${config.descriptionStyle.fontSize}px`,
              fontFamily: config.descriptionStyle.fontFamily,
              fontWeight: config.descriptionStyle.fontWeight,
              textAlign: config.descriptionStyle.textAlign,
              padding: '8px',
              borderRadius: '4px',
            }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
