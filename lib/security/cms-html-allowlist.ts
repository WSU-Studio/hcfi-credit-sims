/** Shared CMS / rich-text HTML allowlists (no DOMPurify — safe for client imports). */

export const CMS_HTML_ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  'ul',
  'ol',
  'li',
  'a',
  'h2',
  'h3',
  'blockquote',
  'img',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'span',
] as const;

export const CMS_HTML_ALLOWED_ATTR = [
  'href',
  'target',
  'rel',
  'src',
  'alt',
  'colspan',
  'rowspan',
] as const;
