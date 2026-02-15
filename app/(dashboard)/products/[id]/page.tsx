'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, favoritesAPI, cartAPI } from '@/lib/api-client';
import { useTranslation } from '@/hooks/useTranslation';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { Heart, ShoppingCart } from 'lucide-react';
import CurrencyPrice from '@/components/CurrencyPrice';
import { stripHtml } from '@/utils/stripHtml';

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { refreshCartCount } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  // Dynamic translations for product
  const { value: translatedTitle } = useDynamicTranslation(
    'product',
    params.id as string,
    'title',
    product?.title || ''
  );

  const { value: translatedDescription } = useDynamicTranslation(
    'product',
    params.id as string,
    'description',
    product?.description || ''
  );

  const { value: translatedContent } = useDynamicTranslation(
    'product',
    params.id as string,
    'content',
    product?.content || ''
  );

  useEffect(() => {
    if (params.id) {
      fetchProduct();
      checkIfFavorite();
      // Track viewed product
      trackViewedProduct(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    // Set default quantity when product loads
    if (product) {
      if (product.priceType === 'fixed') {
        // Pentru produse fixe, începem cu 1 bucată
        setSelectedQuantity(1);
      } else if (product.availableQuantities && product.availableQuantities.length > 0) {
        // Pentru per_unit, sortează cantitățile și ia cea mai mică
        const sortedQtys = [...product.availableQuantities].sort((a, b) => a - b);
        setSelectedQuantity(sortedQtys[0]); // Cea mai mică cantitate disponibilă (ex: 0.2 kg)
      } else {
        setSelectedQuantity(product.minQuantity || 0.5); // Default la minQuantity sau 0.5
      }
    }
  }, [product]);

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
      await cartAPI.addToCart(params.id as string, selectedQuantity);
      
      // Actualizează indicatorul de coș
      await refreshCartCount();
      
      alert(`Produs adăugat în coș! Cantitate: ${selectedQuantity} ${product.unitName || 'buc'}`);
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
    <div className="max-w-7xl mx-auto px-4">
      <button onClick={() => router.back()} className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2">
        ← {t('back')}
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Layout 2 coloane */}
        <div className="grid lg:grid-cols-2 gap-8 p-6">
          
          {/* COLOANA STÂNGA - Imagine + Descrieri */}
          <div className="space-y-6">
            {/* Imagine produs */}
            <div className="relative flex items-center justify-center" style={{height: '350px'}}>
              <img
                src={product.image || '/placeholder.jpg'}
                alt={stripHtml(product.title)}
                style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', display: 'block' }}
              />
            </div>

            {/* Descrieri sub imagine */}
            <div className="space-y-4">
              {product.description && (
                <div>
                  <div className="text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }} />
                </div>
              )}

              {/* Afișează content doar dacă este diferit de description */}
              {product.content && product.content !== product.description && (
                <div>
                  <div className="text-gray-600 leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: product.content }} />
                </div>
              )}

              {/* Informații Importante - NU SE AFIȘEAZĂ DELOC DACĂ E GOL */}
              {product.importantInfo && (() => {
                // Elimină tagurile HTML și verifică dacă mai rămâne text
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = product.importantInfo;
                const textContent = tempDiv.textContent || tempDiv.innerText || '';
                return textContent.trim() !== '';
              })() && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                  <div 
                    className="text-gray-800 leading-relaxed"
                    style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                    dangerouslySetInnerHTML={{ __html: product.importantInfo }}
                  />
                </div>
              )}

              {/* Advance Order Warning */}
              {product.advanceOrderDays > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-800">
                    <strong>⚠️ Comandă în avans:</strong> Acest produs trebuie comandat cu minimum {product.advanceOrderDays} {product.advanceOrderDays === 1 ? 'zi' : 'zile'} înainte de livrare.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* COLOANA DREAPTA - Preț, Calculator, Favorite */}
          <div className="space-y-6">
            
            {/* Header cu titlu și favorite */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-gray-900 flex-1">{stripHtml(translatedTitle || product.title)}</h1>
              <button
                onClick={toggleFavorite}
                className="flex-shrink-0 p-3 border-2 border-gray-300 rounded-full hover:border-red-500 hover:bg-red-50 transition"
                title={isFavorite ? 'Șterge din favorite' : 'Adaugă la favorite'}
              >
                <Heart className={`h-6 w-6 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
              </button>
            </div>
            
            {/* Preț */}
            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-blue-600">
                  <CurrencyPrice amount={product.price} />
                </span>
                {product.priceType === 'per_unit' && product.unitName && product.unitName !== 'bucată' ? (
                  <div>
                    <span className="text-lg text-gray-600">
                      / {product.unitName}
                    </span>
                    {/* Afișare cantități disponibile pentru per_unit */}
                    {product.availableQuantities && product.availableQuantities.length > 0 && (
                      <span className="block text-sm text-gray-500 mt-1">
                        (cantități disponibile: {product.availableQuantities.join(', ')} {product.unitName})
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-lg text-gray-600">
                    / bucată
                    <span className="block text-sm text-gray-500 mt-1">
                      (fiecare = {
                        product.availableQuantities && product.availableQuantities.length > 0 
                          ? product.availableQuantities[0] 
                          : (product.minQuantity || 1)
                      } {product.unitName || 'buc'})
                    </span>
                  </span>
                )}
              </div>
              {product.oldPrice && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xl text-gray-400 line-through">
                    {product.oldPrice} lei
                  </span>
                  <span className="px-2 py-1 bg-red-500 text-white text-sm font-bold rounded">
                    -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Stoc - afișare bazată pe stockDisplayMode */}
            <div>
              {/* Verifică dacă există informații despre stoc */}
              {product.stockStatus === 'unknown' ? (
                // Hidden mode - nu arată nimic
                null
              ) : product.stockStatus ? (
                // Status only mode - arată doar disponibil/indisponibil
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                  product.stockStatus === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  <span className="text-lg">{product.stockStatus === 'available' ? '✓' : '✗'}</span>
                  <span className="font-semibold">
                    {product.stockStatus === 'available' ? 'Disponibil' : 'Indisponibil'}
                  </span>
                </div>
              ) : product.stock !== undefined ? (
                // Visible mode - arată cantitatea exactă
                product.stock > 0 ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
                    <span className="text-lg">✓</span>
                    <span className="font-semibold">
                      În stoc: {((product.availableStock || product.stock) as number).toFixed(2)} {product.unitName || 'produse'}
                    </span>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full">
                    <span className="text-lg">✗</span>
                    <span className="font-semibold">{t('outOfStock')}</span>
                  </span>
                )
              ) : null}
            </div>

            {/* Calculator cantitate - afișat întotdeauna */}
            <div className="bg-white border-2 border-gray-300 rounded-xl p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Selectează cantitatea</h3>
                
                {/* Butoane +/- */}
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => {
                      // Pentru priceType fixed: step = 1 bucată
                      // Pentru per_unit: step = cea mai mică cantitate (multipli)
                      const step = product.priceType === 'fixed' 
                        ? 1 
                        : (product.availableQuantities?.[0] || product.minQuantity || 0.5);
                      const minQty = step;
                      setSelectedQuantity(Math.max(minQty, selectedQuantity - step));
                    }}
                    className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-2xl flex items-center justify-center transition"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={product.priceType === 'fixed' ? 1 : (product.availableQuantities?.[0] || product.minQuantity || 0.5)}
                    step={product.priceType === 'fixed' ? 1 : (product.availableQuantities?.[0] || product.minQuantity || 0.5)}
                    value={selectedQuantity}
                    onChange={(e) => {
                      const step = product.priceType === 'fixed' 
                        ? 1 
                        : (product.availableQuantities?.[0] || product.minQuantity || 0.5);
                      const minQty = step;
                      let val = parseFloat(e.target.value) || minQty;
                      
                      // Pentru priceType fixed, rotunjim la număr întreg
                      if (product.priceType === 'fixed') {
                        val = Math.round(val);
                      }
                      setSelectedQuantity(Math.max(minQty, val));
                    }}
                    className="flex-1 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg py-3"
                  />
                  <button
                    onClick={() => {
                      // Pentru priceType fixed: step = 1 bucată
                      // Pentru per_unit: step = cea mai mică cantitate (multipli)
                      const step = product.priceType === 'fixed' 
                        ? 1 
                        : (product.availableQuantities?.[0] || product.minQuantity || 0.5);
                      setSelectedQuantity(selectedQuantity + step);
                    }}
                    className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-2xl flex items-center justify-center transition"
                  >
                    +
                  </button>
                </div>

                {/* Total */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      Cantitate: <strong className="text-gray-900">
                        {product.priceType === 'fixed' ? (
                          // Pentru fixed: afișăm numărul de bucăți și cantitatea totală în kg
                          <>
                            {selectedQuantity} {selectedQuantity === 1 ? 'bucată' : 'bucăți'}
                            {product.availableQuantities && product.availableQuantities[0] && (
                              <span className="text-gray-600 ml-1">
                                ({(selectedQuantity * product.availableQuantities[0]).toFixed(2)} {product.unitName || 'kg'})
                              </span>
                            )}
                          </>
                        ) : (
                          // Pentru per_unit: afișăm cantitatea în unități de măsură
                          `${selectedQuantity.toFixed(2)} ${product.unitName || 'buc'}`
                        )}
                      </strong>
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      <CurrencyPrice amount={
                        product.priceType === 'fixed'
                          ? selectedQuantity * product.price  // Pentru fixed: număr bucăți × preț per bucată
                          : selectedQuantity * product.price  // Pentru per_unit: cantitate × preț per unitate
                      } />
                    </span>
                  </div>
                </div>

                {/* Cantități rapide - doar dacă există availableQuantities */}
                {product.availableQuantities && product.availableQuantities.length > 1 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Cantități rapide:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {product.availableQuantities.slice(0, 6).map((quantity: number) => (
                        <button
                          key={quantity}
                          onClick={() => setSelectedQuantity(quantity)}
                          className={`p-2 border-2 rounded-lg transition-all text-center ${
                            selectedQuantity === quantity
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          <div className="font-bold">{quantity}</div>
                          <div className="text-xs opacity-75">{product.unitName}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            {/* Buton Adaugă în coș */}
            <button
              onClick={addToCart}
              disabled={product.stock === 0}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-lg"
            >
              <ShoppingCart className="h-6 w-6" />
              Adaugă în coș
            </button>
          </div>
        </div>

        {/* Secțiunea completă de recenzii - sub cele 2 coloane, pe toată lățimea */}
        <div id="reviews" className="border-t p-6">
          <ReviewsSection productId={params.id as string} />
        </div>
      </div>
    </div>
  );
}

// Reviews Component  
function ReviewsSection({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  
  const isGuest = user?.role === 'guest';

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
        {isGuest ? (
          <div className="text-center">
            <button
              disabled
              className="px-6 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
              title="Contul de vizitator nu poate lăsa recenzii"
            >
              🔒 Blocat pentru vizitatori
            </button>
            <p className="text-xs text-gray-500 mt-1">Creează un cont pentru a lăsa recenzii</p>
          </div>
        ) : (
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
        )}
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
