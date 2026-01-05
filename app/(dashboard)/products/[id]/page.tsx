'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, favoritesAPI, cartAPI } from '@/lib/api-client';
import { useTranslation } from '@/components/LanguageSwitcher';
import { useCart } from '@/lib/cart-context';
import { Heart, ShoppingCart } from 'lucide-react';

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { refreshCartCount } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
      checkIfFavorite();
      // Track viewed product
      trackViewedProduct(params.id as string);
    }
  }, [params.id]);

  const trackViewedProduct = (productId: string) => {
    try {
      const viewed = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
      const filtered = viewed.filter((id: string) => id !== productId);
      const updated = [productId, ...filtered].slice(0, 10); // Keep last 10
      localStorage.setItem('viewedProducts', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to track viewed product:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await apiClient.get(`/api/data/${params.id}`);
      setProduct(response.data.data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = async () => {
    try {
      const response = await favoritesAPI.check(params.id as string);
      setIsFavorite(response.data.isFavorite);
    } catch (error) {
      console.error('Failed to check favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    console.log('Toggle favorite:', { productId: params.id, currentState: isFavorite });
    try {
      if (isFavorite) {
        console.log('Removing from favorites...');
        const response = await favoritesAPI.remove(params.id as string);
        console.log('Remove response:', response);
        setIsFavorite(false);
        alert('Produs șters din favorite! ✓');
      } else {
        console.log('Adding to favorites...');
        const response = await favoritesAPI.add(params.id as string);
        console.log('Add response:', response);
        setIsFavorite(true);
        alert('Produs adăugat la favorite! ✓');
      }
      // Recheck favorite status to ensure consistency
      await checkIfFavorite();
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      const errorMsg = error.response?.data?.error || error.message || 'Eroare necunoscută';
      alert(isFavorite ? `Eroare la ștergerea din favorite: ${errorMsg}` : `Eroare la adăugarea în favorite: ${errorMsg}`);
      // Recheck on error too
      await checkIfFavorite();
    }
  };

  const addToCart = async () => {
    try {
      await cartAPI.addToCart(params.id as string, 1);
      
      // Actualizează indicatorul de coș
      await refreshCartCount();
      
      alert('Produs adăugat în coș!');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Eroare la adăugarea în coș');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Produsul nu a fost găsit</h2>
        <button onClick={() => router.back()} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          {t('back')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <button onClick={() => router.back()} className="mb-4 text-blue-600 hover:text-blue-800">
        ← {t('back')}
      </button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8 p-8">
          <div className="relative">
            <img
              src={product.image || '/placeholder.jpg'}
              alt={product.title}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
            
            {/* Rating */}
            {product.averageRating > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-2xl ${
                        star <= Math.round(product.averageRating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-lg font-semibold text-gray-700">
                  {product.averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">
                  ({product.reviewCount || 0} {product.reviewCount === 1 ? 'recenzie' : 'recenzii'})
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold text-blue-600">{product.price} RON</span>
              {product.oldPrice && (
                <span className="text-xl text-gray-400 line-through">{product.oldPrice} RON</span>
              )}
            </div>

            <div className="mb-6">
              <span className={`px-3 py-1 rounded-full text-sm ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {product.stock > 0 ? `${t('inStock')}: ${product.stock} buc` : t('outOfStock')}
              </span>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">{t('description')}:</h3>
              <p className="text-gray-600">{product.description || 'Fără descriere'}</p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Detalii:</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{product.content}</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={toggleFavorite}
                className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-lg hover:border-red-500 hover:text-red-500 transition"
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                {isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
              </button>

              <button
                onClick={addToCart}
                disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                <ShoppingCart className="h-5 w-5" />
                {t('addToCart')}
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <ReviewsSection productId={params.id as string} />
      </div>
    </div>
  );
}

// Reviews Component  
function ReviewsSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const response = await apiClient.get(`/api/products/${productId}/reviews`);
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Trebuie să fii autentificat pentru a lăsa o recenzie!');
      return;
    }
    
    setSubmitting(true);

    try {
      if (editingReview) {
        await apiClient.put(`/api/reviews/${editingReview.id}`, { rating, comment });
        alert('Review actualizat!');
      } else {
        await apiClient.post('/api/reviews', {
          dataItemId: productId,
          rating,
          comment,
        });
        alert('Review adăugat cu succes!');
      }
      
      setShowForm(false);
      setEditingReview(null);
      setRating(5);
      setComment('');
      fetchReviews();
    } catch (error: any) {
      console.error('Review submit error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Eroare necunoscută';
      alert(`Eroare la salvare review: ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review: any) => {
    setEditingReview(review);
    setRating(review.rating);
    setComment(review.comment);
    setShowForm(true);
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Sigur vrei să ștergi acest review?')) return;

    try {
      await apiClient.delete(`/api/reviews/${reviewId}`);
      alert('Review șters!');
      fetchReviews();
    } catch (error: any) {
      console.error('Review delete error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Eroare necunoscută';
      alert(`Eroare la ștergere: ${errorMsg}`);
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">⭐ Recenzii și Rating</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-3xl font-bold text-yellow-500">{averageRating}</span>
            <div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={star <= Math.round(Number(averageRating)) ? 'text-yellow-400' : 'text-gray-300'}>
                    ⭐
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-600">{reviews.length} recenzii</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingReview(null);
            setRating(5);
            setComment('');
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Anulează' : '✍️ Scrie recenzie'}
        </button>
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="font-semibold mb-4">{editingReview ? 'Editează recenzia' : 'Adaugă recenzie'}</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="text-3xl transition-transform hover:scale-110"
                >
                  {star <= rating ? '⭐' : '☆'}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Comentariu</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Scrie părerea ta despre acest produs..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Se salvează...' : editingReview ? 'Actualizează' : 'Publică recenzia'}
          </button>
        </form>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-8">Se încarcă recenziile...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Nu există recenzii încă. Fii primul care lasă o recenzie!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-4 last:border-b-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{review.user.name}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('ro-RO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                {review.isOwner && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(review)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      ✏️ Editează
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      🗑️ Șterge
                    </button>
                  </div>
                )}
              </div>
              <p className="text-gray-700">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
