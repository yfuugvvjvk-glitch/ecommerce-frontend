'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useMemo } from 'react';

interface PaymentMethodNameProps {
  method: any;
  field: 'name' | 'description';
  children: (translatedText: string) => React.ReactNode;
}

export default function PaymentMethodName({ method, field, children }: PaymentMethodNameProps) {
  const { locale } = useTranslation();
  
  // Use useMemo to recalculate translation when locale changes
  const translatedText = useMemo(() => {
    const fieldName = field === 'name' ? 'name' : 'description';
    const text = locale === 'ro' ? method[fieldName] :
                 locale === 'en' ? (method[`${fieldName}En`] || method[fieldName]) :
                 locale === 'fr' ? (method[`${fieldName}Fr`] || method[fieldName]) :
                 locale === 'de' ? (method[`${fieldName}De`] || method[fieldName]) :
                 locale === 'es' ? (method[`${fieldName}Es`] || method[fieldName]) :
                 locale === 'it' ? (method[`${fieldName}It`] || method[fieldName]) :
                 method[fieldName];
    
    return text || '';
  }, [locale, method, field]);

  return <>{children(translatedText)}</>;
}
