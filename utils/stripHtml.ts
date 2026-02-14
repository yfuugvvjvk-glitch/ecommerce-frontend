/**
 * Strips HTML tags from a string and returns plain text
 * Works both on client and server side
 * @param html - HTML string to strip
 * @returns Plain text without HTML tags
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  
  // If we're in browser, use textarea for full entity decoding
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    text = textarea.value;
  }
  
  return text.trim();
}

/**
 * Renders HTML safely in React components
 * Use this when you need to display HTML content
 */
export function renderHtml(html: string) {
  return { __html: html };
}
