'use client';

import { useEffect, useState } from 'react';
import { favoritesAPI } from '@/lib/api-client';
import { useTranslation } from '@/components/LanguageSwitcher';
import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function FavoritesPage() {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await favoritesAPI.getAll();
      setFavorites(response.data);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (dataItemId: string) => {
    console.log('Attempting to remove favorite:', dataItemId);
    try {
      const response = await favoritesAPI.remove(dataItemId);
      console.log('Remove favorite response:', response);
      setFavorites(favorites.filter((fav: any) => fav.dataItemId !== dataItemId));
      alert('Produs șters din favorite! ✓');
    } catch (error: any) {
      console.error('Failed to remove favorite:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      const errorMsg = error.response?.data?.error || error.message || 'Eroare necunoscută';
      alert(`Eroare la ștergerea din favorite: ${errorMsg}`);
      // Refresh favorites list to ensure consistency
      fetchFavorites();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">❤️ {t('myFavorites')}</h1>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('noFavorites')}</h2>
          <p className="text-gray-500 mb-6">{t('addFavoritesText')}</p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {t('exploreProducts')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {favorites.map((favorite: any) => (
            <div key={favorite.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative group">
              <button
                onClick={() => removeFavorite(favorite.dataItemId)}
                className="absolute top-2 right-2 z-10 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
              >
                <Heart className="h-5 w-5 fill-red-500 text-red-500" />
              </button>

              <Link href={`/products/${favorite.dataItemId}`}>
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={favorite.dataItem?.image || '/placeholder.jpg'}
                    alt={favorite.dataItem?.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-800 truncate group-hover:text-blue-600 mb-2">
                    {favorite.dataItem?.title}
                  </h3>
                  <p className="text-lg font-bold text-blue-600">
                    {favorite.dataItem?.price} RON
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
