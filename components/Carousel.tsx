'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from './LanguageSwitcher';

interface Offer {
  id: string;
  title: string;
  description: string;
  image: string;
  discount: number;
}

interface CarouselProps {
  offers: Offer[];
  autoPlayInterval?: number;
}

export default function Carousel({ offers, autoPlayInterval = 5000 }: CarouselProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isPaused && offers.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % offers.length);
      }, autoPlayInterval);

      return () => clearInterval(interval);
    }
  }, [isPaused, offers.length, autoPlayInterval]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % offers.length);
  };

  if (offers.length === 0) {
    return (
      <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
        <p className="text-gray-500">{t('noOffersAvailable')}</p>
      </div>
    );
  }

  const currentOffer = offers[currentIndex];

  return (
    <div
      className="relative bg-white rounded-lg shadow-md overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Image */}
      <div className="relative h-64 md:h-80 lg:h-96">
        <img
          src={currentOffer.image || '/placeholder.jpg'}
          alt={currentOffer.title}
          className="w-full h-full object-cover"
        />
        
        {/* Overlay with offer info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
          <h3 className="text-white text-2xl font-bold mb-2">{currentOffer.title}</h3>
          <p className="text-white/90 text-sm mb-2">{currentOffer.description}</p>
          <span className="inline-block bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            -{currentOffer.discount}% {t('discountLabel')}
          </span>
        </div>
      </div>

      {/* Navigation Buttons */}
      {offers.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
            aria-label="Previous offer"
          >
            <ChevronLeft className="h-6 w-6 text-gray-800" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
            aria-label="Next offer"
          >
            <ChevronRight className="h-6 w-6 text-gray-800" />
          </button>
        </>
      )}

      {/* Indicators */}
      {offers.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {offers.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white w-8' : 'bg-white/50'
              }`}
              aria-label={`Go to offer ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
