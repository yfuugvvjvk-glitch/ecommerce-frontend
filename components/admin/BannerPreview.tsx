'use client';

import { AnnouncementBannerConfig } from '@/types';

interface BannerPreviewProps {
  config: AnnouncementBannerConfig;
}

export default function BannerPreview({ config }: BannerPreviewProps) {
  // Show placeholder if both title and description are empty
  const isEmpty = !config.title.trim() && !config.description.trim();

  if (isEmpty) {
    return (
      <div className="w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-gray-500 text-sm">
          Preview-ul va apărea aici când adăugați titlu sau descriere
        </p>
      </div>
    );
  }

  return (
    <div
      role="banner"
      aria-label="Preview banner anunț"
      className="relative w-full bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300"
    >
      {/* Content container with responsive padding */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Title */}
        {config.title.trim() && (
          <h2
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
            {config.title}
          </h2>
        )}

        {/* Description */}
        {config.description.trim() && (
          <p
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
            {config.description}
          </p>
        )}
      </div>
    </div>
  );
}
