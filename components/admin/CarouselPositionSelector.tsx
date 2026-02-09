'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface CarouselPosition {
  position: number;
  isAvailable: boolean;
  currentItem?: {
    id: string;
    type: string;
    title?: string;
  };
}

interface CarouselPositionSelectorProps {
  selectedPosition: number;
  onPositionChange: (position: number) => void;
  currentProductId?: string;
}

export default function CarouselPositionSelector({
  selectedPosition,
  onPositionChange,
  currentProductId,
}: CarouselPositionSelectorProps) {
  const [positions, setPositions] = useState<CarouselPosition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailablePositions();
  }, []);

  const fetchAvailablePositions = async () => {
    try {
      const response = await apiClient.get('/api/carousel/available-positions');
      setPositions(response.data);
    } catch (error) {
      console.error('Failed to fetch carousel positions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Poziție în Carousel (1-10)
      </label>
      
      <div className="grid grid-cols-5 gap-2">
        {positions.map((pos) => {
          const isCurrentProduct = pos.currentItem?.id === currentProductId;
          const isAvailable = pos.isAvailable || isCurrentProduct;
          const isSelected = selectedPosition === pos.position;

          return (
            <button
              key={pos.position}
              type="button"
              onClick={() => isAvailable && onPositionChange(pos.position)}
              disabled={!isAvailable}
              className={`
                relative p-4 rounded-lg border-2 transition-all
                ${isSelected 
                  ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600' 
                  : isAvailable
                    ? 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                    : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                }
              `}
              title={
                isAvailable
                  ? isCurrentProduct
                    ? `Poziția ${pos.position} (produs curent)`
                    : `Poziția ${pos.position} - Disponibilă`
                  : `Poziția ${pos.position} - Ocupată de: ${pos.currentItem?.title || 'Necunoscut'}`
              }
            >
              <div className="text-center">
                <div className={`text-2xl font-bold ${isSelected ? 'text-blue-600' : 'text-gray-700'}`}>
                  {pos.position}
                </div>
                {!isAvailable && (
                  <div className="absolute top-1 right-1">
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                  </div>
                )}
                {isSelected && (
                  <div className="absolute top-1 right-1">
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-blue-50 border-2 border-blue-600 rounded"></span>
          <span>Selectată</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-white border-2 border-gray-300 rounded"></span>
          <span>Disponibilă</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-gray-100 border-2 border-gray-200 rounded"></span>
          <span>Ocupată</span>
        </div>
      </div>

      {selectedPosition > 0 && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Poziția selectată:</strong> {selectedPosition}
            <br />
            <span className="text-xs text-blue-600">
              Produsul va apărea în carousel la poziția {selectedPosition}
            </span>
          </p>
        </div>
      )}

      {!positions.some(p => p.isAvailable || p.currentItem?.id === currentProductId) && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Toate pozițiile sunt ocupate. Dezactivează un produs din carousel pentru a elibera o poziție.
          </p>
        </div>
      )}
    </div>
  );
}
