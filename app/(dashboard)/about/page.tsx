'use client';

import { useEffect, useState } from 'react';

export default function AboutPage() {
  const [pageContent, setPageContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPageContent();
  }, []);

  const fetchPageContent = async () => {
    try {
      const response = await fetch('/api/public/pages/about');
      if (response.ok) {
        const page = await response.json();
        setPageContent(page);
      }
    } catch (error) {
      console.error('Failed to fetch page content:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-8"></div>
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="space-y-4">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          {pageContent?.title || 'Despre Noi'}
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-8">
          {pageContent?.content ? (
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: pageContent.content }}
            />
          ) : (
            // Fallback content if page not found in database
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Cine Suntem</h2>
                <p className="text-gray-600 leading-relaxed">
                  Suntem o platformă modernă de e-commerce dedicată să ofere cea mai bună experiență de cumpărături online. 
                  Cu o gamă variată de produse de calitate și un serviciu clienți excepțional, ne străduim să fim partenerul 
                  tău de încredere pentru toate nevoile tale de shopping.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Misiunea Noastră</h2>
                <p className="text-gray-600 leading-relaxed">
                  Misiunea noastră este să facem shopping-ul online simplu, sigur și plăcut pentru toată lumea. 
                  Oferim produse de calitate la prețuri competitive, cu livrare rapidă și suport clienți dedicat.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">De Ce Să Ne Alegi</h2>
                
                {/* Benefits Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center border border-blue-200">
                    <div className="text-5xl mb-3">🚚</div>
                    <h3 className="font-bold text-lg mb-2 text-gray-800">Livrare Rapidă</h3>
                    <p className="text-sm text-gray-700">Livrare în 2-3 zile lucrătoare în toată țara</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 text-center border border-green-200">
                    <div className="text-5xl mb-3">💳</div>
                    <h3 className="font-bold text-lg mb-2 text-gray-800">Plată Securizată</h3>
                    <p className="text-sm text-gray-700">Plătești în siguranță cu cardul sau ramburs</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 text-center border border-purple-200">
                    <div className="text-5xl mb-3">🎯</div>
                    <h3 className="font-bold text-lg mb-2 text-gray-800">Calitate Garantată</h3>
                    <p className="text-sm text-gray-700">Produse verificate și garanție de calitate</p>
                  </div>
                </div>

                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>Produse de calitate verificate</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>Prețuri competitive și oferte speciale</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>Livrare rapidă în toată țara</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>Suport clienți 24/7</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>Plată securizată</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>Retur ușor în 30 de zile</span>
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Tehnologie Modernă</h2>
                <p className="text-gray-600 leading-relaxed">
                  Platforma noastră folosește cele mai noi tehnologii pentru a-ți oferi o experiență de shopping superioară:
                </p>
                <ul className="mt-4 space-y-2 text-gray-600">
                  <li>• Asistent AI pentru recomandări personalizate</li>
                  <li>• Interfață responsive pentru toate dispozitivele</li>
                  <li>• Sistem de plată securizat</li>
                  <li>• Tracking comenzi în timp real</li>
                </ul>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
