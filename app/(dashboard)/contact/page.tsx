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
      const response = await fetch('/api/public/site-config?keys=contact_email,contact_phone,contact_address,business_hours');
      if (response.ok) {
        const config = await response.json();
        console.log('Site config loaded:', config);
        setSiteConfig(config);
      } else {
        console.error('Failed to fetch site config, status:', response.status);
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
          (() => {
            try {
              const content = typeof pageContent.content === 'string' 
                ? JSON.parse(pageContent.content) 
                : pageContent.content;
              
              return (
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Contact Info */}
                  <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Informații Contact</h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <img src="/images/email.png" className="h-8 w-8 mr-3 mt-1" alt="Email" />
                        <div>
                          <h3 className="font-semibold text-gray-700 mb-1">Email</h3>
                          <a 
                            href={`mailto:${content.email || siteConfig?.contact_email}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline block"
                          >
                            {content.email || siteConfig?.contact_email}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <img src="/images/phone.jpg" className="h-8 w-8 mr-3 mt-1" alt="Phone" />
                        <div>
                          <h3 className="font-semibold text-gray-700 mb-1">Telefon</h3>
                          <a 
                            href={`tel:${content.phone || siteConfig?.contact_phone}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline block"
                          >
                            {content.phone || siteConfig?.contact_phone}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <img src="/images/location.png" className="h-8 w-8 mr-3 mt-1" alt="Location" />
                        <div>
                          <h3 className="font-semibold text-gray-700 mb-1">Adresă</h3>
                          <p className="text-gray-600">
                            {content.address || siteConfig?.contact_address}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <img src="/images/orar.jpg" className="h-8 w-8 mr-3 mt-1" alt="Schedule" />
                        <div>
                          <h3 className="font-semibold text-gray-700 mb-1">Program</h3>
                          <p className="text-gray-600">{content.schedule || 'Magazin fizic: Luni - Vineri: 9:00 - 18:00'}</p>
                          <p className="text-gray-600">{content.scheduleOnline || 'Magazin online: Non-stop'}</p>
                        </div>
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
              );
            } catch (e) {
              console.error('Failed to parse page content:', e);
              return <div className="text-red-600">Eroare la încărcarea conținutului paginii</div>;
            }
          })()
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Informații Contact</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">📧 Email</h3>
                  <a 
                    href={`mailto:${siteConfig?.contact_email || 'contact@site.ro'}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline block"
                  >
                    {siteConfig?.contact_email || 'contact@site.ro'}
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">📞 Telefon</h3>
                  <a 
                    href={`tel:${siteConfig?.contact_phone || '+40 123 456 789'}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline block"
                  >
                    {siteConfig?.contact_phone || '+40 123 456 789'}
                  </a>
                  <p className="text-gray-600 mt-1">Magazin fizic: Luni - Vineri: 9:00 - 18:00</p>
                  <p className="text-gray-600">Magazin online: Non-stop</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">📍 Adresă</h3>
                  <p className="text-gray-600">
                    {siteConfig?.contact_address || 'Strada Exemplu, Nr. 123, București, România'}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">🕐 Program</h3>
                  {siteConfig?.business_hours ? (
                    <div className="text-gray-600">
                      <p className="font-medium mb-2">Magazin fizic:</p>
                      {typeof siteConfig.business_hours === 'object' ? (
                        Object.entries(siteConfig.business_hours).map(([day, hours]) => (
                          <p key={day} className="capitalize">
                            <span className="font-medium">{day}:</span> {hours as string}
                          </p>
                        ))
                      ) : (
                        <p>{siteConfig.business_hours}</p>
                      )}
                      <p className="mt-3 font-medium">Magazin online:</p>
                      <p>Non stop - 24/7</p>
                    </div>
                  ) : (
                    <div className="text-gray-600">
                      <p className="font-medium mb-2">Magazin fizic:</p>
                      <p>Luni - Vineri: 9:00 - 18:00</p>
                      <p>Sâmbătă: 10:00 - 14:00</p>
                      <p>Duminică: Închis</p>
                      <p className="mt-3 font-medium">Magazin online:</p>
                      <p>Non stop - 24/7</p>
                    </div>
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
                Livrarea se face la locația specificată în ziua de livrare aleasă de tine la checkout.
              </p>
              <p className="text-gray-600 mt-2">
                <strong>Pentru adrese speciale</strong> (în afara locațiilor standard de livrare), te rugăm să ne contactezi pentru a stabili detaliile livrării.
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
