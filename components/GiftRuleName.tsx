'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useMemo } from 'react';

interface GiftRuleNameProps {
  rule: any;
  field: 'name' | 'description';
  children: (translatedText: string) => React.ReactNode;
}

export default function GiftRuleName({ rule, field, children }: GiftRuleNameProps) {
  const { locale } = useTranslation();
  
  // Use useMemo to recalculate translation when locale changes
  const translatedText = useMemo(() => {
    const fieldName = field === 'name' ? 'name' : 'description';
    const text = locale === 'ro' ? rule[fieldName] :
                 locale === 'en' ? (rule[`${fieldName}En`] || rule[fieldName]) :
                 locale === 'fr' ? (rule[`${fieldName}Fr`] || rule[fieldName]) :
                 locale === 'de' ? (rule[`${fieldName}De`] || rule[fieldName]) :
                 locale === 'es' ? (rule[`${fieldName}Es`] || rule[fieldName]) :
                 locale === 'it' ? (rule[`${fieldName}It`] || rule[fieldName]) :
                 rule[fieldName];
    
    return text || '';
  }, [locale, rule, field]);

  return <>{children(translatedText)}</>;
}
