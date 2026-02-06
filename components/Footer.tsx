'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Footer() {
  const [siteConfig, setSiteConfig] = useState<any>(null);

  useEffect(() => {
    fetchSiteConfig();
  }, []);

  const fetchSiteConfig = async () => {
    try {
      const response = await fetch('/api/public/site-config?keys=contact_email,contact_phone,contact_address,business_hours');
      if (response.ok) {
        const config = await response.json();
        setSiteConfig(config);
      }
    } catch (error) {
      console.error('Failed to fetch site config:', error);
    }
  };

  return (
    <footer className="bg-white border-t mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Despre Noi</h3>
            <p className="text-gray-600 text-sm">
              Platforma ta de încredere pentru shopping online. Oferim produse de calitate la prețuri competitive.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Link-uri Rapide</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-gray-600 hover:text-blue-600 text-sm">
                  Produse
                </Link>
              </li>
              <li>
                <Link href="/offers" className="text-gray-600 hover:text-blue-600 text-sm">
                  Oferte
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-blue-600 text-sm">
                  Despre
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-blue-600 text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info - SINCRONIZAT cu setările site */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center text-gray-600">
                <span className="mr-2"> <img src="/images/email.png" className="h-8 w-8" /></span>
                <a 
                  href={`mailto:${siteConfig?.contact_email || 'crys.cristi@yahoo.com'}`}
                  className="hover:text-blue-600 hover:underline"
                >
                  {siteConfig?.contact_email || 'crys.cristi@yahoo.com'}
                </a>
              </li>
              <li className="flex items-center text-gray-600">
                <span className="mr-2"> <img src="/images/phone.jpg" className="h-8 w-8" /></span>
                <a 
                  href={`tel:${siteConfig?.contact_phone || '+40753615752'}`}
                  className="hover:text-blue-600 hover:underline"
                >
                  {siteConfig?.contact_phone || '+40 753615752'}
                </a>
              </li>
              <li className="flex items-start text-gray-600">
                <span className="mr-2"> <img src="/images/location.png" className="h-8 w-8" /></span>
                <span>
                  {siteConfig?.contact_address || 'Str. Garii nr. 69, Galati, România'}
                </span>
              </li>
              <li className="flex items-center text-gray-600">
                <span className="mr-2"> <img src="/images/orar.jpg" className="h-8 w-8" /></span>
                <div>
                  <span>Magazin fizic Luni - Vineri: 9:00 - 18:00</span> <br/>
                  <span>Magazin online Non-stop</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 text-center">
          <p className="text-gray-600 text-sm">
            © 2024 Full-Stack App. Made with ❤️ using Next.js & Fastify
          </p>
        </div>
      </div>
    </footer>
  );
}
