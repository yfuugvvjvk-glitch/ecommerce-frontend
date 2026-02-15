'use client';

import { useTranslation } from '@/hooks/useTranslation';

interface DeliveryLocationItemProps {
  location: any;
  children: (translatedName: string, translatedInstructions: string) => React.ReactNode;
}

export default function DeliveryLocationItem({ location, children }: DeliveryLocationItemProps) {
  const { locale } = useTranslation();
  
  // Get translated name based on locale
  const translatedName = locale === 'ro' ? location.name :
                        locale === 'en' ? (location.nameEn || location.name) :
                        locale === 'fr' ? (location.nameFr || location.name) :
                        locale === 'de' ? (location.nameDe || location.name) :
                        locale === 'es' ? (location.nameEs || location.name) :
                        locale === 'it' ? (location.nameIt || location.name) :
                        location.name;
  
  // Get translated instructions based on locale
  const translatedInstructions = locale === 'ro' ? (location.specialInstructions || '') :
                                locale === 'en' ? (location.specialInstructionsEn || location.specialInstructions || '') :
                                locale === 'fr' ? (location.specialInstructionsFr || location.specialInstructions || '') :
                                locale === 'de' ? (location.specialInstructionsDe || location.specialInstructions || '') :
                                locale === 'es' ? (location.specialInstructionsEs || location.specialInstructions || '') :
                                locale === 'it' ? (location.specialInstructionsIt || location.specialInstructions || '') :
                                (location.specialInstructions || '');

  return <>{children(translatedName, translatedInstructions)}</>;
}
