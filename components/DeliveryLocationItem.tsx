'use client';

import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';

interface DeliveryLocationItemProps {
  location: any;
  children: (translatedName: string, translatedInstructions: string) => React.ReactNode;
}

export default function DeliveryLocationItem({ location, children }: DeliveryLocationItemProps) {
  const { value: translatedName } = useDynamicTranslation(
    'deliveryLocation',
    location.id,
    'name',
    location.name
  );

  const { value: translatedInstructions } = useDynamicTranslation(
    'deliveryLocation',
    location.id,
    'specialInstructions',
    location.specialInstructions || ''
  );

  return <>{children(translatedName, translatedInstructions)}</>;
}
