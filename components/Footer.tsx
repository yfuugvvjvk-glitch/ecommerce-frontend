'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SITE_CONFIG } from '@/lib/site-config';
import { useTranslation } from '@/hooks/useTranslation';

export default function Footer() {
  const { t, locale } = useTranslation();
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [aboutContent, setAboutContent] = useState<string>('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    fetchContactInfo();
    fetchAboutContent();
    
    // Update date every second
    const updateDate = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      setCurrentDate(`${day}.${month}.${year}`);
    };
    
    updateDate(); // Initial update
    const interval = setInterval(updateDate, 1000); // Update every second
    
    return () => clearInterval(interval);
  }, [locale]); // Re-fetch when locale changes

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
      if (mainLocation?.workingHours) {
        // Parse structured workingHours and convert to readable format
        try {
          const workingHours = mainLocation.workingHours;
          
          const dayNames: { [key: string]: string } = {
            'monday': t('monday'),
            'tuesday': t('tuesday'),
            'wednesday': t('wednesday'),
            'thursday': t('thursday'),
            'friday': t('friday'),
            'saturday': t('saturday'),
            'sunday': t('sunday'),
            'online': t('onlineStoreSchedule')
          };

          const scheduleLines: string[] = [];
          Object.entries(workingHours).forEach(([day, data]: [string, any]) => {
            // Check if day is open (isOpen === true)
            if (data && typeof data === 'object' && data.isOpen === true) {
              const hours = `${data.start} - ${data.end}`;
              scheduleLines.push(`${dayNames[day] || day}: ${hours}`);
            } else if (typeof data === 'string' && data.trim() !== '' && data.toLowerCase() !== 'închis') {
              // Fallback for string format (shouldn't happen with new structure)
              scheduleLines.push(`${dayNames[day] || day}: ${data}`);
            }
          });
          
          // Add physical store label if we have schedule
          if (scheduleLines.length > 0) {
            scheduleText = `${t('physicalStore')}\n${scheduleLines.join('\n')}\n${t('onlineStoreSchedule')}`;
          } else {
            scheduleText = `${t('physicalStore')} ${t('monday')} - ${t('friday')}: 9:00 - 18:00\n${t('onlineStoreSchedule')}`;
          }
        } catch (e) {
          console.error('Error parsing working hours:', e);
          scheduleText = `${t('physicalStore')} ${t('monday')} - ${t('friday')}: 9:00 - 18:00\n${t('onlineStoreSchedule')}`;
        }
      } else {
        // Default schedule if no workingHours
        scheduleText = `${t('physicalStore')} ${t('monday')} - ${t('friday')}: 9:00 - 18:00\n${t('onlineStoreSchedule')}`;
      }

      // Combine data with priority: mainLocation > siteConfig > defaults
      setContactInfo({
        email: mainLocation?.email || siteConfig?.contact_email || 'crys.cristi@yahoo.com',
        phone: mainLocation?.phone || siteConfig?.contact_phone || '+40753615752',
        address: mainLocation?.address || siteConfig?.contact_address || 'Str. Garii nr. 69, Galați, România',
        schedule: scheduleText || `${t('physicalStore')} ${t('monday')} - ${t('friday')}: 9:00 - 18:00\n${t('onlineStoreSchedule')}`
      });
    } catch (error) {
      console.error('Failed to fetch contact info:', error);
      // Set defaults on error
      setContactInfo({
        email: 'crys.cristi@yahoo.com',
        phone: '+40753615752',
        address: 'Str. Garii nr. 69, Galați, România',
        schedule: `${t('physicalStore')} ${t('monday')} - ${t('friday')}: 9:00 - 18:00\n${t('onlineStoreSchedule')}`
      });
    }
  };

  const fetchAboutContent = async () => {
    try {
      const response = await fetch('/api/public/pages/despre');
      if (response.ok) {
        const page = await response.json();
        if (page?.content) {
          // Extract plain text from HTML content (first 300 characters)
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = page.content;
          const plainText = tempDiv.textContent || tempDiv.innerText || '';
          setAboutContent(plainText.substring(0, 300) + (plainText.length > 300 ? '...' : ''));
        }
      }
      // Silently ignore 404 errors - page doesn't exist yet
    } catch (error) {
      // Silently ignore errors - use default content
    }
  };

  return (
    <footer className="bg-gradient-to-br from-gray-50 to-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* About Section - DINAMIC */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-green-500 pb-2 inline-block">
              {t('pages.aboutUs')}
            </h3>
            <p className="text-gray-700 text-base leading-relaxed">
              {aboutContent || t('pages.aboutFarmContent')}
            </p>
          </div>

          {/* Contact Info - SINCRONIZAT cu delivery location settings */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2 inline-block">
              {t('pages.contactTitle')}
            </h3>
            <ul className="space-y-4">
              <li className="flex items-center text-gray-700 hover:text-blue-600 transition-colors">
                <span className="mr-3 flex-shrink-0">
                  <img src="/images/email.png" className="h-10 w-10 rounded-lg shadow-sm" alt="Email" />
                </span>
                <a 
                  href={`mailto:${contactInfo?.email || 'crys.cristi@yahoo.com'}`}
                  className="hover:underline font-medium"
                >
                  {contactInfo?.email || 'crys.cristi@yahoo.com'}
                </a>
              </li>
              <li className="flex items-center text-gray-700 hover:text-blue-600 transition-colors">
                <span className="mr-3 flex-shrink-0">
                  <img src="/images/phone.jpg" className="h-10 w-10 rounded-lg shadow-sm" alt="Phone" />
                </span>
                <a 
                  href={`tel:${contactInfo?.phone || '+40753615752'}`}
                  className="hover:underline font-medium"
                >
                  {contactInfo?.phone || '+40 753615752'}
                </a>
              </li>
              <li className="flex items-center text-gray-700 hover:text-green-600 transition-colors">
                <span className="mr-3 flex-shrink-0">
                  <img src="/images/whatsapp.png" className="h-10 w-10 rounded-lg shadow-sm" alt="WhatsApp" />
                </span>
                <a 
                  href={`https://wa.me/${(contactInfo?.phone || '+40753615752').replace(/[\s+]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline font-medium"
                >
                  WhatsApp: {contactInfo?.phone || '+40 753615752'}
                </a>
              </li>
              <li className="flex items-start text-gray-700">
                <span className="mr-3 flex-shrink-0 mt-1">
                  <img src="/images/location.png" className="h-10 w-10 rounded-lg shadow-sm" alt="Location" />
                </span>
                <span className="font-medium leading-relaxed">
                  {contactInfo?.address || 'Str. Garii nr. 69, Galați, România'}
                </span>
              </li>
              <li className="flex items-start text-gray-700">
                <span className="mr-3 flex-shrink-0 mt-1">
                  <img src="/images/orar.jpg" className="h-10 w-10 rounded-lg shadow-sm" alt="Schedule" />
                </span>
                <div className="whitespace-pre-line font-medium leading-relaxed">
                  {contactInfo?.schedule || 'Magazin fizic: Luni - Vineri: 9:00 - 18:00\nMagazin online: Non-stop'}
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-300 mt-10 pt-8 text-center">
          <p className="text-gray-600 text-base font-medium">
            {currentDate} {t('siteName')}.
          </p>
        </div>
      </div>
    </footer>
  );
}
