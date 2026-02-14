'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from './LanguageSwitcher';

interface CarouselItem {
  id: string;
  type: 'product' | 'media' | 'custom';
  position: number;
  
  // Product data
  product?: {
    id: string;
    title: string;
    description?: string;
    price: number;
    oldPrice?: number;
    image: string;
  };
  
  // Media data
  media?: {
    id: string;
    url: string;
    title?: string;
    description?: string;
    altText?: string;
  };
  
  // Custom/override fields
  title?: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  customTitle?: string;
  customDescription?: string;
  
  // Text styling
  textStyle?: {
    color?: string;
    fontSize?: string;
    fontFamily?: string;
    fontWeight?: string;
    textAlign?: string;
    lineHeight?: string;
    letterSpacing?: string;
    backgroundColor?: string;
  };
}

interface CarouselProps {
  items: CarouselItem[];
  autoPlayInterval?: number;
}

export default function Carousel({ items, autoPlayInterval = 5000 }: CarouselProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<CarouselItem | null>(null);

  useEffect(() => {
    if (!isPaused && items.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }, autoPlayInterval);

      return () => clearInterval(interval);
    }
  }, [isPaused, items.length, autoPlayInterval]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handleItemClick = (item: CarouselItem) => {
    if (item.type === 'product' && item.product) {
      window.location.href = `/products/${item.product.id}`;
    } else if (item.type === 'media') {
      setSelectedMedia(item);
      setShowMediaModal(true);
    } else if (item.linkUrl) {
      window.location.href = item.linkUrl;
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
        <p className="text-gray-500">{t('noOffersAvailable')}</p>
      </div>
    );
  }

  const currentItem = items[currentIndex];

  // Get display title and description (with custom overrides)
  const rawTitle = currentItem.customTitle || 
    (currentItem.type === 'product' && currentItem.product?.title) ||
    (currentItem.type === 'media' && currentItem.media?.title) ||
    currentItem.title || '';
  
  // Nu afișa titlul dacă este un nume de fișier (conține extensii precum .jpg, .png, etc.)
  const isFileName = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|mp4|mov|avi|pdf|doc|docx)$/i.test(rawTitle);
  const displayTitle = isFileName ? '' : rawTitle;

  const displayDescription = currentItem.customDescription ||
    (currentItem.type === 'product' && currentItem.product?.description) ||
    (currentItem.type === 'media' && currentItem.media?.description) ||
    currentItem.description || '';

  // Get image URL
  const imageUrl = currentItem.type === 'product' && currentItem.product?.image
    ? currentItem.product.image
    : currentItem.type === 'media' && currentItem.media?.url
    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${currentItem.media.url}`
    : currentItem.imageUrl || '/placeholder.jpg';

  // Get text styles - support both old and new format
  let titleStyle, descriptionStyle, linkStyle, overlayBackground;
  
  if ((currentItem.textStyle as any)?.title && (currentItem.textStyle as any)?.description) {
    // New format with separate styles
    titleStyle = (currentItem.textStyle as any).title;
    descriptionStyle = (currentItem.textStyle as any).description;
    linkStyle = (currentItem.textStyle as any).link || {
      color: '#3b82f6',
      fontSize: '14px',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      textAlign: 'center',
      lineHeight: '1.5',
      letterSpacing: '0px'
    };
    overlayBackground = (currentItem.textStyle as any).overlayBackground || 'rgba(0,0,0,0.5)';
  } else if (currentItem.textStyle) {
    // Old format - single style for all text
    const oldStyle = currentItem.textStyle;
    titleStyle = {
      color: oldStyle.color || '#ffffff',
      fontSize: oldStyle.fontSize || '24px',
      fontFamily: oldStyle.fontFamily || 'Arial',
      fontWeight: oldStyle.fontWeight || 'bold',
      textAlign: oldStyle.textAlign || 'center',
      lineHeight: oldStyle.lineHeight || '1.5',
      letterSpacing: oldStyle.letterSpacing || '0px'
    };
    descriptionStyle = {
      ...titleStyle,
      fontSize: `${parseInt(oldStyle.fontSize || '24') * 0.6}px`,
      fontWeight: 'normal'
    };
    linkStyle = {
      color: '#3b82f6',
      fontSize: '14px',
      fontFamily: oldStyle.fontFamily || 'Arial',
      fontWeight: 'bold',
      textAlign: oldStyle.textAlign || 'center',
      lineHeight: '1.5',
      letterSpacing: '0px'
    };
    overlayBackground = oldStyle.backgroundColor || 'rgba(0,0,0,0.5)';
  } else {
    // No style - use defaults
    titleStyle = {
      color: '#ffffff',
      fontSize: '24px',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      textAlign: 'center',
      lineHeight: '1.5',
      letterSpacing: '0px'
    };
    descriptionStyle = {
      color: '#ffffff',
      fontSize: '16px',
      fontFamily: 'Arial',
      fontWeight: 'normal',
      textAlign: 'center',
      lineHeight: '1.5',
      letterSpacing: '0px'
    };
    linkStyle = {
      color: '#3b82f6',
      fontSize: '14px',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      textAlign: 'center',
      lineHeight: '1.5',
      letterSpacing: '0px'
    };
    overlayBackground = 'rgba(0,0,0,0.5)';
  }

  return (
    <>
      <div
        className="relative bg-white rounded-lg shadow-md overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Main Image - Clickable */}
        <div 
          onClick={() => handleItemClick(currentItem)}
          className="relative w-full cursor-pointer overflow-hidden"
          style={{ height: '450px' }}
        >
          <img
            src={imageUrl}
            alt={displayTitle}
            width="100%"
            height="100%"
            style={{ width: '100%', height: '100%', display: 'block' }}
            className="hover:scale-105 transition-transform duration-300"
          />
          
          {/* Text Overlay with Custom Styling - Centrat Jos */}
          {/* Afișează overlay-ul DOAR dacă există titlu, descriere sau link */}
          {((displayTitle && displayTitle.trim()) || (displayDescription && displayDescription.trim()) || currentItem.linkUrl) && (
            <div 
              className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end p-6"
              style={{
                backgroundColor: (displayTitle && displayTitle.trim()) || (displayDescription && displayDescription.trim()) || currentItem.linkUrl 
                  ? overlayBackground 
                  : 'transparent'
              }}
            >
              {displayTitle && displayTitle.trim() && (
                <h3
                  style={{
                    ...titleStyle,
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto',
                    marginBottom: (displayDescription && displayDescription.trim()) || currentItem.linkUrl ? '12px' : '0',
                    maxWidth: '100%'
                  }}
                >
                  {displayTitle}
                </h3>
              )}
              {displayDescription && displayDescription.trim() && (
                <p
                  style={{
                    ...descriptionStyle,
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto',
                    marginBottom: currentItem.linkUrl ? '12px' : '0',
                    maxWidth: '100%'
                  }}
                >
                  {displayDescription}
                </p>
              )}
              {currentItem.linkUrl && (
                <a
                  href={currentItem.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    ...linkStyle,
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  🔗 Vizitează Link
                </a>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {items.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
              aria-label="Previous item"
            >
              <ChevronLeft className="h-6 w-6 text-gray-800" />
            </button>

            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
              aria-label="Next item"
            >
              <ChevronRight className="h-6 w-6 text-gray-800" />
            </button>
          </>
        )}

        {/* Indicators */}
        {items.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white w-8' : 'bg-white/50'
                }`}
                aria-label={`Go to item ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Media Modal */}
      {showMediaModal && selectedMedia && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowMediaModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold">
                  {selectedMedia.customTitle || selectedMedia.media?.title || selectedMedia.title || 'Media'}
                </h3>
                <button
                  onClick={() => setShowMediaModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Enlarged Image */}
              <div className="mb-4 w-full rounded overflow-hidden" style={{ height: '600px' }}>
                <img
                  src={selectedMedia.type === 'media' && selectedMedia.media?.url
                    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${selectedMedia.media.url}`
                    : selectedMedia.imageUrl || '/placeholder.jpg'}
                  alt={selectedMedia.customTitle || selectedMedia.media?.title || ''}
                  width="100%"
                  height="100%"
                  style={{ width: '100%', height: '100%', display: 'block' }}
                  className="rounded"
                />
              </div>

              {/* Description */}
              {(selectedMedia.customDescription || selectedMedia.media?.description || selectedMedia.description) && (
                <div className="mb-4">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedMedia.customDescription || selectedMedia.media?.description || selectedMedia.description}
                  </p>
                </div>
              )}

              {/* Link */}
              {selectedMedia.linkUrl && (
                <div className="flex gap-2">
                  <a
                    href={selectedMedia.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    🔗 Vizitează Link
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
