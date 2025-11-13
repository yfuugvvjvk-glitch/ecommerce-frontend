'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export default function OptimizedImage({
  src,
  alt,
  width = 300,
  height = 200,
  className = '',
  priority = false,
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  // Check if it's an external URL or local path
  const isExternal = src.startsWith('http://') || src.startsWith('https://');

  if (!isExternal) {
    // For local images, use Next.js Image component
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={imgSrc}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setImgSrc('/images/placeholder.jpg');
            setIsLoading(false);
          }}
          priority={priority}
          quality={85}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
      </div>
    );
  }

  // For external images, use regular img with lazy loading
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={imgSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImgSrc('https://via.placeholder.com/300x200?text=No+Image');
          setIsLoading(false);
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
}
