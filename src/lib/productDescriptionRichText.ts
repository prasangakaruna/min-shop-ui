/**
 * Product descriptions may be legacy plain text or HTML from the admin TipTap editor.
 */

export function isStoredDescriptionHtml(s: string | null | undefined): boolean {
  if (!s || typeof s !== 'string') return false;
  const t = s.trim();
  if (!t) return false;
  return /^<\s*[a-z]/i.test(t);
}

/** True when the editor content has no visible text (e.g. empty &lt;p&gt;&lt;/p&gt;). */
export function isEmptyRichDescriptionHtml(html: string): boolean {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/\s+/g, '')
    .trim();
  return text === '';
}

export function stripHtmlForPreview(html: string, maxLen = 140): string {
  if (!html.trim()) return '';
  let text: string;
  if (typeof document !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    text = doc.body.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  } else {
    text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  if (!text) return '';
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}
