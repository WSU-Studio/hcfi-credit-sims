/** Allowed HTML tags/attrs for rich text widget output (Tiptap). */

export {
  CMS_HTML_ALLOWED_TAGS as RICH_TEXT_ALLOWED_TAGS,
  CMS_HTML_ALLOWED_ATTR as RICH_TEXT_ALLOWED_ATTR,
} from '@/lib/security/cms-html-allowlist';

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
