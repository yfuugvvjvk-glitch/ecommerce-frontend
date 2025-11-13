'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await apiClient.get('/api/offers');
      // Filter only active offers
      const activeOffers = response.data.filter((offer: any) => offer.active);
      setOffers(activeOffers);
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    } finally {
      setLoading(false);
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
      <h1 className="text-3xl font-bold mb-6">🎉 Oferte Speciale</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map((offer: any) => (
          <div key={offer.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            {offer.image && (
              <div className="relative h-48 w-full">
                <img 
                  src={offer.image} 
                  alt={offer.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg">
                  -{offer.discount}%
                </div>
              </div>
            )}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{offer.title}</h2>
              <p className="text-gray-600 mb-4">{offer.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Valabil până: {new Date(offer.validUntil).toLocaleDateString('ro-RO')}
                </span>
                <Link
                  href={`/products?offer=${offer.id}`}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-pink-700 transition"
                >
                  Vezi Produse
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {offers.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Nu există oferte active</h2>
          <p className="text-gray-500">Revino mai târziu pentru oferte speciale!</p>
        </div>
      )}
    </div>
  );
}
