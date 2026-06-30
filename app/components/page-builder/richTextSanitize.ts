/** Allowed HTML tags/attrs for rich text widget output (Tiptap). */

export const RICH_TEXT_ALLOWED_TAGS = [
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
];

export const RICH_TEXT_ALLOWED_ATTR = ['href', 'target', 'rel', 'src', 'alt', 'colspan', 'rowspan'];

export const RICH_TEXT_PROSE_CLASSES = [
  '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6',
  '[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6',
  '[&_li]:my-1',
  '[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-white/30 [&_blockquote]:pl-4 [&_blockquote]:opacity-90',
  '[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse',
  '[&_td]:border [&_td]:border-white/20 [&_td]:p-2',
  '[&_th]:border [&_th]:border-white/20 [&_th]:bg-white/10 [&_th]:p-2',
  '[&_img]:my-2 [&_img]:max-h-72 [&_img]:max-w-full [&_img]:rounded',
  '[&_a]:underline [&_a]:text-[#008AEC] hover:[&_a]:text-[#008AEC]/80',
].join(' ');
