'use client';

import { useEffect, useState } from 'react';

export default function ContactPage() {
  const [pageContent, setPageContent] = useState<any>(null);
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPageContent();
    fetchSiteConfig();
  }, []);

  const fetchPageContent = async () => {
    try {
      const response = await fetch('/api/public/pages/contact');
      if (response.ok) {
        const page = await response.json();
        setPageContent(page);
      }
    } catch (error) {
      console.error('Failed to fetch page content:', error);
    }
  };

  const fetchSiteConfig = async () => {
    try {
      const response = await fetch('/api/public/contact-info');
      if (response.ok) {
        const config = await response.json();
        setSiteConfig(config);
      }
    } catch (error) {
      console.error('Failed to fetch site config:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-300 rounded w-full"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-300 rounded w-full"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
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
          {pageContent?.title || 'Contact'}
        </h1>
        
        {pageContent?.content ? (
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: pageContent.content }}
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Informații Contact</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">📧 Email</h3>
                  <a 
                    href={`mailto:${siteConfig?.email || 'crys.cristi@yahoo.com'}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline block"
                  >
                    {siteConfig?.email || 'crys.cristi@yahoo.com'}
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">📞 Telefon</h3>
                  <a 
                    href={`tel:${siteConfig?.phone || '+0753615752'}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline block"
                  >
                    {siteConfig?.phone || '0753615742'}
                  </a>
                  <p className="text-gray-600">Magazin fizic Luni - Vineri: 9:00 - 18:00</p>
                  <p className="text-gray-600">Magazin online Non-stop</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">📍 Adresă</h3>
                  <p className="text-gray-600">
                    {siteConfig?.address || 'Str. Gari nr. 69, Galati, România, Cod poștal: 08001'}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">🕐 Program</h3>
                  {siteConfig?.businessHours ? (
                    <div className="text-gray-600">
                      <p className="font-medium">Magazin fizic:</p>
                      {Object.entries(siteConfig.businessHours).map(([day, hours]) => (
                        <p key={day} className="capitalize">
                          {day}: {hours as string}
                        </p>
                      ))}
                      <p className="mt-2 font-medium">Magazin online: Non stop</p>
                    </div>
                  ) : (
                    <p className="text-gray-600">
                      Magazin fizic<br />
                      Luni - Vineri: 9:00 - 18:00<br />
                      Sâmbătă: 10:00 - 14:00<br />
                      Duminică: Închis<br />
                      <br />
                      Magazin online<br />
                      Non stop
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Trimite-ne un Mesaj</h2>
              
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nume
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Numele tău"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subiect
                  </label>
                  <input
                    type="text"
                    id="subject"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Subiectul mesajului"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Mesaj
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Scrie mesajul tău aici..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Trimite Mesaj
                </button>
              </form>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Întrebări Frecvente</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Cum pot plasa o comandă?</h3>
              <p className="text-gray-600">
                Adaugă produsele dorite în coș, mergi la checkout și completează datele de livrare.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Care sunt metodele de plată acceptate?</h3>
              <p className="text-gray-600">
                Acceptăm plata cu cardul, transfer bancar și ramburs la livrare.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Cât durează livrarea?</h3>
              <p className="text-gray-600">
                Livrarea standard durează 2-3 zile lucrătoare. Oferim și livrare express în 24h.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Pot returna un produs?</h3>
              <p className="text-gray-600">
                Da, ai 30 de zile pentru a returna produsele în stare originală.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
