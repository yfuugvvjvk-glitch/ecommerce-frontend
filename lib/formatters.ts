import { Locale } from '@/contexts/TranslationContext';

/**
 * Format currency according to locale
 * @param amount - Amount to format
 * @param locale - Locale code (ro, en, fr, de, es, it)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, locale: Locale = 'ro'): string {
  // Currency mapping by locale
  const currencyMap: Record<Locale, string> = {
    ro: 'RON',
    en: 'USD',
    fr: 'EUR',
    de: 'EUR',
    es: 'EUR',
    it: 'EUR',
  };

  const currency = currencyMap[locale];

  try {
    return new Intl.NumberFormat(locale === 'ro' ? 'ro-RO' : locale === 'en' ? 'en-US' : `${locale}-${locale.toUpperCase()}`, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback to manual formatting if Intl fails
    console.error('Currency formatting error:', error);
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/**
 * Format date according to locale
 * @param date - Date to format
 * @param locale - Locale code (ro, en, fr, de, es, it)
 * @param options - Optional Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  locale: Locale = 'ro',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date);
    return String(date);
  }

  // Default options by locale
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  const mergedOptions = { ...defaultOptions, ...options };

  try {
    const localeString = locale === 'ro' ? 'ro-RO' : locale === 'en' ? 'en-US' : `${locale}-${locale.toUpperCase()}`;
    return new Intl.DateTimeFormat(localeString, mergedOptions).format(dateObj);
  } catch (error) {
    console.error('Date formatting error:', error);
    // Fallback to ISO string
    return dateObj.toLocaleDateString();
  }
}

/**
 * Format number according to locale
 * @param value - Number to format
 * @param locale - Locale code (ro, en, fr, de, es, it)
 * @param options - Optional Intl.NumberFormatOptions
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  locale: Locale = 'ro',
  options?: Intl.NumberFormatOptions
): string {
  try {
    const localeString = locale === 'ro' ? 'ro-RO' : locale === 'en' ? 'en-US' : `${locale}-${locale.toUpperCase()}`;
    return new Intl.NumberFormat(localeString, options).format(value);
  } catch (error) {
    console.error('Number formatting error:', error);
    return String(value);
  }
}

/**
 * Format percentage according to locale
 * @param value - Value to format as percentage (0.15 = 15%)
 * @param locale - Locale code
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, locale: Locale = 'ro'): string {
  try {
    const localeString = locale === 'ro' ? 'ro-RO' : locale === 'en' ? 'en-US' : `${locale}-${locale.toUpperCase()}`;
    return new Intl.NumberFormat(localeString, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (error) {
    console.error('Percentage formatting error:', error);
    return `${(value * 100).toFixed(2)}%`;
  }
}

/**
 * Format time according to locale
 * @param date - Date to format
 * @param locale - Locale code
 * @param options - Optional time format options
 * @returns Formatted time string
 */
export function formatTime(
  date: Date | string | number,
  locale: Locale = 'ro',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date);
    return String(date);
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };

  const mergedOptions = { ...defaultOptions, ...options };

  try {
    const localeString = locale === 'ro' ? 'ro-RO' : locale === 'en' ? 'en-US' : `${locale}-${locale.toUpperCase()}`;
    return new Intl.DateTimeFormat(localeString, mergedOptions).format(dateObj);
  } catch (error) {
    console.error('Time formatting error:', error);
    return dateObj.toLocaleTimeString();
  }
}

/**
 * Format date and time according to locale
 * @param date - Date to format
 * @param locale - Locale code
 * @returns Formatted date and time string
 */
export function formatDateTime(
  date: Date | string | number,
  locale: Locale = 'ro'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date);
    return String(date);
  }

  try {
    const localeString = locale === 'ro' ? 'ro-RO' : locale === 'en' ? 'en-US' : `${locale}-${locale.toUpperCase()}`;
    return new Intl.DateTimeFormat(localeString, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    console.error('DateTime formatting error:', error);
    return dateObj.toLocaleString();
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param date - Date to format
 * @param locale - Locale code
 * @returns Formatted relative time string
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: Locale = 'ro'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date);
    return String(date);
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  try {
    const localeString = locale === 'ro' ? 'ro-RO' : locale === 'en' ? 'en-US' : `${locale}-${locale.toUpperCase()}`;
    const rtf = new Intl.RelativeTimeFormat(localeString, { numeric: 'auto' });

    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else if (diffInSeconds < 2592000) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    } else if (diffInSeconds < 31536000) {
      return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
    }
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return dateObj.toLocaleDateString();
  }
}
