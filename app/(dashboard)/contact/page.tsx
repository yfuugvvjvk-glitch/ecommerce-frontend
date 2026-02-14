'use client';

import { useEffect, useState } from 'react';

export default function ContactPage() {
  const [pageContent, setPageContent] = useState<any>(null);
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [deliveryLocations, setDeliveryLocations] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [deliverySchedule, setDeliverySchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Nu mai încărcăm conținutul paginii din backend - folosim conținut implicit
    fetchContactInfo();
    fetchDeliveryLocations();
    fetchPaymentMethods();
    fetchDeliverySchedule();
  }, []);

  const fetchContactInfo = async () => {
    try {
      // Fetch main delivery location (primary source)
      const locationsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/delivery-locations`);
      let mainLocation = null;
      
      if (locationsResponse.ok) {
        const locations = await locationsResponse.json();
        mainLocation = locations.find((loc: any) => loc.isMainLocation);
      }

      // Fetch site config (fallback source)
      const configResponse = await fetch('/api/public/site-config?keys=contact_email,contact_phone,contact_address,business_hours');
      let siteConfig = null;
      
      if (configResponse.ok) {
        siteConfig = await configResponse.json();
      }

      // Parse schedule from mainLocation if available
      let scheduleText = '';
      if (mainLocation?.specialInstructions) {
        // Use specialInstructions field if available (simplified text)
        scheduleText = mainLocation.specialInstructions;
      } else if (mainLocation?.workingHours) {
        // Parse structured workingHours and convert to readable format
        try {
          const workingHours = mainLocation.workingHours;
          
          console.log('Working hours received:', workingHours);
          
          const dayNames: { [key: string]: string } = {
            'monday': 'Luni',
            'tuesday': 'Marți',
            'wednesday': 'Miercuri',
            'thursday': 'Joi',
            'friday': 'Vineri',
            'saturday': 'Sâmbătă',
            'sunday': 'Duminică',
            'online': 'Online'
          };

          const scheduleLines: string[] = [];
          Object.entries(workingHours).forEach(([day, data]: [string, any]) => {
            console.log(`Day: ${day}, Data:`, data);
            // Check if day is open (isOpen === true)
            if (data && typeof data === 'object' && data.isOpen === true) {
              const hours = `${data.start}-${data.end}`;
              scheduleLines.push(`${dayNames[day] || day}: ${hours}`);
            } else if (typeof data === 'string' && data.trim() !== '' && data.toLowerCase() !== 'închis') {
              // Fallback for string format (shouldn't happen with new structure)
              scheduleLines.push(`${dayNames[day] || day}: ${data}`);
            }
          });
          
          scheduleText = scheduleLines.join('\n');
        } catch (e) {
          console.error('Error parsing working hours:', e);
          scheduleText = 'Luni - Vineri: 9:00 - 18:00';
        }
      }

      // Combine data with priority: mainLocation > siteConfig > defaults
      setContactInfo({
        email: mainLocation?.email || siteConfig?.contact_email || 'crys.cristi@yahoo.com',
        phone: mainLocation?.phone || siteConfig?.contact_phone || '+40753615752',
        address: mainLocation?.address || siteConfig?.contact_address || 'Str. Garii nr. 69, Galați, România',
        schedule: scheduleText || 'Luni - Vineri: 9:00 - 18:00'
      });
    } catch (error) {
      console.error('Failed to fetch contact info:', error);
      // Set defaults on error
      setContactInfo({
        email: 'crys.cristi@yahoo.com',
        phone: '+40753615752',
        address: 'Str. Garii nr. 69, Galați, România',
        schedule: 'Luni - Vineri: 9:00 - 18:00'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryLocations = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/delivery-locations`);
      if (response.ok) {
        const locations = await response.json();
        setDeliveryLocations(locations);
      }
    } catch (error) {
      console.error('Failed to fetch delivery locations:', error);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/payment-methods`);
      if (response.ok) {
        const methods = await response.json();
        setPaymentMethods(methods);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    }
  };

  const fetchDeliverySchedule = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/delivery-schedules`);
      if (response.ok) {
        const data = await response.json();
        const schedules = Array.isArray(data) ? data : (data.schedules || []);
        const activeSchedule = schedules.find((s: any) => s.isActive);
        setDeliverySchedule(activeSchedule);
      }
    } catch (error) {
      console.error('Failed to fetch delivery schedule:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            {pageContent?.title || 'Contact'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Suntem aici pentru tine! Contactează-ne pentru orice întrebare sau comandă.
          </p>
        </div>
        
        {pageContent?.content ? (
          (() => {
            try {
              const content = typeof pageContent.content === 'string' 
                ? JSON.parse(pageContent.content) 
                : pageContent.content;
              
              return (
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  {/* Contact Info */}
                  <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
                    <div className="flex items-center mb-6">
                      <div className="bg-blue-100 p-3 rounded-lg mr-3">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">Informații Contact</h2>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <img src="/images/email.png" className="h-10 w-10 mr-4 mt-1" alt="Email" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Email</h3>
                          <a 
                            href={`mailto:${contactInfo?.email || 'crys.cristi@yahoo.com'}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline block text-lg font-medium"
                          >
                            {contactInfo?.email || 'crys.cristi@yahoo.com'}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <img src="/images/phone.jpg" className="h-10 w-10 mr-4 mt-1" alt="Phone" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Telefon</h3>
                          <a 
                            href={`tel:${contactInfo?.phone || '+40753615752'}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline block text-lg font-medium"
                          >
                            {contactInfo?.phone || '+40753615752'}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <img src="/images/whatsapp.png" className="h-10 w-10 mr-4 mt-1" alt="WhatsApp" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">WhatsApp</h3>
                          <a 
                            href={`https://wa.me/${(contactInfo?.phone || '+40753615752').replace(/[\s+]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline block text-lg font-medium"
                          >
                            {contactInfo?.phone || '+40753615752'}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <img src="/images/location.png" className="h-10 w-10 mr-4 mt-1" alt="Location" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Adresă</h3>
                          <p className="text-gray-600 leading-relaxed">
                            {contactInfo?.address || 'Str. Garii nr. 69, Galați, România'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <img src="/images/orar.jpg" className="h-10 w-10 mr-4 mt-1" alt="Schedule" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Program</h3>
                          <div className="text-gray-600 whitespace-pre-line">
                            {contactInfo?.schedule || 'Magazin fizic: Luni - Vineri: 9:00 - 18:00\nMagazin online: Non-stop'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Form */}
                  <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
                    <div className="flex items-center mb-6">
                      <div className="bg-green-100 p-3 rounded-lg mr-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">Trimite-ne un Mesaj</h2>
                    </div>
                    
                    <form className="space-y-5">
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                          Nume *
                        </label>
                        <input
                          type="text"
                          id="name"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Numele tău"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="email@example.com"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                          Subiect *
                        </label>
                        <input
                          type="text"
                          id="subject"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Subiectul mesajului"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                          Mesaj *
                        </label>
                        <textarea
                          id="message"
                          rows={6}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                          placeholder="Scrie mesajul tău aici..."
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        📧 Trimite Mesaj
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
                    href={`mailto:${contactInfo?.email || 'crys.cristi@yahoo.com'}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline block"
                  >
                    {contactInfo?.email || 'crys.cristi@yahoo.com'}
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">📞 Telefon</h3>
                  <a 
                    href={`tel:${contactInfo?.phone || '+40753615752'}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline block"
                  >
                    {contactInfo?.phone || '+40753615752'}
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">💬 WhatsApp</h3>
                  <a 
                    href={`https://wa.me/${(contactInfo?.phone || '+40753615752').replace(/[\s+]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline block"
                  >
                    {contactInfo?.phone || '+40753615752'}
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">📍 Adresă</h3>
                  <p className="text-gray-600">
                    {contactInfo?.address || 'Str. Garii nr. 69, Galați, România'}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">🕐 Program</h3>
                  <div className="text-gray-600 whitespace-pre-line">
                    {contactInfo?.schedule || 'Magazin fizic: Luni - Vineri: 9:00 - 18:00\nMagazin online: Non-stop'}
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
        )}

        {/* FAQ Section - DINAMIC */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center mb-8">
            <div className="bg-purple-100 p-3 rounded-lg mr-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Întrebări Frecvente</h2>
          </div>
          
          <div className="space-y-6">
            <div className="p-5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-bold text-gray-800 mb-3 text-lg flex items-center">
                <span className="text-blue-600 mr-2">❓</span>
                Cum pot plasa o comandă?
              </h3>
              <p className="text-gray-700 leading-relaxed pl-6">
                Adaugă produsele dorite în coș, mergi la checkout și completează datele de livrare.
              </p>
            </div>

            {/* Metode de plată - DINAMIC */}
            {paymentMethods.length > 0 && (
              <div className="p-5 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border-l-4 border-green-500">
                <h3 className="font-bold text-gray-800 mb-3 text-lg flex items-center">
                  <span className="text-green-600 mr-2">💳</span>
                  Care sunt metodele de plată acceptate?
                </h3>
                <p className="text-gray-700 leading-relaxed pl-6">
                  Acceptăm următoarele metode de plată: <strong>{paymentMethods.map(m => m.name).join(', ')}</strong>.
                </p>
              </div>
            )}

            {/* Zile de livrare - DINAMIC */}
            {deliverySchedule && (
              <div className="p-5 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border-l-4 border-yellow-500">
                <h3 className="font-bold text-gray-800 mb-3 text-lg flex items-center">
                  <span className="text-yellow-600 mr-2">📅</span>
                  Când se fac livrările?
                </h3>
                <p className="text-gray-700 leading-relaxed pl-6">
                  Livrările se fac în următoarele zile: <strong>{
                    deliverySchedule.deliveryDays && deliverySchedule.deliveryDays.length > 0
                      ? deliverySchedule.deliveryDays.map((day: number) => {
                          const days = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
                          return days[day];
                        }).join(', ')
                      : 'conform programului stabilit'
                  }</strong>.
                </p>
                {deliverySchedule.deliveryTimeSlots && deliverySchedule.deliveryTimeSlots.length > 0 && (
                  <p className="text-gray-700 mt-2 pl-6">
                    <strong>Intervalul orar:</strong> {deliverySchedule.deliveryTimeSlots[0].startTime} - {deliverySchedule.deliveryTimeSlots[0].endTime}
                  </p>
                )}
              </div>
            )}

            {/* Locații de livrare - DINAMIC */}
            {deliveryLocations.length > 0 && (
              <div className="p-5 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border-l-4 border-purple-500">
                <h3 className="font-bold text-gray-800 mb-3 text-lg flex items-center">
                  <span className="text-purple-600 mr-2">📍</span>
                  În ce zone livrați?
                </h3>
                <div className="text-gray-700 pl-6 space-y-2">
                  {deliveryLocations.map((loc, index) => (
                    <p key={loc.id} className="leading-relaxed">
                      <strong className="text-gray-800">{loc.name}</strong>
                      {loc.deliveryRadius > 0 && (
                        <span className="text-gray-600"> - rază de livrare: <strong className="text-purple-600">{loc.deliveryRadius} km</strong></span>
                      )}
                      {(loc.deliveryRadius === 0 || loc.deliveryRadius === null || loc.deliveryRadius === undefined) && loc.isMainLocation && (
                        <span className="text-gray-600"> - <strong className="text-green-600">ridicare personală</strong></span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="p-5 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border-l-4 border-red-500">
              <h3 className="font-bold text-gray-800 mb-3 text-lg flex items-center">
                <span className="text-red-600 mr-2">🌱</span>
                Produsele sunt proaspete?
              </h3>
              <p className="text-gray-700 leading-relaxed pl-6">
                Da, toate produsele noastre sunt proaspete și de calitate superioară, direct din grădina noastră la tine acasă.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
