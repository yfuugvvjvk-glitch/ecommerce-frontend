'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMyReviews();
  }, []);

  const fetchMyReviews = async () => {
    try {
      const response = await apiClient.get('/api/user/reviews');
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (review: any) => {
    setEditingReview(review);
    setRating(review.rating);
    setComment(review.comment);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await apiClient.put(`/api/reviews/${editingReview.id}`, { rating, comment });
      alert('Review actualizat cu succes!');
      setEditingReview(null);
      fetchMyReviews();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la actualizare');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Sigur vrei să ștergi această recenzie?')) return;

    try {
      await apiClient.delete(`/api/reviews/${reviewId}`);
      alert('Review șters!');
      fetchMyReviews();
    } catch (error) {
      alert('Eroare la ștergere');
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
      <h1 className="text-3xl font-bold mb-6">⭐ Recenziile Mele</h1>

      {editingReview && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Editează recenzia</h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
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

            <div>
              <label className="block text-sm font-medium mb-2">Comentariu</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Se salvează...' : 'Salvează modificările'}
              </button>
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Anulează
              </button>
            </div>
          </form>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">⭐</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Nu ai recenzii încă</h2>
          <p className="text-gray-500 mb-6">Cumpără produse și lasă recenzii pentru a ajuta alți utilizatori!</p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Explorează Produsele
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <Link
                    href={`/products/${review.dataItemId}`}
                    className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                  >
                    {review.dataItem.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                          ⭐
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('ro-RO')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(review)}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    ✏️ Editează
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    🗑️ Șterge
                  </button>
                </div>
              </div>
              <p className="text-gray-700">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
