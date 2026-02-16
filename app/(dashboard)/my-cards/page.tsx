'use client';

import UserCardsManagement from '@/components/UserCardsManagement';
import { useTranslation } from '@/hooks/useTranslation';

export default function MyCardsPage() {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">💳 {t('myCards.title')}</h1>
        <p className="text-gray-600">
          {t('myCards.subtitle')}
        </p>
      </div>
      
      <UserCardsManagement />
    </div>
  );
}